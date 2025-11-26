import json
import os
from db_utils import get_db, get_cognito_user_id, get_user_db_id
from progress_utils import update_batch_progress

def handler(event, context):
    """
    Step 1: Validate request and setup batch record
    """
    try:
        # Extract input from Step Functions
        context_text = event['context']
        exclude_tags = event.get('exclude_tags', '')
        image_count = event.get('image_count', 10)
        cognito_user_id = event['cognito_user_id']
        execution_id = event.get('execution_id', 'unknown')
        
        print(f'📋 VALIDATE START: execution_id={execution_id} user={cognito_user_id} images={image_count}')
        
        # Validate image count
        if not isinstance(image_count, int) or image_count < 1 or image_count > 100:
            print(f'❌ VALIDATION ERROR: Invalid image count {image_count}')
            raise ValueError('Image count must be between 10 and 100')
        
        # Check user credits
        cost = image_count * 0.05  # $0.05 per image
        print(f'💰 COST VALIDATION: ${cost:.2f} for {image_count} images')
        
        user_db_id = get_user_db_id(cognito_user_id)
        print(f'👤 USER DB LOOKUP: user_id={user_db_id}')
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT credits FROM users WHERE id = %s', (user_db_id,))
        user_result = cur.fetchone()
        
        if not user_result:
            print(f'❌ USER NOT FOUND: user_id={user_db_id}')
            raise ValueError('User not found')
            
        user_credits = user_result[0]
        print(f'💳 CREDITS CHECK: user has ${user_credits:.2f}, needs ${cost:.2f}')
        
        if user_credits < cost:
            print(f'❌ INSUFFICIENT CREDITS: need ${cost:.2f} but have ${user_credits:.2f}')
            raise ValueError(f'Insufficient credits. Need ${cost:.2f} but you have ${user_credits:.2f}')
        
        print(f'💰 DEDUCTING CREDITS: ${cost:.2f} from user_id={user_db_id}')
        # Deduct credits
        cur.execute('UPDATE users SET credits = credits - %s WHERE id = %s', (cost, user_db_id))
        
        # Create or get today's dataset
        from datetime import date
        today_date = date.today().strftime('%m/%d/%Y')
        dataset_name = f'Images {today_date}'
        
        print(f'📁 DATASET LOOKUP: Finding/creating dataset "{dataset_name}"')
        
        # Check if dataset exists for this user today
        cur.execute('SELECT id FROM datasets WHERE user_id = %s AND name = %s', (user_db_id, dataset_name))
        dataset_result = cur.fetchone()
        
        if dataset_result:
            dataset_id = dataset_result[0]
            print(f'📁 DATASET FOUND: Using existing dataset_id={dataset_id}')
        else:
            # Create new dataset for today
            cur.execute('''INSERT INTO datasets (user_id, name, total_images, total_cost, created_at, updated_at) 
                           VALUES (%s, %s, %s, %s, NOW(), NOW()) RETURNING id''',
                        (user_db_id, dataset_name, 0, 0))
            dataset_id = cur.fetchone()[0]
            print(f'📁 DATASET CREATED: New dataset_id={dataset_id}')
        
        if not dataset_id:
            raise ValueError(f'Failed to create/find dataset for user_id={user_db_id}')
        
        # Update dataset totals
        cur.execute('''UPDATE datasets SET 
                       total_images = total_images + %s, 
                       total_cost = total_cost + %s, 
                       updated_at = NOW() 
                       WHERE id = %s''', (image_count, cost, dataset_id))
        
        # Create batch record with dataset_id
        print(f'📝 CREATING BATCH: dataset_id={dataset_id} user_id={user_db_id} context="{context_text}"')
        cur.execute('''INSERT INTO batches (dataset_id, user_id, context, exclude_tags, image_count, cost, status, current_step, progress, created_at, updated_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()) RETURNING id''',
                    (dataset_id, user_db_id, context_text, exclude_tags, image_count, cost, 'processing', 'ValidateAndSetup', 10))
        batch_id = cur.fetchone()[0]
        
        conn.commit()
        print(f'✅ BATCH CREATED: batch_id={batch_id} execution_id={execution_id}')
        
        # Send progress update
        execution_id = event.get('execution_id')
        update_batch_progress(batch_id, 'ValidateAndSetup', 10, execution_id)
        
        # Return data for next step
        return {
            'execution_id': execution_id,
            'batch_id': batch_id,
            'dataset_id': dataset_id,
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