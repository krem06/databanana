import json
import os
from anthropic import Anthropic
from cors_utils import get_cors_headers

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

def lambda_handler(event, context):
    """
    Workbench endpoint for testing Claude API directly
    Accepts raw prompts and returns Claude responses
    """
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
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                **get_cors_headers()
            },
            'body': json.dumps({
                'response': {
                    'content': response.content,
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
                }
            })
        }
        
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {str(e)}')
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                **get_cors_headers()
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'details': str(e)
            })
        }
        
    except Exception as e:
        print(f'Claude API error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                **get_cors_headers()
            },
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