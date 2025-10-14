import json
import os
from anthropic import Anthropic
from mock_service import mock_claude_variations
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
        update_batch_progress(batch_id, 'GeneratePrompts', 20)
        
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
    
    # Check for test mode mock
    mock_response = mock_claude_variations(context, exclude_tags, count)
    if mock_response:
        variations_text = mock_response['content'][0]['text']
        variations = [v.strip() for v in variations_text.split(';') if v.strip()]
        return variations[:count]
    
    # Real API call
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
        #response = anthropic_client.messages.create(
        #    model="claude-3-5-haiku-20241022",
        #    max_tokens=2000,
        #    messages=[{"role": "user", "content": prompt}]
        #)
        #
        #print(f"Claude response: {response}")
        #variations_text = response.content[0].text.strip()
        variations_text = "A sleek Siamese cat perched on a sun-drenched windowsill, watching raindrops cascade down glass, soft morning light creating gentle shadows; A curious tabby cat exploring a messy bookshelf, precariously balanced between old novels and ceramic figurines; A ginger cat stretching lazily on a weathered wooden dock overlooking a misty lake at dawn; A black and white cat sitting regally inside an antique leather armchair in a dimly lit study; A silver Persian cat curled up in a basket of fresh laundry, surrounded by soft white towels and gentle sunlight; A street cat prowling through a narrow cobblestone alley in an old European city at twilight; A Maine Coon cat sitting attentively near a kitchen window, watching birds flutter around a backyard bird feeder; A calico cat nestled among wildflowers in a lush meadow, golden afternoon sunlight filtering through grass; A fluffy white cat balanced on the edge of a vintage bicycle leaning against a rustic barn wall; A sleepy cat napping on a warm radiator, casting a soft shadow against peeling wallpaper"
        variations = [v.strip() for v in variations_text.split(';') if v.strip()]
        
        # Ensure we have the right count
        while len(variations) < count:
            variations.append(f"{context} - variation {len(variations) + 1}")
            
        return variations[:count]
        
    except Exception as e:
        print(f"Claude API error: {e}")
        # Fallback variations
        return [f"{context} - variation {i+1}" for i in range(count)]

