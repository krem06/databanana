import json
import os
from google import genai
from progress_utils import update_batch_progress

# Configure Gemini
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def handler(event, context):
    """
    Step 4: Check status of Gemini batch job
    """
    try:
        print(f'Event: {event}')
        
        gemini_batch_id = event['gemini_batch_id']
        mock_mode = event.get('mock_mode', False)
        retry_count = event.get('retryCount', 0)
        batch_id = event['batch_id']
        
        # Update progress - show waiting progress based on retry count
        progress = min(50 + (retry_count * 2), 65)  # Progress from 50% to 65% while waiting
        update_batch_progress(batch_id, 'CheckImageStatus', progress)
        
        # Check real batch status
        batch_status = gemini_client.batches.get(name=gemini_batch_id)
        print(f"Batch status: {batch_status.state}")
        
        # Map Gemini states to our states
        if batch_status.state == 'STATE_SUCCEEDED':
            status = 'completed'
        elif batch_status.state in ['STATE_FAILED', 'STATE_CANCELLED']:
            status = 'failed'
        else:
            status = 'processing'
        
        return {
            **event,
            'status': status,
            'retryCount': retry_count,
            'gemini_state': batch_status.state
        }
        
    except Exception as e:
        print(f'Status check error: {str(e)}')
        # Don't fail the whole workflow for status check errors
        # Instead, increment retry and continue
        return {
            **event,
            'status': 'processing',
            'retryCount': event.get('retryCount', 0) + 1,
            'error': str(e)
        }