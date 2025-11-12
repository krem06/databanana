import json
import os
from google import genai
def get_workbench_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
        'Content-Type': 'application/json'
    }

# Configure clients
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

def lambda_handler(event, context):
    """
    Workbench: Check job status and return results when ready
    """
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_workbench_cors_headers(),
            'body': ''
        }
    
    try:
        # Get job_id from path parameters
        job_id = event.get('pathParameters', {}).get('job_id')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({'error': 'job_id is required'})
            }
        
        print(f'Checking status for job: {job_id}')
        
        # Check batch status (add batches/ prefix for Gemini API)
        full_job_id = f"batches/{job_id}"
        try:
            batch_status = gemini_client.batches.get(name=full_job_id)
        except Exception as e:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({
                    'error': 'Job not found',
                    'job_id': job_id
                })
            }
        
        print(f"Job {job_id} status: {batch_status.state}")
        
        # Return status based on batch state (handle both formats)
        state_name = batch_status.state.name if hasattr(batch_status.state, 'name') else str(batch_status.state)
        
        if state_name in ['STATE_PENDING', 'JOB_STATE_PENDING']:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'pending',
                    'message': 'Job is queued and waiting to start'
                })
            }
            
        elif state_name in ['STATE_RUNNING', 'JOB_STATE_RUNNING']:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'running',
                    'message': 'Job is currently processing'
                })
            }
            
        elif state_name in ['STATE_SUCCEEDED', 'JOB_STATE_SUCCEEDED']:
            # Process images and return S3 URLs like production code
            try:
                from process_images import handler as process_images_handler
                
                # Validate all required parameters first
                if not full_job_id:
                    raise Exception("Missing gemini_batch_id")
                
                # Create event with all required fields to prevent undefined variable errors
                process_event = {
                    'gemini_batch_id': full_job_id,
                    'variations': ['workbench_prompt_1', 'workbench_prompt_2', 'workbench_prompt_3'],
                    'cognito_user_id': 'workbench',  
                    'batch_id': 'workbench',
                    'execution_id': 'workbench-execution'
                }
                
                # Process images to get S3 URLs for rekognition
                result = process_images_handler(process_event, context)
                images = result.get('images', [])
                
                # Calculate actual cost for image generation (official Gemini batch pricing)
                image_count = len(images)
                cost_per_image = 0.0195  # $0.0195 per image for Gemini batch tier
                total_cost = image_count * cost_per_image
                
                print(f'Processed {len(images)} images successfully')
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        **get_workbench_cors_headers()
                    },
                    'body': json.dumps({
                        'job_id': job_id,
                        'status': 'completed',
                        'message': 'Job completed successfully',
                        'images': images,
                        'total_images': len(images),
                        'cost': {
                            'service': 'gemini',
                            'images_generated': image_count,
                            'cost_per_image_usd': cost_per_image,
                            'total_cost_usd': round(total_cost, 6),
                            'pricing_model': 'gemini-2.0-flash',
                            'pricing_tier': 'batch',
                            'rate_per_image': 0.0195
                        }
                    })
                }
                
            except Exception as e:
                print(f'Error processing completed job: {str(e)}')
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        **get_workbench_cors_headers()
                    },
                    'body': json.dumps({
                        'job_id': job_id,
                        'status': 'error',
                        'message': 'Job completed but failed to process results',
                        'error': str(e)
                    })
                }
        
        elif state_name in ['STATE_FAILED', 'STATE_CANCELLED', 'JOB_STATE_FAILED', 'JOB_STATE_CANCELLED']:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'failed',
                    'message': f'Job failed with state: {state_name}'
                })
            }
        
        else:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
                'body': json.dumps({
                    'job_id': job_id,
                    'status': 'unknown',
                    'message': f'Unknown job state: {state_name}'
                })
            }
        
    except Exception as e:
        print(f'Status check error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                    'Content-Type': 'application/json',
                    **get_workbench_cors_headers()
                },
            'body': json.dumps({
                'error': 'Failed to check job status',
                'details': str(e)
            })
        }