import json
import os
import stripe
from db_utils import get_db

stripe.api_key = os.environ['STRIPE_SECRET']

def handler(event, context):
    print(f"Webhook received: {event}")
    
    try:
        # Verify webhook signature (optional but recommended)
        payload = event['body']
        sig_header = event['headers'].get('stripe-signature')
        
        # Parse the event
        if isinstance(payload, str):
            event_data = json.loads(payload)
        else:
            event_data = payload
            
        print(f"Event type: {event_data.get('type')}")
        
        # Handle checkout session completed
        if event_data['type'] == 'checkout.session.completed':
            session = event_data['data']['object']
            
            # Get user info from metadata
            cognito_user_id = session['metadata']['cognito_user_id']
            amount = float(session['metadata']['amount'])
            
            print(f"Payment completed for user {cognito_user_id}, amount: ${amount}")
            
            # Update user credits in existing users table
            conn = get_db()
            cursor = conn.cursor()
            
            # Add credits to user account
            cursor.execute("""
                UPDATE users 
                SET credits = credits + %s 
                WHERE cognito_id = %s
            """, (amount, cognito_user_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"Added ${amount} credits to user {cognito_user_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'received': True}),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json'
            }
        }