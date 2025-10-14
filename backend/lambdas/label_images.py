import json
import os
import boto3
from mock_service import mock_rekognition_labels

# Initialize Rekognition client
rekognition = boto3.client('rekognition')

def handler(event, context):
    """
    Step 6: Use AWS Rekognition to label and detect objects in images
    """
    try:
        print(f'Event: {event}')
        
        images = event['images']
        mock_mode = event.get('mock_mode', False)
        bucket = os.environ.get('S3_BUCKET')
        
        labeled_images = []
        
        for image in images:
            try:
                if mock_mode:
                    # Use mock labels for testing
                    mock_labels = mock_rekognition_labels(image['prompt'])
                    if mock_labels:
                        labels = mock_labels.get('labels', [])
                        bounding_boxes = mock_labels.get('bounding_boxes', [])
                    else:
                        labels = ['object', 'scene', 'outdoor']
                        bounding_boxes = []
                else:
                    # Real Rekognition API calls
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
                print(f"Labeled image {image['id']} with {len(labels)} labels")
                
            except Exception as e:
                print(f"Error labeling image {image['id']}: {str(e)}")
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
        print(f'Image labeling error: {str(e)}')
        raise Exception(f'Failed to label images: {str(e)}')

def analyze_image_with_rekognition(bucket, s3_key):
    """
    Analyze image using AWS Rekognition for labels and object detection
    """
    try:
        # Detect labels
        label_response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': s3_key}},
            MaxLabels=20,
            MinConfidence=70
        )
        
        labels = [label['Name'] for label in label_response['Labels']]
        
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
        
        return labels, bounding_boxes
        
    except Exception as e:
        print(f"Rekognition API error: {str(e)}")
        return [], []