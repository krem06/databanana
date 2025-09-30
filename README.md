# 🍌 Data Banana

Generate realistic image datasets for ML training with AWS Cognito authentication.

## Quick Start

### 1. Backend (Python Lambda)
```bash
cd backend
./deploy.sh
# Copy output values to frontend/src/config.js
```

### 2. Frontend (React PWA)
```bash
cd frontend
npm install
# Update src/config.js with SAM output values
npm run dev
```

### 3. Production Hosting (AWS Amplify)
1. Push code to GitHub/GitLab
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. **Connect repository** → Select your repo
4. **Build settings** → Use existing `amplify.yml`
5. **Deploy** → Automatic builds on every push

## Architecture

- **Auth**: AWS Cognito User Pools
- **Frontend**: React PWA with Amplify UI
- **Backend**: 6 Python Lambda functions via API Gateway
- **Database**: PostgreSQL with dedicated Lambda functions
- **Storage**: AWS S3 for images

## Configuration

After `./deploy.sh`, update `frontend/src/config.js`:
```javascript
export const awsConfig = {
  Auth: {
    region: 'YOUR_REGION',
    userPoolId: 'YOUR_USER_POOL_ID',
    userPoolWebClientId: 'YOUR_USER_POOL_CLIENT_ID',
  },
  API: {
    endpoints: [
      {
        name: 'databanana',
        endpoint: 'YOUR_API_GATEWAY_URL',
        region: 'YOUR_REGION'
      }
    ]
  }
}
```

## API Endpoints (All Protected by Cognito)

- `GET /user` - Get user info
- `POST /user/credits` - Update credits
- `GET /batches` - Get user batches
- `POST /batches` - Create batch
- `GET /images` - Get images
- `PUT /images/{id}` - Update image
- `POST /generate` - Generate batch
- `POST /payment` - Stripe payment
- `POST /upload` - S3 upload URL