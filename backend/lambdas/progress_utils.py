"""
Shared utilities for progress tracking and WebSocket updates
"""
from db_utils import get_db

def update_batch_progress(batch_id, current_step, progress, execution_id=None):
    """Update batch progress in database and send WebSocket update"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            UPDATE batches 
            SET current_step = %s, progress = %s, updated_at = NOW() 
            WHERE id = %s
        ''', (current_step, progress, batch_id))
        conn.commit()
        print(f'Updated batch {batch_id}: {current_step} ({progress}%)')
        
        # Send WebSocket update using execution_id for frontend tracking
        if execution_id:
            from websocket_simple import send_progress_update
            
            send_progress_update(execution_id, {
                'batch_id': batch_id,
                'execution_id': execution_id,
                'current_step': current_step,
                'progress': progress,
                'status': 'processing',
                'message': get_step_message(current_step)
            })
            
    except Exception as e:
        print(f'Failed to update progress: {str(e)}')

def update_batch_completion(batch_id, status, final_data=None, execution_id=None):
    """Mark batch as completed or failed and send final WebSocket update"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        if status == 'completed':
            cur.execute('''
                UPDATE batches 
                SET status = %s, current_step = 'Completed', progress = 100, 
                    completed_at = NOW(), updated_at = NOW()
                WHERE id = %s
            ''', (status, batch_id))
        else:
            error_message = final_data.get('error_message', 'Unknown error') if final_data else 'Processing failed'
            cur.execute('''
                UPDATE batches 
                SET status = %s, current_step = 'Failed', 
                    completed_at = NOW(), updated_at = NOW(), error_message = %s
                WHERE id = %s
            ''', (status, error_message, batch_id))
        
        conn.commit()
        print(f'Batch {batch_id} marked as {status}')
        
        # Send final WebSocket update using execution_id
        if execution_id:
            from websocket_simple import send_progress_update
            
            update_data = {
                'batch_id': batch_id,
                'execution_id': execution_id,
                'current_step': 'Completed' if status == 'completed' else 'Failed',
                'progress': 100 if status == 'completed' else 0,
                'status': status,
                'message': 'Processing completed successfully!' if status == 'completed' else 'Processing failed'
            }
            
            if final_data:
                update_data.update(final_data)
                
            send_progress_update(execution_id, update_data)
            
    except Exception as e:
        print(f'Failed to update completion status: {str(e)}')

def get_step_message(step):
    """Get user-friendly message for current step"""
    messages = {
        'ValidateAndSetup': 'Validating request and setting up...',
        'GeneratePrompts': 'Generating creative prompts with AI...',
        'StartImageGeneration': 'Starting image generation process...',
        'CheckImageStatus': 'Waiting for images to be created...',
        'ProcessImages': 'Processing and uploading images...',
        'LabelImages': 'Analyzing images with computer vision...',
        'SaveFinalResults': 'Saving your beautiful results...'
    }
    return messages.get(step, 'Processing...')