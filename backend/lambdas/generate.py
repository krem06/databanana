import json
import os
import time
import boto3
from db_utils import get_cognito_user_id, get_db, get_user_db_id, get_cognito_email
from cors_utils import get_cors_headers

def cors_response(status_code, body):
    """Helper function to create response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps(body)
    }

def handler(event, context):
    """
    Main handler: Start Step Functions workflow for image generation
    """
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return cors_response(200, {})
    
    try:
        print(f'Event: {event}')
        body = event['body'] if isinstance(event['body'], dict) else json.loads(event['body'])
        context_text = body['context']
        exclude_tags = body.get('exclude_tags', '')
        image_count = body.get('image_count', 10)
        cognito_user_id = get_cognito_user_id(event)
        print(f'🚀 GENERATE START: context="{context_text[:50]}..." images={image_count} user={cognito_user_id}')
        
        # Basic validation
        if not isinstance(image_count, int) or image_count < 10 or image_count > 100:
            print(f'❌ VALIDATION ERROR: Invalid image count {image_count}')
            return cors_response(400, {'error': 'Image count must be between 10 and 100'})
        
        # Calculate cost and check user credits before starting workflow
        cost = image_count * 0.05
        print(f'💰 COST CHECK: ${cost:.2f} required for {image_count} images')
        
        email = get_cognito_email(event)
        user_db_id = get_user_db_id(cognito_user_id, email)
        print(f'👤 USER LOOKUP: email={email} db_id={user_db_id}')
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT credits FROM users WHERE id = %s', (user_db_id,))
        user_result = cur.fetchone()
        
        if not user_result:
            print(f'❌ USER ERROR: User not found in database db_id={user_db_id}')
            return cors_response(404, {'error': 'User not found'})
            
        user_credits = user_result[0]
        print(f'💳 CREDITS: user has ${user_credits:.2f}, needs ${cost:.2f}')
        
        if user_credits < cost:
            print(f'❌ INSUFFICIENT CREDITS: need ${cost:.2f} but have ${user_credits:.2f}')
            return cors_response(402, {
                'error': f'Insufficient credits. Need ${cost:.2f} but you have ${user_credits:.2f}',
                'required': cost,
                'available': float(user_credits)
            })
        
        # Start Step Functions workflow
        stepfunctions = boto3.client('stepfunctions')
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN')
        
        workflow_input = {
            'context': context_text,
            'exclude_tags': exclude_tags,
            'image_count': image_count,
            'cognito_user_id': cognito_user_id
        }
        
        execution_name = f"image-generation-{cognito_user_id}-{int(time.time())}"
        
        # Add execution_id to workflow input
        workflow_input['execution_id'] = execution_name
        
        execution = stepfunctions.start_execution(
            stateMachineArn=state_machine_arn,
            name=execution_name,
            input=json.dumps(workflow_input)
        )
        
        print(f'✅ STEP FUNCTIONS STARTED: execution_id={execution_name}')
        
        return cors_response(202, {
            'execution_id': execution_name,
            'status': 'processing',
            'message': f'Image generation started. Check status at /status/{execution_name}',
            'estimated_cost': cost
        })
        
    except Exception as e:
        print(f'❌ GENERATE ERROR: {str(e)} | user={cognito_user_id} images={image_count}')
        return cors_response(500, {'error': str(e)})

