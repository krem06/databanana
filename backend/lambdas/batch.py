import json
from db_utils import get_db, get_cognito_user_id, get_user_db_id

def handler(event, context):
    try:
        cognito_user_id = get_cognito_user_id(event)
        method = event['httpMethod']
        
        if method == 'GET':
            return get_batches(cognito_user_id)
        elif method == 'POST':
            return create_batch(cognito_user_id, event)
            
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def get_batches(cognito_user_id):
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''SELECT id, context, status, created_at 
                   FROM batches 
                   WHERE user_id = %s 
                   ORDER BY created_at DESC 
                   LIMIT 50''', (user_db_id,))
    
    batches = [
        {
            'id': row[0],
            'context': row[1],
            'status': row[2],
            'created_at': row[3].isoformat()
        }
        for row in cur.fetchall()
    ]
    
    return {'statusCode': 200, 'body': json.dumps({'batches': batches})}

def create_batch(cognito_user_id, event):
    body = json.loads(event['body'])
    context = body['context']
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO batches (user_id, context, status) VALUES (%s, %s, %s) RETURNING id',
                (user_db_id, context, 'processing'))
    batch_id = cur.fetchone()[0]
    conn.commit()
    
    return {'statusCode': 201, 'body': json.dumps({'batch_id': batch_id})}