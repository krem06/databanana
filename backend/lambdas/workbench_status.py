import json
import os
import boto3
from google import genai
from process_images import handler as process_images_handler
from cors_utils import get_cors_headers

# Configure clients
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def lambda_handler(event, context):
    """
    Workbench: Check job status and return results when ready
    """
    try:
        # Get job_id from path parameters
        job_id = event.get('pathParameters', {}).get('job_id')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({'error': 'job_id is required'})
            }
        
        print(f'Checking status for job: {job_id}')
        
        # Check batch status
        try:
            batch_status = gemini_client.batches.get(name=job_id)
        except Exception as e:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({
                    'error': 'Job not found',
                    'job_id': job_id
                })
            }
        
        print(f"Job {job_id} status: {batch_status.state}")
        
        # Return status based on batch state
        if batch_status.state == 'STATE_PENDING':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'pending',
                    'message': 'Job is queued and waiting to start'
                })
            }
            
        elif batch_status.state == 'STATE_RUNNING':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'running',
                    'message': 'Job is currently processing'
                })
            }
            
        elif batch_status.state == 'STATE_SUCCEEDED':
            # Process images and return results
            try:
                # Get original prompts from batch metadata
                # This is a simplified approach - in production you might store this separately
                batch_responses = gemini_client.batches.list_outputs(name=job_id)
                
                # Create prompts list from responses (simplified)
                prompts = [f"prompt_{i}" for i in range(len(batch_responses))]
                
                # Process images using existing function
                process_event = {
                    'gemini_batch_id': job_id,
                    'variations': prompts,
                    'cognito_user_id': 'workbench'
                }
                
                result = process_images_handler(process_event, context)
                images = result.get('images', [])
                
                print(f'Processed {len(images)} images successfully')
                
                return {
                    'statusCode': 200,
                    'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                    'body': json.dumps({
                        'job_id': job_id,
                        'status': 'completed',
                        'message': 'Job completed successfully',
                        'images': images,
                        'summary': {
                            'total_images': len(images),
                            'successful_images': len(images)
                        }
                    })
                }
                
            except Exception as e:
                print(f'Error processing completed job: {str(e)}')
                return {
                    'statusCode': 500,
                    'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                    'body': json.dumps({
                        'job_id': job_id,
                        'status': 'error',
                        'message': 'Job completed but failed to process results',
                        'error': str(e)
                    })
                }
        
        elif batch_status.state in ['STATE_FAILED', 'STATE_CANCELLED']:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'failed',
                    'message': f'Job failed with state: {batch_status.state}'
                })
            }
        
        else:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'unknown',
                    'message': f'Unknown job state: {batch_status.state}'
                })
            }
        
    except Exception as e:
        print(f'Status check error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                    'Content-Type': 'application/json',
                    **get_cors_headers()
                },
            'body': json.dumps({
                'error': 'Failed to check job status',
                'details': str(e)
            })
        }