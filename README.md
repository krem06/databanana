# 🍌 Data Banana

AI-powered synthetic image dataset generator with automatic tagging and user validation.

## Overview

Data Banana generates realistic image datasets for ML training using:
- **Claude 3.5 Haiku** for prompt generation
- **Gemini 2.5 Flash** for image generation  
- **AWS Rekognition** for automatic tagging
- **Human validation** for quality control

## Quick Start

### 1. Deploy Backend
```bash
cd backend
./deploy.sh
# Note the output values for frontend config
```

### 2. Setup Frontend
```bash
cd frontend
npm install
# Update src/config.js with SAM output values
npm run dev
```

### 3. Production Deployment
Push to GitHub and deploy via [AWS Amplify Console](https://console.aws.amazon.com/amplify/) using the included `amplify.yml`.

## Architecture

- **Auth**: AWS Cognito User Pools
- **API**: Lambda functions + API Gateway
- **Processing**: Step Functions workflow
- **Database**: PostgreSQL (external service)
- **Storage**: S3 for images
- **Frontend**: React PWA

## API Endpoints

All endpoints require Cognito authentication:

- `POST /generate` - Start image generation workflow
- `GET /status/{execution_id}` - Check generation progress
- `GET /user` - Get user profile and credits
- `POST /upload` - Get S3 upload URL
- `POST /stripe-webhook` - Stripe payment webhook

## Development Tools

### Workbench
Simple testing interface at `/workbench/`:
- Test Claude prompt generation
- Test Gemini image generation
- No authentication required

### Testing
```bash
# Test generate endpoint
curl -X POST https://your-api.execute-api.region.amazonaws.com/generate \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"context":"cat on windowsill","image_count":10}'
```

## Configuration

After deployment, update `frontend/src/config.js`:
```javascript
export const awsConfig = {
  Auth: {
    Cognito: {
      region: 'YOUR_REGION',
      userPoolId: 'YOUR_USER_POOL_ID',
      userPoolClientId: 'YOUR_CLIENT_ID'
    }
  },
  API: {
    REST: {
      databanana: {
        endpoint: 'YOUR_API_GATEWAY_URL',
        region: 'YOUR_REGION'
      }
    }
  }
}
```

## Cost Structure

**Per 100 images (~$2.11):**
- Gemini 2.5 Flash: $1.95 (92%)
- Claude 3.5 Haiku: $0.05 (2%) 
- AWS Rekognition: $0.10 (5%)

**User pricing:** $5 for 100 images + validation

## Business Model

1. Users generate synthetic image datasets
2. Validate quality through human review
3. Validated images enter public gallery (free download)
4. Export with metadata: $0.10/image