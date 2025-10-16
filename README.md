# 🍌 Data Banana

Production-ready ML dataset generator that creates diverse, annotated image datasets at scale.

## What Makes Data Banana Different

**🎯 ML-Ready Datasets, Not Just Pretty Pictures**
- Generate 100+ **diverse variations** from a single concept (not 4 similar images)
- **Automatic labeling** with bounding boxes and tags via AWS Rekognition
- **Human validation** ensures quality without expensive manual annotation
- Export as **structured datasets** ready for ML training

**📊 Compare with Popular Tools:**

| Feature | Midjourney/DALL-E | Data Banana |
|---------|-------------------|-------------|
| Output | 4-10 similar images | 100 diverse variations |
| Annotations | None | Auto-generated labels + bounding boxes |
| Batch Size | Small | Enterprise scale (10-100 images) |
| ML Ready | No | Yes - structured datasets |
| Cost per Image | $0.10+ | $0.05 (or $0.10 for validated exports) |
| Use Case | Creative content | ML training data |

## How It Works

1. **Smart Prompt Generation**: Claude creates diverse prompts from your concept
2. **Batch Image Creation**: Gemini generates 100 variations in one job
3. **Auto-Annotation**: AWS Rekognition adds labels and bounding boxes
4. **Human Validation**: You curate the best images for quality
5. **Dataset Export**: Download as ML-ready packages (YOLO, COCO, etc.)

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

## Value Proposition

**🎯 For ML Engineers & Researchers:**
- **10-50x cheaper** than manual annotation services ($0.10 vs $1-5 per image)
- **Instant availability** - no waiting weeks for human annotators
- **Consistent quality** - automated labeling with human validation
- **Custom datasets** - generate exactly what your model needs

**🔄 Network Effect Business Model:**

1. **Generate**: Users pay $5 to create 100 diverse, auto-labeled images
2. **Validate**: Users curate quality images (self-service validation)
3. **Publish**: Validated images enter public gallery (free for everyone)
4. **Export**: Structured datasets available for $0.10/image

**📈 Growth Flywheel:**
- More generations → Larger free dataset → More users → More generations
- Public gallery drives SEO and brand awareness
- Export revenue scales with dataset size (pure margin)