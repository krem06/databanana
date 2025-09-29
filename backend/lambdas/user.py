import json
from db_utils import get_db, get_cognito_user_id, get_user_db_id

def handler(event, context):
    try:
        cognito_user_id = get_cognito_user_id(event)
        method = event['httpMethod']
        
        if method == 'GET':
            return get_user(cognito_user_id)
        elif method == 'POST':
            return update_credits(cognito_user_id, event)
            
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def get_user(cognito_user_id):
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT email, credits FROM users WHERE id = %s', (user_db_id,))
    user = cur.fetchone()
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'id': user_db_id,
            'email': user[0] or '',
            'credits': float(user[1])
        })
    }

def update_credits(cognito_user_id, event):
    body = json.loads(event['body'])
    amount = body['amount']
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('UPDATE users SET credits = credits + %s WHERE id = %s RETURNING credits', 
                (amount, user_db_id))
    new_credits = cur.fetchone()[0]
    conn.commit()
    
    return {'statusCode': 200, 'body': json.dumps({'credits': float(new_credits)})}