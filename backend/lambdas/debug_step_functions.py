import json
import os
import boto3
from datetime import datetime, timedelta
from cors_utils import get_cors_headers

def handler(event, context):
    """
    Debug and monitoring endpoint for Step Functions executions
    GET /debug/executions - List recent executions
    GET /debug/executions/{execution_id} - Get execution details
    """
    try:
        stepfunctions = boto3.client('stepfunctions')
        
        # Get path and method
        path = event.get('pathParameters', {})
        method = event.get('httpMethod', 'GET')
        execution_id = path.get('execution_id') if path else None
        
        if execution_id:
            # Get specific execution details
            state_machine_arn = get_state_machine_arn()
            execution_arn = f"{state_machine_arn.rsplit(':', 1)[0]}:execution:ImageGenerationStateMachine:{execution_id}"
            
            try:
                # Get execution details
                execution = stepfunctions.describe_execution(executionArn=execution_arn)
                
                # Get execution history
                history = stepfunctions.get_execution_history(
                    executionArn=execution_arn,
                    maxResults=50,
                    reverseOrder=True
                )
                
                # Format the response
                response_data = {
                    'execution': {
                        'executionArn': execution['executionArn'],
                        'name': execution['name'],
                        'status': execution['status'],
                        'startDate': execution['startDate'].isoformat(),
                        'stopDate': execution.get('stopDate', '').isoformat() if execution.get('stopDate') else None,
                        'input': json.loads(execution['input']),
                        'output': json.loads(execution.get('output', '{}')) if execution.get('output') else None,
                        'error': execution.get('error'),
                        'cause': execution.get('cause')
                    },
                    'history': format_execution_history(history['events'])
                }
                
                return {
                    'statusCode': 200,
                    'headers': get_cors_headers(),
                    'body': json.dumps(response_data, default=str)
                }
                
            except stepfunctions.exceptions.ExecutionDoesNotExist:
                return {
                    'statusCode': 404,
                    'headers': get_cors_headers(),
                    'body': json.dumps({'error': 'Execution not found'})
                }
        else:
            # List recent executions
            state_machine_arn = get_state_machine_arn()
            
            executions = stepfunctions.list_executions(
                stateMachineArn=state_machine_arn,
                maxResults=20
            )
            
            formatted_executions = []
            for exec in executions['executions']:
                formatted_executions.append({
                    'name': exec['name'],
                    'status': exec['status'],
                    'startDate': exec['startDate'].isoformat(),
                    'stopDate': exec.get('stopDate', '').isoformat() if exec.get('stopDate') else None,
                    'executionArn': exec['executionArn']
                })
            
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'executions': formatted_executions,
                    'stateMachineArn': state_machine_arn
                }, default=str)
            }
            
    except Exception as e:
        print(f'Debug error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def get_state_machine_arn():
    """Get the state machine ARN from environment"""
    return os.environ.get('STATE_MACHINE_ARN')

def get_cors_headers():
    """Get CORS headers for API responses"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }

def format_execution_history(events):
    """Format execution history for easier reading"""
    formatted_events = []
    
    for event in events:
        event_type = event['type']
        timestamp = event['timestamp'].isoformat()
        
        formatted_event = {
            'timestamp': timestamp,
            'type': event_type,
            'id': event['id']
        }
        
        # Add relevant details based on event type
        if event_type == 'TaskStateEntered':
            formatted_event['stateName'] = event['stateEnteredEventDetails']['name']
        elif event_type == 'TaskStateExited':
            formatted_event['stateName'] = event['stateExitedEventDetails']['name']
            if 'output' in event['stateExitedEventDetails']:
                try:
                    formatted_event['output'] = json.loads(event['stateExitedEventDetails']['output'])
                except:
                    formatted_event['output'] = event['stateExitedEventDetails']['output']
        elif event_type == 'TaskFailed':
            formatted_event['error'] = event['taskFailedEventDetails'].get('error')
            formatted_event['cause'] = event['taskFailedEventDetails'].get('cause')
        elif event_type == 'ExecutionFailed':
            formatted_event['error'] = event['executionFailedEventDetails'].get('error')
            formatted_event['cause'] = event['executionFailedEventDetails'].get('cause')
        
        formatted_events.append(formatted_event)
    
    return formatted_events

