import json
import os
import stripe
from db_utils import get_cognito_user_id

stripe.api_key = os.environ['STRIPE_SECRET']

def handler(event, context):
    try:
        body = json.loads(event['body'])
        amount = body['amount']
        cognito_user_id = get_cognito_user_id(event)
        
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency='usd',
            metadata={'cognito_user_id': cognito_user_id}
        )
        
        return {'statusCode': 200, 'body': json.dumps({
            'client_secret': intent.client_secret
        })}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}