import json
import boto3
import os
from db_utils import get_cognito_user_id, get_db, get_user_db_id
from cors_utils import get_cors_headers

def handler(event, context):
    """Generate signed URLs for private images owned by the user"""
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }
    
    try:
        cognito_user_id = get_cognito_user_id(event)
        user_db_id = get_user_db_id(cognito_user_id)
        body = json.loads(event['body'])
        s3_keys = body.get('s3_keys', [])
        
        if not s3_keys:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'No S3 keys provided'})
            }
        
        # Verify user owns these images
        conn = get_db()
        cur = conn.cursor()
        
        # Get batch IDs for images that belong to this user and are private
        placeholders = ','.join(['%s'] * len(s3_keys))
        cur.execute(f'''
            SELECT i.url FROM images i
            JOIN batches b ON i.batch_id = b.id
            WHERE b.user_id = %s AND b.exclusive_ownership = true AND i.url IN ({placeholders})
        ''', (user_db_id, *s3_keys))
        
        allowed_keys = {row[0] for row in cur.fetchall()}
        
        s3_client = boto3.client('s3')
        bucket_name = os.environ.get('BUCKET_NAME')
        
        signed_urls = {}
        
        for s3_key in s3_keys:
            if s3_key in allowed_keys:
                # Generate signed URL for private image
                signed_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': bucket_name,
                        'Key': s3_key
                    },
                    ExpiresIn=3600  # 1 hour
                )
                signed_urls[s3_key] = signed_url
            else:
                # Return the original key for public images or unauthorized access
                signed_urls[s3_key] = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'signed_urls': signed_urls})
        }
        
    except Exception as e:
        print(f'Signed URLs error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }