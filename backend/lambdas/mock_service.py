import os
import json
import time
from datetime import datetime

# Check if we're in test mode
is_test_mode = os.environ.get('TEST_MODE', 'false').lower() == 'true'

# Mock data matching real API response formats
mock_data = {
    # Claude Haiku prompt variations (official API format)
    'prompt_variations': {
        'id': 'msg_01QfRmDBXVWcARjbwZBbJxrR',
        'object': 'chat.completion',
        'model': 'claude-3-5-haiku-20241022',
        'usage': {
            'input_tokens': 45,
            'output_tokens': 890,
            'total_tokens': 935
        },
        'content': [{
            'type': 'text',
            'text': '; '.join([
                f'A {["orange", "black", "white", "gray", "calico"][i % 5]} cat '
                f'{["sitting", "lying", "perched", "resting"][i % 4]} on a '
                f'{["windowsill", "wooden sill", "marble ledge", "window frame"][i % 4]} '
                f'{["in sunlight", "during sunset", "with curtains", "overlooking garden"][i % 4]}'
                for i in range(100)
            ])
        }]
    },

    # Gemini 2.5 Flash Image generation - official API format
    'nano_images': {
        'candidates': [{
            'content': {
                'parts': [
                    {
                        'text': f'Generated image {i + 1} from prompt variation',
                        'inline_data': {
                            'mime_type': 'image/png',
                            'data': f'base64_encoded_image_data_{i}'
                        }
                    } for i in range(10)
                ]
            },
            'finish_reason': 'STOP',
            'index': 0,
            'safety_ratings': [
                {'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'probability': 'NEGLIGIBLE'},
                {'category': 'HARM_CATEGORY_HATE_SPEECH', 'probability': 'NEGLIGIBLE'},
                {'category': 'HARM_CATEGORY_HARASSMENT', 'probability': 'NEGLIGIBLE'},
                {'category': 'HARM_CATEGORY_DANGEROUS_CONTENT', 'probability': 'NEGLIGIBLE'}
            ]
        }],
        'usage_metadata': {
            'prompt_token_count': 12,
            'candidates_token_count': 12900,
            'total_token_count': 12912
        },
        'model_version': 'gemini-2.5-flash-image'
    },

    # AWS Rekognition DetectLabels - official API format
    'rekognition_results': {
        'Labels': [
            {
                'Name': label,
                'Confidence': confidence + (time.time() % 1) * 2,
                'Instances': [{
                    'BoundingBox': {
                        'Width': 0.4 + (time.time() % 1) * 0.3,
                        'Height': 0.5 + (time.time() % 1) * 0.2,
                        'Left': 0.1 + (time.time() % 1) * 0.2,
                        'Top': 0.2 + (time.time() % 1) * 0.3
                    },
                    'Confidence': 95.2 + (time.time() % 1) * 4
                }],
                'Parents': [{'Name': 'Animal'}] if label == 'Cat' else []
            }
            for label, confidence in [
                ('Cat', 95.2), ('Animal', 98.1), ('Pet', 92.3), 
                ('Windowsill', 87.5), ('Indoor', 89.2)
            ]
        ],
        'LabelModelVersion': '3.0',
        'ResponseMetadata': {
            'RequestId': 'b2b8c0e4-8b5a-4c3d-9f7e-2a1b3c4d5e6f',
            'HTTPStatusCode': 200,
            'HTTPHeaders': {
                'content-type': 'application/x-amz-json-1.1',
                'date': datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
            }
        }
    }
}

def simulate_delay(seconds=0.5):
    """Simulate API call delay"""
    if is_test_mode:
        time.sleep(seconds)

def mock_claude_variations(original_prompt, exclude_tags="", count=10):
    """Mock Claude Haiku prompt variations"""
    if not is_test_mode:
        return None
    
    print(f"🧪 TEST MODE: Mocking Claude Haiku API call for {count} variations")
    simulate_delay(1.2)
    
    # Generate semicolon-separated variations based on original prompt
    variations = []
    for i in range(count):
        variations.append(
            f'{original_prompt} with {["orange", "black", "white", "gray", "calico"][i % 5]} '
            f'{["cat", "dog", "bird", "rabbit", "hamster"][i % 5]} '
            f'{["sitting", "lying", "perched", "resting", "playing"][i % 5]} '
            f'{["in sunlight", "during sunset", "with shadows", "in bright light", "at dawn"][i % 5]}'
        )
    
    # Return semicolon-separated text response (matching real Claude format)
    response = mock_data['prompt_variations'].copy()
    response['content'][0]['text'] = '; '.join(variations)
    
    return response

def mock_gemini_images(selected_prompts):
    """Mock Gemini 2.5 Flash Image generation"""
    if not is_test_mode:
        return None
    
    print("🧪 TEST MODE: Mocking Gemini 2.5 Flash Image API call")
    simulate_delay(4.5)
    
    # Customize based on selected prompts
    response = mock_data['nano_images'].copy()
    response['candidates'][0]['content']['parts'] = [
        {
            'text': f'Generated image from prompt: {prompt}',
            'inline_data': {
                'mime_type': 'image/png',
                'data': f'base64_encoded_image_data_{i}_{hash(prompt) % 1000}'
            }
        }
        for i, prompt in enumerate(selected_prompts)
    ]
    
    return response

def mock_rekognition_labels(image_data):
    """Mock AWS Rekognition DetectLabels"""
    if not is_test_mode:
        return None
    
    print("🧪 TEST MODE: Mocking AWS Rekognition API call")
    simulate_delay(1.2)
    
    return mock_data['rekognition_results']

def mock_complete_batch(original_prompt, exclude_tags=""):
    """Mock complete batch workflow result"""
    if not is_test_mode:
        return None
    
    print("🧪 TEST MODE: Mocking complete batch workflow")
    simulate_delay(5.8)
    
    return {
        'batch_id': f'batch_mock_{int(time.time())}',
        'status': 'completed',
        'stages': {
            'prompt_generation': {'status': 'completed', 'cost': 0.00089, 'time': '1.2s'},
            'image_generation': {'status': 'completed', 'cost': 0.39, 'time': '45s'},
            'annotation': {'status': 'completed', 'cost': 0.15, 'time': '12s'}
        },
        'total_cost': 0.54,
        'total_time': '58.2s',
        'images_generated': 10,
        'original_prompt': original_prompt,
        'exclude_tags': exclude_tags,
        'created_at': datetime.utcnow().isoformat()
    }