import json
import os
import time
import boto3
from db_utils import get_db

# DynamoDB for storing connections
dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'websocket-connections'))

def handler(event, context):
    """
    Simple WebSocket handler - just 3 routes: connect, disconnect, subscribe
    """
    try:
        route_key = event.get('requestContext', {}).get('routeKey')
        connection_id = event.get('requestContext', {}).get('connectionId')
        
        if route_key == '$connect':
            # Store connection
            connections_table.put_item(Item={
                'connectionId': connection_id,
                'ttl': int(time.time()) + 3600  # 1 hour TTL
            })
            return {'statusCode': 200}
            
        elif route_key == '$disconnect':
            # Remove connection
            connections_table.delete_item(Key={'connectionId': connection_id})
            return {'statusCode': 200}
            
        elif route_key == 'subscribe':
            # Subscribe to execution updates
            body = json.loads(event.get('body', '{}'))
            execution_id = body.get('execution_id')
            
            # Update connection with execution subscription
            connections_table.update_item(
                Key={'connectionId': connection_id},
                UpdateExpression='SET execution_id = :eid',
                ExpressionAttributeValues={':eid': execution_id}
            )
            return {'statusCode': 200}
            
        return {'statusCode': 400, 'body': 'Unknown route'}
        
    except Exception as e:
        print(f'WebSocket error: {str(e)}')
        return {'statusCode': 500}

def send_progress_update(execution_id, progress_data):
    """
    Send progress update to all connections subscribed to this execution
    Called from Step Functions Lambda functions
    """
    try:
        # Get all connections subscribed to this execution
        response = connections_table.scan(
            FilterExpression='execution_id = :eid',
            ExpressionAttributeValues={':eid': execution_id}
        )
        
        # Get WebSocket API endpoint
        api_id = os.environ.get('WEBSOCKET_API_ID')
        stage = os.environ.get('WEBSOCKET_STAGE', 'prod')
        endpoint_url = f"https://{api_id}.execute-api.{os.environ.get('AWS_REGION', 'eu-west-1')}.amazonaws.com/{stage}"
        
        apigateway = boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)
        
        message = json.dumps({
            'type': 'progress_update',
            'execution_id': execution_id,
            'data': progress_data
        })
        
        # Send to all subscribed connections
        for item in response['Items']:
            connection_id = item['connectionId']
            try:
                apigateway.post_to_connection(
                    ConnectionId=connection_id,
                    Data=message
                )
                print(f'Sent update to {connection_id}')
            except apigateway.exceptions.GoneException:
                # Connection is stale, remove it
                connections_table.delete_item(Key={'connectionId': connection_id})
                print(f'Removed stale connection {connection_id}')
            except Exception as e:
                print(f'Failed to send to {connection_id}: {str(e)}')
                
    except Exception as e:
        print(f'Send progress error: {str(e)}')