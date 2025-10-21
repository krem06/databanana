import json
from db_utils import get_db, get_cognito_user_id, get_cognito_email, get_user_db_id
from cors_utils import get_cors_headers

def handler(event, context):
    print(f"User function called with method: {event.get('httpMethod')}")
    print(f"Event: {json.dumps(event)}")
    
    try:
        cognito_user_id = get_cognito_user_id(event)
        print(f"Cognito User ID: {cognito_user_id}")
        
        # Debug: Print all available claims
        claims = event['requestContext']['authorizer']['claims']
        print(f"All Cognito claims: {claims}")
        
        method = event['httpMethod']
        
        if method == 'GET':
            print("Handling GET request for user data")
            return get_user(cognito_user_id, event)
        elif method == 'POST':
            raise Exception("Credit updates not allowed via API")
            
    except Exception as e:
        print(f"Error in user handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': get_cors_headers()
        }

def get_user(cognito_user_id, event):
    print(f"Getting user data for cognito_user_id: {cognito_user_id}")
    
    try:
        email = get_cognito_email(event)
        print(f"User email: {email}")
        
        user_db_id = get_user_db_id(cognito_user_id, email)
        print(f"User DB ID: {user_db_id}")
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT email, credits FROM users WHERE id = %s', (user_db_id,))
        user = cur.fetchone()
        print(f"User data from DB: {user}")
    except Exception as e:
        print(f"Error getting user: {e}")
        raise
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'id': user_db_id,
            'email': user[0] or '',
            'credits': float(user[1])
        }),
        'headers': get_cors_headers()
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
    
    return {
        'statusCode': 200,
        'body': json.dumps({'credits': float(new_credits)}),
        'headers': get_cors_headers()
    }