# 🍌 Databanana Workbench

Simple testing interface for AI services (Claude & Gemini Flash).

## Setup

1. **Update API Configuration**
   Edit `script.js` and update these variables:
   ```javascript
   const API_BASE_URL = 'https://your-api-gateway-url.com';
   const API_KEY = 'your-api-key';
   ```

2. **Open in Browser**
   Simply open `index.html` in your browser.

## Usage

### Step 1: Configure
- **Context**: Describe what type of images you want to generate
- **Exclude Tags**: Comma-separated list of things to avoid
- **Number of Generations**: How many prompts to generate

### Step 2: Claude Prompts
- Click "Populate Default Prompt" to load a template
- Edit the prompt as needed
- Click "Send to Claude" to get prompt suggestions
- Review the JSON response
- Click "Next: Gemini Flash" when satisfied

### Step 3: Gemini Flash Batch
- The Gemini payload is auto-populated from Claude results
- Edit the JSON payload if needed
- Click "Send to Gemini Flash" to generate images
- View results in JSON format (accordion)
- View images in gallery format with zoom capability

## API Endpoints Expected

The workbench expects these backend endpoints:

### Claude Endpoint
```
POST /generate-prompts
{
  "prompt": "string",
  "context": "string", 
  "exclude_tags": "string",
  "num_generations": number
}
```

### Gemini Endpoint
```
POST /generate-images
{
  "requests": [...] // Gemini batch format
}
```

## File Structure
```
workbench/
├── index.html      # Main interface
├── script.js       # API calls and interactions
├── style.css       # Clean, minimal styling
└── README.md       # This file
```

## Features

- **Clean Interface**: Simple, focused design
- **Step-by-Step Workflow**: Guided process from prompts to images
- **JSON Editing**: Direct editing of API payloads
- **Image Gallery**: Thumbnail view with modal zoom
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Clear error messages
- **Loading States**: Visual feedback during API calls

## Customization

### Adding New Services
1. Add form fields in `index.html`
2. Add API call function in `script.js`
3. Update styling in `style.css` if needed

### Modifying Payloads
- Edit the default templates in `populateClaudePrompt()` and `populateGeminiPayload()`
- Adjust the `extractImagesFromResponse()` function based on your API response format

The code is intentionally simple and well-commented for easy modification.