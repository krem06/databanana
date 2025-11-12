# Workbench CORS Fix - Deploy Instructions

## Changes Made

✅ **Fixed SAM Template**: Added proper CORS configuration and environment variables to all workbench functions
✅ **Fixed Lambda Functions**: Added OPTIONS method handling for CORS preflight  
✅ **Fixed Script URL**: Removed double slash in API URL

## Deploy Steps

1. **Navigate to backend:**
   ```bash
   cd /Users/clementchazarra/Work/Perso/Databanana/backend
   ```

2. **Deploy the fixes:**
   ```bash
   sam deploy
   ```

3. **Test the workbench:**
   - Open `/Users/clementchazarra/Work/Perso/Databanana/workbench/index.html`
   - Try "Populate Example Prompt" → "Send to Claude"

## What was Fixed

### CORS Issues:
- Added `Cors` configuration to all workbench API endpoints
- Added `AllowOrigin: "'*'"` for testing from local files
- Added OPTIONS method handling in all Lambda functions

### Environment Variables:
- `WorkbenchClaudeFunction`: Added `ANTHROPIC_API_KEY`
- `WorkbenchGeminiFunction`: Added `GEMINI_API_KEY` and `S3_BUCKET`  
- `WorkbenchStatusFunction`: Added `GEMINI_API_KEY` and `S3_BUCKET`

### URL Fix:
- Removed trailing slash from API_GATEWAY_URL to prevent double slash

The workbench should now work without CORS errors!