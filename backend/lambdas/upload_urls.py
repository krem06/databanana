import json
import boto3
import uuid
import os
from db_utils import get_cognito_user_id
from cors_utils import get_cors_headers

def handler(event, context):
    """Generate presigned URLs for reference image uploads"""
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }
    
    try:
        cognito_user_id = get_cognito_user_id(event)
        body = json.loads(event['body'])
        file_count = body.get('file_count', 1)
        file_types = body.get('file_types', [])
        
        # Validate input
        if not isinstance(file_count, int) or file_count < 1 or file_count > 14:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'file_count must be between 1 and 14'})
            }
        
        # Validate file types
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if file_types and not all(ft in allowed_types for ft in file_types):
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Only JPEG, PNG, and WebP images allowed'})
            }
        
        s3_client = boto3.client('s3')
        bucket_name = os.environ.get('BUCKET_NAME')
        
        presigned_urls = []
        
        for i in range(file_count):
            file_id = str(uuid.uuid4())
            key = f"reference-images/{cognito_user_id}/{file_id}"
            content_type = file_types[i] if i < len(file_types) else 'image/jpeg'
            
            # Generate presigned URL with security constraints
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': key,
                    'ContentType': content_type,
                    'ContentLengthRange': [1, 50 * 1024 * 1024]  # 1 byte to 50MB
                },
                ExpiresIn=300  # 5 minutes
            )
            
            presigned_urls.append({
                'upload_url': presigned_url,
                'file_id': file_id,
                's3_key': key
            })
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'upload_urls': presigned_urls})
        }
        
    except Exception as e:
        print(f'Upload URLs error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }