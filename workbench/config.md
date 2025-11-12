# Configuration Instructions

## Step 1: Find Your API Gateway URL

1. Go to AWS Console → API Gateway
2. Click on your DataBanana API
3. Go to "Stages" → "Prod" 
4. Copy the "Invoke URL" (should look like: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod`)

## Step 2: Update script.js

Open `script.js` and replace line 3:

```javascript
// BEFORE
const API_GATEWAY_URL = 'https://your-api-gateway-url.amazonaws.com/Prod';

// AFTER  
const API_GATEWAY_URL = 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod';
```

## Step 3: Open in Browser

Simply open `index.html` in any modern browser.

## Testing

1. **Claude Test**: Click "Populate Example Prompt" → "Send to Claude"
2. **Gemini Test**: Click "Next: Gemini Flash" → "Send to Gemini Flash"
3. **Wait for Results**: Gemini may take 1-5 minutes to generate images

## Troubleshooting

- **CORS Error**: Make sure your API has CORS enabled
- **404 Error**: Check your API Gateway URL is correct
- **Timeout**: Gemini batch jobs can take several minutes
- **No Images**: Check the browser console for errors

The workbench is designed to be simple and self-contained - no authentication required.