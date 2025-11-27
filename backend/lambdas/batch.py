import json
from db_utils import get_db, get_cognito_user_id, get_user_db_id
from cors_utils import get_cors_headers

def handler(event, context):
    method = event['httpMethod']
    
    # Handle OPTIONS preflight requests
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }
    
    try:
        cognito_user_id = get_cognito_user_id(event)
        
        if method == 'GET':
            return get_datasets_with_batches(cognito_user_id)
        elif method == 'POST':
            return create_batch(cognito_user_id, event)
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': get_cors_headers()
        }

def get_datasets_with_batches(cognito_user_id):
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    
    # Get datasets with their batches and images
    cur.execute('''
        SELECT d.id as dataset_id, d.name as dataset_name, d.created_at as dataset_created,
               b.id as batch_id, b.context, b.template, b.exclude_tags, b.cost, b.created_at as batch_created,
               i.id as image_id, i.url, i.prompt, i.validated, i.rejected
        FROM datasets d
        LEFT JOIN batches b ON d.id = b.dataset_id
        LEFT JOIN images i ON b.id = i.batch_id
        WHERE d.user_id = %s
        ORDER BY d.created_at DESC, b.created_at DESC, i.created_at
    ''', (user_db_id,))
    
    # Group by datasets containing batches containing images
    datasets = {}
    for row in cur.fetchall():
        dataset_id, dataset_name, dataset_created, batch_id, context, template, exclude_tags, cost, batch_created, image_id, url, prompt, validated, rejected = row
        
        if dataset_id not in datasets:
            datasets[dataset_id] = {
                'id': dataset_id,
                'name': dataset_name,
                'created_at': dataset_created.isoformat(),
                'batches': {}
            }
        
        if batch_id and batch_id not in datasets[dataset_id]['batches']:
            datasets[dataset_id]['batches'][batch_id] = {
                'id': batch_id,
                'context': context,
                'template': template,
                'excludeTags': exclude_tags or '',
                'cost': float(cost),
                'timestamp': batch_created.isoformat(),
                'images': []
            }
        
        if image_id and batch_id:
            datasets[dataset_id]['batches'][batch_id]['images'].append({
                'id': image_id,
                'url': url,
                'prompt': prompt,
                'selected': validated,
                'rejected': rejected
            })
    
    # Convert to list with proper structure
    result = []
    for dataset in datasets.values():
        result.append({
            'id': dataset['id'],
            'name': dataset['name'],
            'created_at': dataset['created_at'],
            'batches': list(dataset['batches'].values())
        })
    
    return {
        'statusCode': 200,
        'body': json.dumps(result),
        'headers': get_cors_headers()
    }

def create_batch(cognito_user_id, event):
    body = json.loads(event['body'])
    context = body['context']
    exclude_tags = body.get('exclude_tags', '')
    image_count = body['image_count']
    cost = body['cost']
    dataset_name = body.get('dataset_name', f"Dataset: {context[:50]}")
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Always create new dataset (simple approach)
        cur.execute('''INSERT INTO datasets (user_id, name, total_images, total_cost) 
                      VALUES (%s, %s, %s, %s) RETURNING id''',
                   (user_db_id, dataset_name, image_count, cost))
        dataset_id = cur.fetchone()[0]
        
        # Create batch
        cur.execute('''INSERT INTO batches (dataset_id, user_id, context, exclude_tags, image_count, cost, status) 
                      VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id''',
                   (dataset_id, user_db_id, context, exclude_tags, image_count, cost, 'completed'))
        batch_id = cur.fetchone()[0]
        
        conn.commit()
        return {
            'statusCode': 201,
            'body': json.dumps({'batch_id': batch_id, 'dataset_id': dataset_id}),
            'headers': get_cors_headers()
        }
        
    except Exception as e:
        conn.rollback()
        raise e

