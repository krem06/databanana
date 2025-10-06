import json
import os
import boto3
import zipfile
import tempfile
from datetime import datetime
from uuid import uuid4
import requests
from db_utils import get_db, get_cognito_user_id, get_user_db_id

s3 = boto3.client('s3')

def handler(event, context):
    try:
        body = json.loads(event['body'])
        export_format = body.get('format', 'coco')  # 'coco' or 'yolo'
        cognito_user_id = get_cognito_user_id(event)
        
        # Get selected images for user
        selected_images = get_selected_images(cognito_user_id)
        
        if not selected_images:
            return {'statusCode': 400, 'body': json.dumps({'error': 'No selected images found'})}
        
        # Create export zip file
        export_url = create_export_zip(selected_images, export_format, cognito_user_id)
        
        return {'statusCode': 200, 'body': json.dumps({
            'export_url': export_url,
            'format': export_format,
            'image_count': len(selected_images)
        })}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def get_selected_images(cognito_user_id):
    user_db_id = get_user_db_id(cognito_user_id)
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT i.id, i.prompt, i.url, i.tags
        FROM images i
        JOIN batches b ON i.batch_id = b.id
        WHERE b.user_id = %s AND i.selected = true
        ORDER BY i.created_at
    ''', (user_db_id,))
    
    return [
        {
            'id': row[0],
            'prompt': row[1],
            'url': row[2],
            'tags': json.loads(row[3]) if row[3] else []
        }
        for row in cur.fetchall()
    ]

def create_export_zip(images, export_format, cognito_user_id):
    bucket = os.environ['S3_BUCKET']
    export_key = f"exports/{cognito_user_id}/{uuid4().hex}_{export_format}.zip"
    
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, 'export.zip')
        
        with zipfile.ZipFile(zip_path, 'w') as zip_file:
            # Create annotations based on format
            if export_format == 'coco':
                annotations = create_coco_annotations(images)
                zip_file.writestr('annotations.json', json.dumps(annotations, indent=2))
            elif export_format == 'yolo':
                create_yolo_annotations(images, zip_file)
            
            # Download and add images to zip
            for i, image in enumerate(images):
                try:
                    # Download image from URL
                    response = requests.get(image['url'], timeout=30)
                    if response.status_code == 200:
                        # Determine file extension
                        ext = 'jpg'
                        if 'image/png' in response.headers.get('content-type', ''):
                            ext = 'png'
                        
                        filename = f"image_{i+1:04d}.{ext}"
                        zip_file.writestr(f"images/{filename}", response.content)
                        
                        # Update image reference in annotations
                        if export_format == 'yolo':
                            # YOLO annotations already created with correct filenames
                            pass
                        
                except Exception as e:
                    print(f"Failed to download image {image['url']}: {str(e)}")
                    continue
        
        # Upload zip to S3
        with open(zip_path, 'rb') as zip_data:
            s3.put_object(
                Bucket=bucket,
                Key=export_key,
                Body=zip_data.read(),
                ContentType='application/zip'
            )
    
    # Generate presigned URL for download
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': export_key},
        ExpiresIn=3600  # 1 hour
    )

def create_coco_annotations(images):
    """Create COCO format annotations"""
    coco_format = {
        "info": {
            "description": "Databanana AI Generated Images Export",
            "version": "1.0",
            "year": datetime.now().year,
            "contributor": "databanana.ai",
            "date_created": datetime.now().isoformat()
        },
        "licenses": [
            {
                "id": 1,
                "name": "Custom License",
                "url": ""
            }
        ],
        "images": [],
        "annotations": [],
        "categories": []
    }
    
    # Extract unique categories from tags
    all_tags = set()
    for image in images:
        all_tags.update(image['tags'])
    
    categories = [
        {"id": i+1, "name": tag, "supercategory": "generated"}
        for i, tag in enumerate(sorted(all_tags))
    ]
    coco_format["categories"] = categories
    
    # Create image and annotation entries
    annotation_id = 1
    for i, image in enumerate(images):
        # Image entry
        image_entry = {
            "id": i + 1,
            "width": 400,  # Default size, could be dynamic
            "height": 300,
            "file_name": f"image_{i+1:04d}.jpg",
            "license": 1,
            "date_captured": datetime.now().isoformat()
        }
        coco_format["images"].append(image_entry)
        
        # Annotation entries for each tag
        for tag in image['tags']:
            if tag in [cat['name'] for cat in categories]:
                category_id = next(cat['id'] for cat in categories if cat['name'] == tag)
                annotation = {
                    "id": annotation_id,
                    "image_id": i + 1,
                    "category_id": category_id,
                    "bbox": [0, 0, 400, 300],  # Full image bbox clem
                    "area": 400 * 300,
                    "iscrowd": 0
                }
                coco_format["annotations"].append(annotation)
                annotation_id += 1
    
    return coco_format

def create_yolo_annotations(images, zip_file):
    """Create YOLO format annotations"""
    # Extract unique classes
    all_tags = set()
    for image in images:
        all_tags.update(image['tags'])
    
    classes = sorted(all_tags)
    
    # Create classes.txt file
    zip_file.writestr('classes.txt', '\n'.join(classes))
    
    # Create annotation files for each image
    for i, image in enumerate(images):
        filename = f"image_{i+1:04d}.txt"
        annotations = []
        
        for tag in image['tags']:
            if tag in classes:
                class_id = classes.index(tag)
                # YOLO format: class_id center_x center_y width height (normalized)
                # For full image: center at 0.5, 0.5, full width/height = 1.0
                annotation = f"{class_id} 0.5 0.5 1.0 1.0"
                annotations.append(annotation)
        
        zip_file.writestr(f"labels/{filename}", '\n'.join(annotations))