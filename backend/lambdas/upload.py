import json
import os
import boto3
from uuid import uuid4

s3 = boto3.client('s3')

def handler(event, context):
    try:
        body = json.loads(event['body'])
        filename = body['filename']
        content_type = body.get('content_type', 'image/jpeg')
        
        # Generate unique key
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'
        key = f"uploads/{uuid4().hex}.{file_ext}"
        
        url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': os.environ['S3_BUCKET'],
                'Key': key,
                'ContentType': content_type
            },
            ExpiresIn=3600
        )
        
        return {'statusCode': 200, 'body': json.dumps({
            'upload_url': url,
            'key': key
        })}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

