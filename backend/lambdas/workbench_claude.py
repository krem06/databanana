import json
import os
from anthropic import Anthropic
def get_workbench_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
        'Content-Type': 'application/json'
    }

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

def lambda_handler(event, context):
    """
    Workbench endpoint for testing Claude API directly
    Accepts raw prompts and returns Claude responses
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
        
        # Extract parameters
        prompt = body.get('prompt', '')
        model = body.get('model', 'claude-3-5-haiku-20241022')
        max_tokens = body.get('max_tokens', 2000)
        
        if not prompt:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({
                    'error': 'Prompt is required'
                })
            }
        
        print(f'Workbench Claude request - Model: {model}, Max tokens: {max_tokens}')
        print(f'Prompt length: {len(prompt)} characters')
        
        # Call Claude API
        response = anthropic_client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{
                "role": "user", 
                "content": prompt
            }]
        )
        
        print(f'Claude response received - Usage: {response.usage}')
        
        # Calculate actual cost (official Claude pricing)
        input_cost = response.usage.input_tokens * 0.80 / 1000000  # $0.80 per million input tokens
        output_cost = response.usage.output_tokens * 4.00 / 1000000  # $4.00 per million output tokens
        total_cost = input_cost + output_cost
        
        # Return response
        return {
            'statusCode': 200,
            'headers': get_workbench_cors_headers(),
            'body': json.dumps({
                'response': {
                    'content': response.content[0].text,
                    'model': response.model,
                    'usage': {
                        'input_tokens': response.usage.input_tokens,
                        'output_tokens': response.usage.output_tokens
                    }
                },
                'raw_text': response.content[0].text,
                'metadata': {
                    'model_used': model,
                    'max_tokens': max_tokens,
                    'prompt_length': len(prompt)
                },
                'cost': {
                    'service': 'claude',
                    'input_tokens': response.usage.input_tokens,
                    'output_tokens': response.usage.output_tokens,
                    'input_cost_usd': round(input_cost, 6),
                    'output_cost_usd': round(output_cost, 6),
                    'total_cost_usd': round(total_cost, 6),
                    'pricing_model': 'claude-3-5-haiku',
                    'pricing_tier': 'standard',
                    'input_rate_per_million': 0.80,
                    'output_rate_per_million': 4.00
                }
            })
        }
        
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {str(e)}')
        return {
            'statusCode': 400,
            'headers': get_workbench_cors_headers(),
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'details': str(e)
            })
        }
        
    except Exception as e:
        print(f'Claude API error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': get_workbench_cors_headers(),
            'body': json.dumps({
                'error': 'Claude API call failed',
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