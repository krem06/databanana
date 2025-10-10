import json
import os
import boto3
from io import BytesIO
from google import genai
from anthropic import Anthropic
from db_utils import get_db, get_cognito_user_id, get_user_db_id
from mock_service import mock_claude_variations, mock_gemini_images, mock_rekognition_labels, is_test_mode

# Initialize clients outside handler for reuse
rekognition = boto3.client('rekognition')
anthropic_client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

# Configure Gemini
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def handler(event, context):
    try:
        print(f'Event: {event}')
        body = event['body'] if isinstance(event['body'], dict) else json.loads(event['body'])
        context_text = body['context']
        exclude_tags = body.get('exclude_tags', '')
        image_count = body.get('image_count', 10)
        cognito_user_id = get_cognito_user_id(event)
        
        # Validate image count
        if not isinstance(image_count, int) or image_count < 1 or image_count > 100:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Image count must be between 1 and 100'})}
        
        # Check user credits
        cost = image_count * 0.05  # $0.05 per image
        user_db_id = get_user_db_id(cognito_user_id)
        print(f'User DB ID: {user_db_id}')
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT credits FROM users WHERE id = %s', (user_db_id,))
        user_credits = cur.fetchone()[0]
        print(f'User credits: {user_credits}')
        if user_credits < cost:
            return {'statusCode': 400, 'body': json.dumps({
                'error': f'Insufficient credits. Need ${cost:.2f} but you have ${user_credits:.2f}'
            })}
        
        # Deduct credits first
        cur.execute('UPDATE users SET credits = credits - %s WHERE id = %s', (cost, user_db_id))
        conn.commit()
        print(f'Credits deducted: {cost}')    
        # Generate exact number of variations as requested
        variations = generate_variations(context_text, exclude_tags, image_count)
        images = generate_images_with_gemini(variations, cognito_user_id)
        return
        # Save batch
        batch_id = save_batch(cognito_user_id, context_text, images, cost)
        
        return {'statusCode': 200, 'body': json.dumps({
            'batch_id': batch_id,
            'images': images,
            'cost': cost,
            'remaining_credits': user_credits - cost
        })}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def generate_variations(context, exclude_tags, count):
    # Check for test mode mock
    mock_response = mock_claude_variations(context, exclude_tags, count)
    if mock_response:
        # Parse semicolon-separated mock response
        variations_text = mock_response['content'][0]['text']
        variations = [v.strip() for v in variations_text.split(';') if v.strip()]
        return variations[:count]
    
    # Real API call - single request for all variations
    prompt = f"""Generate exactly {count} diverse, realistic image prompts based on: "{context}"

Rules:
- Each prompt should be a complete, detailed scene description
- Exclude these elements: {exclude_tags}
- Keep each prompt under 50 words
- Make them diverse but thematically related to the original context
- They should be suitable for generating high-quality images
- Scene is always photo realistic with natural lighting
- Include a variety of perspectives and compositions
- Use dynamic angles and framing, realistic motion to enhance visual interest
- Situations can be indoors or outdoors, day or night, urban or nature
- Separate each prompt with a semicolon (;)
- Do not number them or add extra formatting
- Return only the prompts separated by semicolons

Example format: "prompt 1; prompt 2; prompt 3"
"""
    
    try:
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2000,  # Increased for 100 variations
            messages=[{"role": "user", "content": prompt}]
        )
        print(f"Claude Haiku response: {response}")
        # Parse semicolon-separated response
        variations_text = response.content[0].text.strip()
        variations = [v.strip() for v in variations_text.split(';') if v.strip()]
        
        # Ensure we have the right count, pad with fallbacks if needed
        while len(variations) < count:
            variations.append(f"{context} - variation {len(variations) + 1}")
            
        return variations[:count]
        
    except Exception as e:
        print(f"Claude API error: {e}")
        # Fallback variations
        return [f"{context} - variation {i+1}" for i in range(count)]

def generate_images_with_gemini(variations, cognito_user_id):
    # Check for test mode mock
    mock_response = mock_gemini_images(variations)
    if mock_response:
        # Generate mock images without S3 upload
        images = []
        for i, variation in enumerate(variations):
            images.append({
                'id': i,
                'prompt': variation,
                'url': f'https://mock-bucket.s3.amazonaws.com/test/{cognito_user_id}/{i}_{hash(variation)}.png',
                'tags': ['generated', 'gemini', 'mock']
            })
        return images
    
    # Real API calls using batch method
    s3_client = boto3.client('s3')
    bucket = os.environ.get('S3_BUCKET')
    print(f'Bucket: {bucket}')

    # Create inline requests for batch
    inline_requests = []
    for variation in variations:
        inline_requests.append({
            'contents': [{
                'parts': [{'text': f'Generate a high-quality image based on this prompt: {variation}'}],
                'role': 'user'
            }]
        })
    print(f'Inline requests: {inline_requests}')

    try:
        # Create batch job
        batch_job = gemini_client.batches.create(
            model="models/gemini-2.5-flash-lite",
            src=inline_requests,
            config={
                'display_name': f"image-generation-{cognito_user_id}",
            }
        )
        
        print(f"Batch job created: {batch_job}")
        
        # Wait for batch completion and retrieve results
        batch_status = gemini_client.batches.get(name=batch_job.name)
        print(f"Batch job status: {batch_status}")
        
        # Poll until batch is complete
        while batch_status.state not in ['STATE_SUCCEEDED', 'STATE_FAILED', 'STATE_CANCELLED']:
            import time
            time.sleep(5)
            batch_status = gemini_client.batches.get(name=batch_job.name)
            print(f"Batch status: {batch_status.state}")
        
        if batch_status.state != 'STATE_SUCCEEDED':
            raise Exception(f"Batch job failed with state: {batch_status.state}")
        
        # Get batch results
        batch_responses = gemini_client.batches.list_outputs(name=batch_job.name)
        print(f"Batch job responses: {batch_responses}")
        
        images = []
        for i, response in enumerate(batch_responses):
            try:
                # Extract image data from response
                image_parts = [
                    part.inline_data.data
                    for part in response.candidates[0].content.parts
                    if part.inline_data
                ]
                
                if image_parts:
                    print(f"Image data received for variation {i}, uploading to S3")
                    # Upload to S3
                    key = f"generated/{cognito_user_id}/{i}_{hash(variations[i])}.png"
                    s3_client.put_object(
                        Bucket=bucket,
                        Key=key,
                        Body=image_parts[0],
                        ContentType='image/png'
                    )
                    
                    # Generate public URL
                    url = f"https://{bucket}.s3.amazonaws.com/{key}"
                    
                    images.append({
                        'id': i,
                        'prompt': variations[i],
                        'url': url,
                        'tags': ['generated', 'gemini']
                    })
                else:
                    print(f"No image data returned for variation {i}")
                    
            except Exception as e:
                print(f"Error processing batch response {i}: {str(e)}")
        
        return images
        
    except Exception as e:
        print(f"Error creating batch job: {str(e)}")
        raise

def save_batch(cognito_user_id, context, images, cost):
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute('INSERT INTO batches (user_id, context, status, cost) VALUES (%s, %s, %s, %s) RETURNING id',
                (user_db_id, context, 'completed', cost))
    batch_id = cur.fetchone()[0]
    
    for image in images:
        cur.execute('''INSERT INTO images (batch_id, prompt, url, tags) 
                       VALUES (%s, %s, %s, %s)''',
                    (batch_id, image['prompt'], image['url'], json.dumps(image['tags'])))
    
    conn.commit()
    return batch_id