import json
import os
from db_utils import get_db, get_cognito_user_id, get_user_db_id

def handler(event, context):
    """
    Step 1: Validate request and setup batch record
    """
    try:
        print(f'Event: {event}')
        
        # Extract input from Step Functions
        context_text = event['context']
        exclude_tags = event.get('exclude_tags', '')
        image_count = event.get('image_count', 10)
        cognito_user_id = event['cognito_user_id']
        
        # Validate image count
        if not isinstance(image_count, int) or image_count < 10 or image_count > 100:
            raise ValueError('Image count must be between 10 and 100')
        
        # Check user credits
        cost = image_count * 0.05  # $0.05 per image
        user_db_id = get_user_db_id(cognito_user_id)
        print(f'User DB ID: {user_db_id}')
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT credits FROM users WHERE id = %s', (user_db_id,))
        user_result = cur.fetchone()
        
        if not user_result:
            raise ValueError('User not found')
            
        user_credits = user_result[0]
        print(f'User credits: {user_credits}')
        
        if user_credits < cost:
            raise ValueError(f'Insufficient credits. Need ${cost:.2f} but you have ${user_credits:.2f}')
        
        # Deduct credits and create batch record
        cur.execute('UPDATE users SET credits = credits - %s WHERE id = %s', (cost, user_db_id))
        
        # Create batch record with processing status
        cur.execute('''INSERT INTO batches (user_id, context, status, cost, current_step, progress, created_at, updated_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW()) RETURNING id''',
                    (user_db_id, context_text, 'processing', cost, 'ValidateAndSetup', 10))
        batch_id = cur.fetchone()[0]
        
        conn.commit()
        print(f'Credits deducted: {cost}, Batch created: {batch_id}')
        
        # Return data for next step
        return {
            'batch_id': batch_id,
            'context': context_text,
            'exclude_tags': exclude_tags,
            'image_count': image_count,
            'cognito_user_id': cognito_user_id,
            'cost': cost,
            'user_credits': user_credits,
            'retryCount': 0
        }
        
    except Exception as e:
        print(f'Validation error: {str(e)}')
        raise Exception(f'Validation failed: {str(e)}')