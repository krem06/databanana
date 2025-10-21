import json
import os
from google import genai
from db_utils import get_db
from progress_utils import update_batch_progress

# Configure Gemini
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def handler(event, context):
    """
    Step 3: Start Gemini batch job for image generation
    """
    try:
        variations = event['variations']
        batch_id = event['batch_id']
        cognito_user_id = event['cognito_user_id']
        execution_id = event.get('execution_id', 'unknown')
        
        print(f'🖼️ START IMAGE GEN: execution_id={execution_id} batch_id={batch_id} prompts={len(variations)}')
        
        # Update progress in database
        update_batch_progress(batch_id, 'StartImageGeneration', 30, execution_id)
        
        # Create batch job with Gemini
        inline_requests = []
        for variation in variations:
            inline_requests.append({
                'contents': [{
                    'parts': [{'text': f'Generate a high-quality image based on this prompt: {variation}'}],
                    'role': 'user'
                }]
            })
        
        print(f'🚀 GEMINI BATCH: Creating job with {len(inline_requests)} requests')
        
        # Create batch job
        batch_job = gemini_client.batches.create(
            model="models/gemini-2.5-flash-image",
            src=inline_requests,
            config={
                'display_name': f"image-generation-{cognito_user_id}-{batch_id}",
            }
        )
        
        print(f'✅ BATCH CREATED: job_id={batch_job.name} execution_id={execution_id}')
        
        # Update database with batch job ID
        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE batches SET gemini_batch_id = %s WHERE id = %s', 
                   (batch_job.name, batch_id))
        conn.commit()
        print(f'💾 DB UPDATED: batch_id={batch_id} gemini_job={batch_job.name}')
        
        return {
            **event,
            'gemini_batch_id': batch_job.name,
            'status': 'processing'
        }
        
    except Exception as e:
        print(f'❌ IMAGE GEN ERROR: {str(e)} | execution_id={execution_id} batch_id={batch_id}')
        raise Exception(f'Failed to start image generation: {str(e)}')

