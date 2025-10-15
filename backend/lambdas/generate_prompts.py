import json
import os
from anthropic import Anthropic
from progress_utils import update_batch_progress

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

def handler(event, context):
    """
    Step 2: Generate image prompts using Claude
    """
    try:
        print(f'Event: {event}')
        
        context_text = event['context']
        exclude_tags = event['exclude_tags']
        image_count = event['image_count']
        batch_id = event['batch_id']
        
        # Update progress in database
        execution_id = event.get('execution_id')
        update_batch_progress(batch_id, 'GeneratePrompts', 20, execution_id)
        
        # Generate variations
        variations = generate_variations(context_text, exclude_tags, image_count)
        
        # Return updated event with variations
        return {
            **event,  # Pass through all previous data
            'variations': variations
        }
        
    except Exception as e:
        print(f'Prompt generation error: {str(e)}')
        raise Exception(f'Prompt generation failed: {str(e)}')

def generate_variations(context, exclude_tags, count):
    """Generate image prompt variations using Claude"""
    prompt = f"""Generate exactly {count} diverse, realistic image prompts based on: "{context}"

Rules:
- Each prompt should be a complete, detailed scene description
- Exclude these elements: {exclude_tags}
- Keep each prompt under 50 words
- Make them diverse but thematically related to the original context
- They should be suitable for generating high-quality images
- Scene is always photo realistic with natural lighting
- Include a variety of perspectives and compositions
- Use dynamic angles and framing, realistic motion to enhance visual interest
- Situations can be indoors or outdoors, day or night, urban or nature
- Separate each prompt with a semicolon (;)
- Do not number them or add extra formatting
- Return only the prompts separated by semicolons

Example format: "prompt 1; prompt 2; prompt 3"
"""
    
    try:
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        print(f"Claude response: {response}")
        variations_text = response.content[0].text.strip()
        variations = [v.strip() for v in variations_text.split(';') if v.strip()]
        
        # Ensure we have the right count
        while len(variations) < count:
            variations.append(f"{context} - variation {len(variations) + 1}")
            
        return variations[:count]
        
    except Exception as e:
        print(f"Claude API error: {e}")
        # Fallback variations
        return [f"{context} - variation {i+1}" for i in range(count)]

