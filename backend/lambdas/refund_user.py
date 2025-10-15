import json
from db_utils import get_db, get_user_db_id
from progress_utils import update_batch_completion

def handler(event, context):
    """
    Error handling: Refund user credits when processing fails
    """
    try:
        print(f'Event: {event}')
        
        batch_id = event.get('batch_id')
        cognito_user_id = event['cognito_user_id']
        cost = event['cost']
        
        user_db_id = get_user_db_id(cognito_user_id)
        
        conn = get_db()
        cur = conn.cursor()
        
        # Refund user credits
        cur.execute('UPDATE users SET credits = credits + %s WHERE id = %s', (cost, user_db_id))
        
        conn.commit()
        
        print(f"Refunded ${cost} to user {cognito_user_id}")
        
        # Send failure notification via WebSocket if batch exists
        if batch_id:
            execution_id = event.get('execution_id')
            update_batch_completion(batch_id, 'failed', {
                'error_message': event.get('error', 'Processing failed'),
                'refunded': cost,
                'message': f'Processing failed. ${cost:.2f} has been refunded to your account.'
            }, execution_id)
        
        return {
            'batch_id': batch_id,
            'status': 'failed',
            'refunded': cost,
            'message': f'Processing failed. ${cost} has been refunded to your account.'
        }
        
    except Exception as e:
        print(f'Refund error: {str(e)}')
        # Don't raise here - we don't want refund failures to cause more errors
        return {
            'batch_id': event.get('batch_id'),
            'status': 'failed',
            'refund_error': str(e),
            'message': 'Processing failed. Please contact support for refund.'
        }