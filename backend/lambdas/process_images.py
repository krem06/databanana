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
        gemini_batch_id = event['gemini_batch_id']
        variations = event['variations']
        cognito_user_id = event['cognito_user_id']
        batch_id = event['batch_id']
        bucket = os.environ.get('S3_BUCKET')
        execution_id = event.get('execution_id', 'unknown')
        
        print(f'💼 PROCESS START: execution_id={execution_id} batch_id={batch_id} job_id={gemini_batch_id}')
        
        # Update progress
        update_batch_progress(batch_id, 'ProcessImages', 70, execution_id)
        
        # Get batch results from Gemini
        print(f'📞 GEMINI FETCH: Retrieving results for job_id={gemini_batch_id}')
        batch_responses = gemini_client.batches.list_outputs(name=gemini_batch_id)
        print(f'📄 RESPONSES RECEIVED: {len(batch_responses)} results | execution_id={execution_id}')
        
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
                    print(f'🖼️ PROCESSING IMAGE: index={i} prompt="{variations[i][:30]}..."')
                    
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
                    print(f'✅ IMAGE SAVED: index={i} s3_key={key}')
                else:
                    print(f'⚠️ NO IMAGE DATA: variation={i} prompt="{variations[i][:30]}..."')
                    
            except Exception as e:
                print(f'❌ IMAGE ERROR: index={i} error={str(e)} | execution_id={execution_id}')
                # Continue with other images even if one fails
        
        print(f'✅ PROCESS COMPLETE: {len(images)} images processed | execution_id={execution_id} batch_id={batch_id}')
        
        return {
            **event,
            'images': images
        }
        
    except Exception as e:
        print(f'❌ PROCESS ERROR: {str(e)} | execution_id={execution_id} batch_id={batch_id}')
        raise Exception(f'Failed to process images: {str(e)}')