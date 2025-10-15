import json
import os
import time
import boto3
from db_utils import get_cognito_user_id, get_db, get_user_db_id, get_cognito_email

def handler(event, context):
    """
    Main handler: Start Step Functions workflow for image generation
    """
    try:
        print(f'Event: {event}')
        body = event['body'] if isinstance(event['body'], dict) else json.loads(event['body'])
        context_text = body['context']
        exclude_tags = body.get('exclude_tags', '')
        image_count = body.get('image_count', 10)
        cognito_user_id = get_cognito_user_id(event)
        
        # Basic validation
        if not isinstance(image_count, int) or image_count < 10 or image_count > 100:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Image count must be between 10 and 100'})}
        
        # Calculate cost and check user credits before starting workflow
        cost = image_count * 0.05
        email = get_cognito_email(event)
        user_db_id = get_user_db_id(cognito_user_id, email)
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT credits FROM users WHERE id = %s', (user_db_id,))
        user_result = cur.fetchone()
        
        if not user_result:
            return {'statusCode': 404, 'body': json.dumps({'error': 'User not found'})}
            
        user_credits = user_result[0]
        
        if user_credits < cost:
            return {'statusCode': 402, 'body': json.dumps({
                'error': f'Insufficient credits. Need ${cost:.2f} but you have ${user_credits:.2f}',
                'required': cost,
                'available': float(user_credits)
            })}
        
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
        
        execution_arn = execution['executionArn']
        
        print(f'Started Step Functions execution: {execution_name}')
        
        return {'statusCode': 202, 'body': json.dumps({
            'execution_id': execution_name,
            'status': 'processing',
            'message': f'Image generation started. Check status at /status/{execution_name}',
            'estimated_cost': cost
        })}
        
    except Exception as e:
        print(f'Error starting workflow: {str(e)}')
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

