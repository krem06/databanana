import json
import os
import time
from google import genai
def get_workbench_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
        'Content-Type': 'application/json'
    }

# Configure Gemini client
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def lambda_handler(event, context):
    """
    Workbench: Start Gemini batch job and return job ID immediately
    """
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_workbench_cors_headers(),
            'body': ''
        }
    
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract prompts from requests
        requests_payload = body.get('requests', [])
        
        if not requests_payload:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({'error': 'Requests array is required'})
            }
        
        # Extract prompts from Gemini request format
        prompts = []
        for request in requests_payload:
            contents = request.get('contents', [])
            if contents and len(contents) > 0:
                parts = contents[0].get('parts', [])
                if parts and len(parts) > 0:
                    text = parts[0].get('text', '')
                    if text:
                        prompts.append(text)
        
        if not prompts:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({'error': 'No valid prompts found in requests'})
            }
        
        print(f'Starting workbench job - {len(prompts)} prompts')
        
        # Create batch job
        inline_requests = []
        for prompt in prompts:
            inline_requests.append({
                'contents': [{
                    'parts': [{'text': prompt}],
                    'role': 'user'
                }]
            })
        
        batch_job = gemini_client.batches.create(
            model="models/gemini-2.5-flash-image",
            src=inline_requests,
            config={'display_name': f"workbench-{int(time.time())}"}
        )
        
        print(f"Created batch job: {batch_job.name}")
        
        # Return job ID immediately (strip batches/ prefix)
        clean_job_id = batch_job.name.replace('batches/', '')
        return {
            'statusCode': 202,  # Accepted
            'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
            'body': json.dumps({
                'job_id': clean_job_id,
                'status': 'processing',
                'message': 'Batch job started. Use job_id to check status.',
                'prompts_count': len(prompts)
            })
        }
        
    except Exception as e:
        print(f'Error starting batch job: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
            'body': json.dumps({
                'error': 'Failed to start batch job',
                'details': str(e)
            })
        }

def handle_options(event, context):
    """Handle CORS preflight requests"""
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': ''
    }