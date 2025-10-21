import json
from db_utils import get_db, get_cognito_user_id
from cors_utils import get_cors_headers

def handler(event, context):
    try:
        method = event['httpMethod']
        
        if method == 'GET':
            return get_images(event)
        elif method == 'POST':
            cognito_user_id = get_cognito_user_id(event)
            return create_images(cognito_user_id, event)
        elif method == 'PUT':
            cognito_user_id = get_cognito_user_id(event)
            return update_image(cognito_user_id, event)
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': get_cors_headers()
        }

def get_images(event):
    conn = get_db()
    cur = conn.cursor()
    
    batch_id = event.get('queryStringParameters', {})
    if batch_id:
        batch_id = batch_id.get('batch_id')
    
    if batch_id:
        cur.execute('''SELECT id, prompt, url, tags, validated, rejected 
                       FROM images 
                       WHERE batch_id = %s 
                       ORDER BY created_at
                       LIMIT 100''', (batch_id,))
    else:
        cur.execute('''SELECT id, prompt, url, tags 
                       FROM images 
                       WHERE public = true 
                       ORDER BY created_at DESC 
                       LIMIT 100''')
    
    images = [
        {
            'id': row[0],
            'prompt': row[1],
            'url': row[2],
            'tags': json.loads(row[3]) if row[3] else [],
            'selected': row[4] if len(row) > 4 else None,  # validated mapped to 'selected' for frontend
            'rejected': row[5] if len(row) > 5 else None
        }
        for row in cur.fetchall()
    ]
    
    return {
        'statusCode': 200,
        'body': json.dumps({'images': images}),
        'headers': get_cors_headers()
    }

def create_images(cognito_user_id, event):
    """Save generated images to database"""
    body = json.loads(event['body'])
    batch_id = body['batch_id']
    dataset_id = body['dataset_id']
    images = body['images']
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Insert all images for this batch
        for image in images:
            cur.execute('''
                INSERT INTO images (batch_id, dataset_id, prompt, url, tags, validated, rejected) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                batch_id, 
                dataset_id, 
                image['prompt'], 
                image['url'], 
                json.dumps(image.get('tags', [])),
                False,  # validated
                False   # rejected
            ))
        
        conn.commit()
        return {
            'statusCode': 201,
            'body': json.dumps({'success': True}),
            'headers': get_cors_headers()
        }
        
    except Exception as e:
        conn.rollback()
        raise e

def update_image(cognito_user_id, event):
    image_id = event['pathParameters']['id']
    body = json.loads(event['body'])
    
    conn = get_db()
    cur = conn.cursor()
    
    # Verify ownership
    cur.execute('''SELECT 1 FROM images i 
                   JOIN batches b ON i.batch_id = b.id
                   JOIN users u ON b.user_id = u.id
                   WHERE i.id = %s AND u.cognito_id = %s''', (image_id, cognito_user_id))
    
    if not cur.fetchone():
        return {
            'statusCode': 403,
            'body': json.dumps({'error': 'Not authorized'}),
            'headers': get_cors_headers()
        }
    
    # Build update query dynamically
    updates = []
    params = []
    
    if 'selected' in body:
        updates.append('validated = %s')  # Frontend sends 'selected', we store as 'validated'
        params.append(body['selected'])
    
    if 'rejected' in body:
        updates.append('rejected = %s')
        params.append(body['rejected'])
    
    if 'public' in body:
        updates.append('public = %s')
        params.append(body['public'])
    
    if updates:
        params.append(image_id)
        cur.execute(f'UPDATE images SET {", ".join(updates)} WHERE id = %s', params)
        conn.commit()

    return {
        'statusCode': 200,
        'body': json.dumps({'success': True}),
        'headers': get_cors_headers()
    }