import json
import os
import boto3
from anthropic import Anthropic
from db_utils import get_db, get_cognito_user_id, get_user_db_id

# Initialize clients outside handler for reuse
rekognition = boto3.client('rekognition')
anthropic_client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

def handler(event, context):
    try:
        body = json.loads(event['body'])
        context_text = body['context']
        exclude_tags = body.get('exclude_tags', '')
        cognito_user_id = get_cognito_user_id(event)
        
        # Generate variations and mock images (simplified for demo)
        variations = generate_variations(context_text, exclude_tags)
        images = create_mock_images(variations[:10])  # Only 10 for demo
        
        # Save batch
        batch_id = save_batch(cognito_user_id, context_text, images)
        
        return {'statusCode': 200, 'body': json.dumps({
            'batch_id': batch_id,
            'images': images
        })}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def generate_variations(context, exclude_tags):
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

def create_mock_images(variations):
    return [
        {
            'id': i,
            'prompt': variation,
            'url': f'https://picsum.photos/400/300?random={i}',
            'tags': ['demo', 'placeholder']
        }
        for i, variation in enumerate(variations)
    ]

def save_batch(cognito_user_id, context, images):
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute('INSERT INTO batches (user_id, context, status) VALUES (%s, %s, %s) RETURNING id',
                (user_db_id, context, 'completed'))
    batch_id = cur.fetchone()[0]
    
    for image in images:
        cur.execute('''INSERT INTO images (batch_id, prompt, url, tags) 
                       VALUES (%s, %s, %s, %s)''',
                    (batch_id, image['prompt'], image['url'], json.dumps(image['tags'])))
    
    conn.commit()
    return batch_id