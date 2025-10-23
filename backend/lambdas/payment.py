import json
import os
import stripe
from db_utils import get_cognito_user_id
from cors_utils import get_cors_headers

# Use test or live Stripe key based on TEST_MODE
test_mode = os.environ.get('TEST_MODE', 'false').lower() == 'true'
stripe.api_key = os.environ.get('STRIPE_SECRET_TEST') if test_mode else os.environ.get('STRIPE_SECRET')

def handler(event, context):
    print(f"Payment function called")
    
    # Handle OPTIONS preflight requests
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }
    
    try:
        print(f"Parsing request body")
        body = json.loads(event['body'])
        amount = body['amount']
        print(f"Amount: ${amount}")
        
        cognito_user_id = get_cognito_user_id(event)
        print(f"User ID: {cognito_user_id}")
        
        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Databanana Credits - ${amount}',
                        'description': f'Add ${amount} to your account balance'
                    },
                    'unit_amount': int(amount * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=os.environ.get('FRONTEND_URL', 'http://localhost:5173') + '/account?payment=success',
            cancel_url=os.environ.get('FRONTEND_URL', 'http://localhost:5173') + '/account?payment=cancelled',
            metadata={'cognito_user_id': cognito_user_id, 'amount': str(amount)}
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'sessionId': session.id,
                'checkout_url': session.url
            }),
            'headers': get_cors_headers()
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': get_cors_headers()
        }