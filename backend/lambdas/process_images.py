import json
import os
import boto3
from google import genai
from progress_utils import update_batch_progress

# Configure clients
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
s3_client = boto3.client('s3')

def handler(event, context):
    """
    Step 5: Download and process completed images from Gemini
    """
    try:
        print(f'Event: {event}')
        
        gemini_batch_id = event['gemini_batch_id']
        variations = event['variations']
        cognito_user_id = event['cognito_user_id']
        batch_id = event['batch_id']
        bucket = os.environ.get('S3_BUCKET')
        
        # Update progress
        execution_id = event.get('execution_id')
        update_batch_progress(batch_id, 'ProcessImages', 70, execution_id)
        
        # Get batch results from Gemini
        batch_responses = gemini_client.batches.list_outputs(name=gemini_batch_id)
        print(f"Processing {len(batch_responses)} batch responses")
        
        images = []
        for i, response in enumerate(batch_responses):
            try:
                if i >= len(variations):
                    break
                    
                # Extract image data from response (safe handling)
                image_data = None
                
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data and hasattr(part.inline_data, 'data'):
                        image_data = part.inline_data.data
                        break
                
                if image_data:
                    print(f"Processing image {i}")
                    
                    # Upload to S3
                    key = f"generated/{cognito_user_id}/{i}_{hash(variations[i])}.png"
                    s3_client.put_object(
                        Bucket=bucket,
                        Key=key,
                        Body=image_data,
                        ContentType='image/png'
                    )
                    
                    # Generate public URL
                    url = f"https://{bucket}.s3.amazonaws.com/{key}"
                    
                    images.append({
                        'id': i,
                        'prompt': variations[i],
                        'url': url,
                        'tags': ['generated', 'gemini'],
                        's3_key': key
                    })
                else:
                    print(f"No image data returned for variation {i}")
                    
            except Exception as e:
                print(f"Error processing batch response {i}: {str(e)}")
                # Continue with other images even if one fails
        
        print(f"Successfully processed {len(images)} images")
        
        return {
            **event,
            'images': images
        }
        
    except Exception as e:
        print(f'Image processing error: {str(e)}')
        raise Exception(f'Failed to process images: {str(e)}')