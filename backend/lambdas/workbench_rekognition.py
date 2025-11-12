import json
import os
import boto3

def get_workbench_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
        'Content-Type': 'application/json'
    }

# Initialize Rekognition client
rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    """
    Workbench endpoint for testing AWS Rekognition on generated images
    """
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_workbench_cors_headers(),
            'body': ''
        }
    
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract images from request
        images = body.get('images', [])
        
        if not images:
            return {
                'statusCode': 400,
                'headers': get_workbench_cors_headers(),
                'body': json.dumps({
                    'error': 'Images array is required'
                })
            }
        
        print(f'Workbench Rekognition - analyzing {len(images)} images')
        
        # Use the existing label_images handler
        from label_images import handler as label_images_handler
        
        # Create event for label_images function
        label_event = {
            'images': images,
            'batch_id': 'workbench',
            'execution_id': 'workbench-rekognition'
        }
        
        # Process images with rekognition (catch progress update errors for workbench)
        try:
            result = label_images_handler(label_event, context)
            labeled_images = result.get('images', [])
        except Exception as label_error:
            # If label_images fails due to progress_utils, fall back to direct rekognition
            print(f'Label handler failed, using direct rekognition: {str(label_error)}')
            labeled_images = []
            
            bucket = os.environ.get('S3_BUCKET')
            
            for image in images:
                try:
                    # Direct rekognition analysis
                    s3_key = image.get('s3_key', '')
                    if not s3_key:
                        print(f'No s3_key for image {image.get("id", "unknown")}')
                        labeled_images.append(image)
                        continue
                    
                    # Analyze with rekognition
                    labels, bounding_boxes = analyze_image_with_rekognition(bucket, s3_key)
                    
                    # Add labels to image
                    labeled_image = {
                        **image,
                        'rekognition_labels': labels,
                        'bounding_boxes': bounding_boxes,
                        'tags': image.get('tags', []) + [label.lower() for label in labels[:5]]
                    }
                    labeled_images.append(labeled_image)
                    
                except Exception as img_error:
                    print(f'Error processing image {image.get("id")}: {str(img_error)}')
                    labeled_images.append({**image, 'rekognition_labels': [], 'bounding_boxes': [], 'error': str(img_error)})
        
        print(f'Rekognition analysis complete - {len(labeled_images)} images processed')
        
        # Calculate actual cost for rekognition
        image_count = len(labeled_images)
        cost_per_image = 0.001  # $0.001 per image for Rekognition
        total_cost = image_count * cost_per_image
        
        # Return labeled images
        return {
            'statusCode': 200,
            'headers': get_workbench_cors_headers(),
            'body': json.dumps({
                'message': 'Rekognition analysis completed',
                'labeled_images': labeled_images,
                'total_images': len(labeled_images),
                'cost': {
                    'service': 'rekognition',
                    'images_analyzed': image_count,
                    'cost_per_image_usd': cost_per_image,
                    'total_cost_usd': round(total_cost, 6),
                    'pricing_model': 'aws-rekognition',
                    'pricing_tier': 'detect-labels',
                    'rate_per_image_first_1m': 0.001
                }
            })
        }
        
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {str(e)}')
        return {
            'statusCode': 400,
            'headers': get_workbench_cors_headers(),
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'details': str(e)
            })
        }
        
    except Exception as e:
        print(f'Rekognition analysis error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': get_workbench_cors_headers(),
            'body': json.dumps({
                'error': 'Rekognition analysis failed',
                'details': str(e)
            })
        }

def analyze_image_with_rekognition(bucket, s3_key):
    """
    Analyze image using AWS Rekognition for labels and object detection
    """
    try:
        print(f'🤖 REKOGNITION API: bucket={bucket} key={s3_key}')
        
        # Single detect_labels call gets both labels AND bounding boxes
        response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': s3_key}},
            MaxLabels=20,
            MinConfidence=70
        )
        
        # Extract labels
        labels = [label['Name'] for label in response['Labels']]
        print(f'🏷️ LABELS FOUND: {len(labels)} labels detected')
        
        # Extract bounding boxes from the same response
        bounding_boxes = []
        for label in response.get('Labels', []):
            if 'Instances' in label:
                for instance in label['Instances']:
                    if 'BoundingBox' in instance:
                        box = instance['BoundingBox']
                        bounding_boxes.append({
                            'label': label['Name'],
                            'confidence': instance['Confidence'],
                            'left': box['Left'],
                            'top': box['Top'], 
                            'width': box['Width'],
                            'height': box['Height']
                        })
        
        print(f'📦 BOXES FOUND: {len(bounding_boxes)} bounding boxes detected')
        return labels, bounding_boxes
        
    except Exception as e:
        print(f'❌ REKOGNITION ERROR: {str(e)}')
        return [], []