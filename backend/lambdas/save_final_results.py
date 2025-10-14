import json
from db_utils import get_db
from progress_utils import update_batch_completion

def handler(event, context):
    """
    Step 7: Save final results to database and mark batch as completed
    """
    try:
        print(f'Event: {event}')
        
        batch_id = event['batch_id']
        images = event['images']
        
        conn = get_db()
        cur = conn.cursor()
        
        # Save each image to database
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
        
        print(f"Saved {len(images)} images for batch {batch_id}")
        
        # Send completion notification via WebSocket
        update_batch_completion(batch_id, 'completed', {
            'image_count': len(images),
            'images': images[:5],  # Send first 5 images for preview
            'message': f'Successfully generated {len(images)} images!'
        })
        
        return {
            'batch_id': batch_id,
            'status': 'completed',
            'image_count': len(images),
            'message': 'Image generation and processing completed successfully'
        }
        
    except Exception as e:
        print(f'Save results error: {str(e)}')
        raise Exception(f'Failed to save final results: {str(e)}')