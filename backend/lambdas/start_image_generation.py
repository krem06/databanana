import json
import os
from google import genai
from db_utils import get_db
from mock_service import mock_gemini_images
from progress_utils import update_batch_progress

# Configure Gemini
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def handler(event, context):
    """
    Step 3: Start Gemini batch job for image generation
    """
    try:
        print(f'Event: {event}')
        
        variations = event['variations']
        batch_id = event['batch_id']
        cognito_user_id = event['cognito_user_id']
        
        # Update progress in database
        update_batch_progress(batch_id, 'StartImageGeneration', 30)
        
        # Check for test mode
        mock_response = mock_gemini_images(variations)
        if mock_response:
            # For test mode, simulate immediate completion
            return {
                **event,
                'gemini_batch_id': 'mock_batch_123',
                'status': 'completed',
                'mock_mode': True
            }
        
        # Create batch job with Gemini
        inline_requests = []
        for variation in variations:
            inline_requests.append({
                'contents': [{
                    'parts': [{'text': f'Generate a high-quality image based on this prompt: {variation}'}],
                    'role': 'user'
                }]
            })
        
        print(f'Creating batch job with {len(inline_requests)} requests')
        
        # Create batch job
        batch_job = gemini_client.batches.create(
            model="models/gemini-2.5-flash-image-preview",
            src=inline_requests,
            config={
                'display_name': f"image-generation-{cognito_user_id}-{batch_id}",
            }
        )
        
        print(f"Batch job created: {batch_job.name}")
        
        # Update database with batch job ID
        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE batches SET gemini_batch_id = %s WHERE id = %s', 
                   (batch_job.name, batch_id))
        conn.commit()
        
        return {
            **event,
            'gemini_batch_id': batch_job.name,
            'status': 'processing',
            'mock_mode': False
        }
        
    except Exception as e:
        print(f'Image generation start error: {str(e)}')
        raise Exception(f'Failed to start image generation: {str(e)}')

