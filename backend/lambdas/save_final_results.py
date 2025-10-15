import json
from db_utils import get_db
from progress_utils import update_batch_completion

def handler(event, context):
    """
    Step 7: Save final results to database and mark batch as completed
    """
    try:
        batch_id = event['batch_id']
        images = event['images']
        execution_id = event.get('execution_id', 'unknown')
        
        print(f'💾 SAVE START: execution_id={execution_id} batch_id={batch_id} images={len(images)}')
        
        conn = get_db()
        cur = conn.cursor()
        
        # Save each image to database
        print(f'📝 DATABASE: Saving {len(images)} images to batch_id={batch_id}')
        for image in images:
            cur.execute('''
                INSERT INTO images (batch_id, prompt, url, tags, rekognition_labels, bounding_boxes) 
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                batch_id,
                image['prompt'],
                image['url'],
                json.dumps(image.get('tags', [])),
                json.dumps(image.get('rekognition_labels', [])),
                json.dumps(image.get('bounding_boxes', []))
            ))
        
        # Update batch status to completed with WebSocket notification
        cur.execute('''
            UPDATE batches 
            SET image_count = %s 
            WHERE id = %s
        ''', (len(images), batch_id))
        
        conn.commit()
        print(f'✅ DB SAVED: {len(images)} images committed to database | execution_id={execution_id}')
        
        # Send completion notification via WebSocket
        print(f'📡 WEBSOCKET: Sending completion notification execution_id={execution_id}')
        update_batch_completion(batch_id, 'completed', {
            'image_count': len(images),
            'images': images[:5],  # Send first 5 images for preview
            'message': f'Successfully generated {len(images)} images!'
        }, execution_id)
        
        print(f'✅ WORKFLOW COMPLETE: execution_id={execution_id} batch_id={batch_id} images={len(images)}')
        
        return {
            'batch_id': batch_id,
            'status': 'completed',
            'image_count': len(images),
            'message': 'Image generation and processing completed successfully'
        }
        
    except Exception as e:
        print(f'❌ SAVE ERROR: {str(e)} | execution_id={execution_id} batch_id={batch_id}')
        raise Exception(f'Failed to save final results: {str(e)}')