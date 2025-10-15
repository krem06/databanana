import json
import os
import boto3
from progress_utils import update_batch_progress

# Initialize Rekognition client
rekognition = boto3.client('rekognition')

def handler(event, context):
    """
    Step 6: Use AWS Rekognition to label and detect objects in images
    """
    try:
        images = event['images']
        batch_id = event['batch_id']
        bucket = os.environ.get('S3_BUCKET')
        execution_id = event.get('execution_id', 'unknown')
        
        print(f'🏷️ LABEL START: execution_id={execution_id} batch_id={batch_id} images={len(images)}')
        
        # Update progress
        update_batch_progress(batch_id, 'LabelImages', 80, execution_id)
        
        labeled_images = []
        
        for image in images:
            try:
                print(f'🔍 REKOGNITION: Analyzing image {image["id"]} s3_key={image["s3_key"]}')
                # Analyze image with Rekognition
                labels, bounding_boxes = analyze_image_with_rekognition(
                    bucket, image['s3_key']
                )
                
                # Add labels and bounding boxes to image data
                labeled_image = {
                    **image,
                    'rekognition_labels': labels,
                    'bounding_boxes': bounding_boxes,
                    'tags': image['tags'] + [label.lower() for label in labels[:5]]  # Add top 5 labels as tags
                }
                
                labeled_images.append(labeled_image)
                print(f'✅ LABELED: image={image["id"]} labels={len(labels)} boxes={len(bounding_boxes)}')
                
            except Exception as e:
                print(f'❌ LABEL ERROR: image={image["id"]} error={str(e)} | execution_id={execution_id}')
                # Keep image without labels rather than failing the whole batch
                labeled_images.append({
                    **image,
                    'rekognition_labels': [],
                    'bounding_boxes': [],
                    'error': str(e)
                })
        
        return {
            **event,
            'images': labeled_images
        }
        
    except Exception as e:
        print(f'❌ LABELING ERROR: {str(e)} | execution_id={execution_id} batch_id={batch_id}')
        raise Exception(f'Failed to label images: {str(e)}')

def analyze_image_with_rekognition(bucket, s3_key):
    """
    Analyze image using AWS Rekognition for labels and object detection
    """
    try:
        print(f'🤖 REKOGNITION API: bucket={bucket} key={s3_key}')
        # Detect labels
        label_response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': s3_key}},
            MaxLabels=20,
            MinConfidence=70
        )
        
        labels = [label['Name'] for label in label_response['Labels']]
        print(f'🏷️ LABELS FOUND: {len(labels)} labels detected')
        
        # Detect objects and get bounding boxes
        object_response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': s3_key}},
            MinConfidence=70
        )
        
        bounding_boxes = []
        for label in object_response.get('Labels', []):
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
        
        print(f'📊 DETECTION COMPLETE: labels={len(labels)} bounding_boxes={len(bounding_boxes)}')
        return labels, bounding_boxes
        
    except Exception as e:
        print(f'❌ REKOGNITION ERROR: {str(e)} | bucket={bucket} key={s3_key}')
        return [], []