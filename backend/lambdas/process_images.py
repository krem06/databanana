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
        batch_job = gemini_client.batches.get(name=gemini_batch_id)
        
        print(f'🔍 BATCH JOB DEBUG: state={batch_job.state.name}')
        print(f'🔍 BATCH JOB DEST: {batch_job.dest}')
        
        if batch_job.state.name != 'JOB_STATE_SUCCEEDED':
            raise Exception(f'Batch job not succeeded: {batch_job.state.name}')
            
        # Check if responses are inlined in the batch job
        if hasattr(batch_job.dest, 'inlined_responses') and batch_job.dest.inlined_responses:
            print(f'🔍 USING INLINED RESPONSES: {len(batch_job.dest.inlined_responses)} responses')
            batch_responses = [resp.response for resp in batch_job.dest.inlined_responses]
        elif hasattr(batch_job.dest, 'output_uri') and batch_job.dest.output_uri:
            print(f'🔍 USING OUTPUT_URI: {batch_job.dest.output_uri}')
            # Extract file name from output_uri
            import re
            file_match = re.search(r'files/([^/]+)$', batch_job.dest.output_uri)
            if file_match:
                result_file_name = file_match.group(1)
            else:
                raise Exception(f'Could not extract file name from output_uri: {batch_job.dest.output_uri}')
            print(f'📁 DOWNLOADING FILE: {result_file_name}')
            file_content_bytes = gemini_client.files.download(file=result_file_name)
            file_content = file_content_bytes.decode('utf-8')
            
            # Parse JSONL responses
            batch_responses = []
            for line in file_content.splitlines():
                if line.strip():
                    import json
                    response_data = json.loads(line)
                    if 'response' in response_data:
                        batch_responses.append(response_data['response'])
        elif hasattr(batch_job.dest, 'file_name') and batch_job.dest.file_name:
            result_file_name = batch_job.dest.file_name
            print(f'📁 DOWNLOADING FILE: {result_file_name}')
            file_content_bytes = gemini_client.files.download(file=result_file_name)
            file_content = file_content_bytes.decode('utf-8')
            
            # Parse JSONL responses
            batch_responses = []
            for line in file_content.splitlines():
                if line.strip():
                    import json
                    response_data = json.loads(line)
                    if 'response' in response_data:
                        batch_responses.append(response_data['response'])
        else:
            raise Exception(f'No valid file reference found in batch job dest: {batch_job.dest}')
        
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
                    
                    # Generate pre-signed URL (valid for 24 hours)
                    url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': bucket, 'Key': key},
                        ExpiresIn=86400  # 24 hours
                    )
                    
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