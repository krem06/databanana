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
        body = json.loads(event['body'])
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
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT credits FROM users WHERE id = %s', (user_db_id,))
        user_credits = cur.fetchone()[0]
        
        if user_credits < cost:
            return {'statusCode': 400, 'body': json.dumps({
                'error': f'Insufficient credits. Need ${cost:.2f} but you have ${user_credits:.2f}'
            })}
        
        # Deduct credits first
        cur.execute('UPDATE users SET credits = credits - %s WHERE id = %s', (cost, user_db_id))
        conn.commit()
        
        # Generate variations and real images
        variations = generate_variations(context_text, exclude_tags)
        images = generate_images_with_gemini(variations[:image_count], cognito_user_id)
        
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

def generate_variations(context, exclude_tags):
    # Check for test mode mock
    mock_response = mock_claude_variations(context, exclude_tags)
    if mock_response:
        # Parse the mock response to extract variations
        content_data = json.loads(mock_response['content'][0]['text'])
        return content_data['variations'][:10]  # Return first 10 variations
    
    # Real API call
    prompt = f"""Generate 10 realistic image prompts for: "{context}"
    Exclude: {exclude_tags}
    Return JSON array of short descriptions."""
    
    try:
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.content[0].text)
    except:
        # Fallback variations
        return [f"{context} - variation {i+1}" for i in range(10)]

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
    
    # Real API calls
    images = []
    s3_client = boto3.client('s3')
    bucket = os.environ.get('S3_BUCKET')
    
    for i, variation in enumerate(variations):
        try:
            # Generate image with Gemini
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[f"Generate a high-quality image based on this prompt: {variation}"]
            )
            
            # Extract image data from response
            image_parts = [
                part.inline_data.data
                for part in response.candidates[0].content.parts
                if part.inline_data
            ]
            
            if image_parts:
                # Upload to S3
                key = f"generated/{cognito_user_id}/{i}_{hash(variation)}.png"
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
                    'prompt': variation,
                    'url': url,
                    'tags': ['generated', 'gemini']
                })
            else:
                raise ValueError("No image data returned from Gemini")
                
        except Exception as e:
            print(f"Error generating image {i}: {str(e)}")
    
    return images

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