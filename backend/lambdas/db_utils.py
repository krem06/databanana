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
            password=os.environ['DB_PASSWORD']
        )
    return _connection

def get_user_db_id(cognito_id: str) -> Optional[int]:
    """Get or create user, return database ID"""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute('SELECT id FROM users WHERE cognito_id = %s', (cognito_id,))
    user = cur.fetchone()
    
    if not user:
        cur.execute('INSERT INTO users (cognito_id, email, credits) VALUES (%s, %s, %s) RETURNING id', 
                    (cognito_id, '', 0))
        user_db_id = cur.fetchone()[0]
        conn.commit()
        return user_db_id
    
    return user[0]

def get_cognito_user_id(event) -> str:
    """Extract Cognito user ID from Lambda event"""
    return event['requestContext']['authorizer']['claims']['sub']