import os
import psycopg2
from typing import Optional

# Reuse connection for cold start optimization
_connection = None

def get_db():
    global _connection
    if _connection is None or _connection.closed:
        _connection = psycopg2.connect(
            host=os.environ['DB_HOST'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD'],
            sslmode='require'
        )
    return _connection

def get_user_db_id(cognito_id: str, email: str = '') -> Optional[int]:
    """Get or create user, return database ID"""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute('SELECT id, email FROM users WHERE cognito_id = %s', (cognito_id,))
    user = cur.fetchone()
    
    if not user:
        # Create new user
        cur.execute('INSERT INTO users (cognito_id, email, credits) VALUES (%s, %s, %s) RETURNING id', 
                    (cognito_id, email, 0))
        user_db_id = cur.fetchone()[0]
        conn.commit()
        print(f"Created new user with email: {email}")
        return user_db_id
    else:
        user_db_id, current_email = user
        # Update email if it's empty and we have a new email
        if not current_email and email:
            cur.execute('UPDATE users SET email = %s WHERE id = %s', (email, user_db_id))
            conn.commit()
            print(f"Updated existing user email to: {email}")
        return user_db_id

def get_cognito_user_id(event) -> str:
    """Extract Cognito user ID from Lambda event"""
    # Try authorizer claims first (API Gateway with Cognito User Pool)
    try:
        return event['requestContext']['authorizer']['claims']['sub']
    except KeyError:
        # Fallback: decode JWT from Authorization header
        import base64
        import json
        
        auth_header = event.get('headers', {}).get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer ' prefix
            # Decode JWT payload (second part)
            payload = token.split('.')[1]
            # Add padding if needed
            payload += '=' * (4 - len(payload) % 4)
            decoded = base64.b64decode(payload)
            claims = json.loads(decoded)
            return claims['sub']
        
        raise ValueError("No user ID found in event")

def get_cognito_email(event) -> str:
    """Extract email from Cognito claims"""
    # Try authorizer claims first
    try:
        email = event['requestContext']['authorizer']['claims'].get('email', '')
        print(f"Extracted email from authorizer claims: {email}")
        return email
    except KeyError:
        # Fallback: decode JWT from Authorization header
        import base64
        import json
        
        auth_header = event.get('headers', {}).get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            payload = token.split('.')[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = base64.b64decode(payload)
            claims = json.loads(decoded)
            email = claims.get('email', '')
            print(f"Extracted email from JWT: {email}")
            return email
        
        return ''