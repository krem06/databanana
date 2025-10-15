# 🚀 Deployment Guide

## Prerequisites

- AWS CLI configured
- SAM CLI installed (`pip install aws-sam-cli`)
- External PostgreSQL database (Neon)

## Step 1: Deploy Backend

```bash
cd backend
./deploy.sh
```

**Use samconfig.toml for config**
- Stack name: `databanana-prod`
- AWS region: `eu-west-1`
- Database credentials
- API keys: Stripe, Claude, Gemini

**Save these SAM outputs:**
- `ApiGatewayApi`: Your API endpoint
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito Client ID

## Step 2: Initialize Database

```bash
psql -h your-db-host.com -U username -d databanana -f backend/schema.sql
```

## Step 3: Configure Frontend

Update `frontend/src/config.js`:
```javascript
export const awsConfig = {
  Auth: {
    Cognito: {
      region: 'eu-west-1',
      userPoolId: 'eu-west-1_XXXXXXXXX', // From SAM output
      userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx' // From SAM output
    }
  },
  API: {
    REST: {
      databanana: {
        endpoint: 'https://xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/Prod', // From SAM output
        region: 'us-east-1'
      }
    }
  }
}
```

## Step 4: Deploy Frontend

### AWS Amplify (Recommended)
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Connect your GitHub repository
3. Use the included `amplify.yml` build settings
4. Deploy

### Local Development
```bash
cd frontend
npm install
npm run dev
```

## Verification

1. **Test authentication**: Sign up/login
2. **Test generation**: Create a batch of images
3. **Test workbench**: Visit `/workbench/` for API testing

## Environment Variables

Backend functions use:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `ANTHROPIC_API_KEY` (Claude)
- `GEMINI_API_KEY` (Image generation)
- `STRIPE_SECRET` (Payments)
- `S3_BUCKET` (Auto-created)

## Troubleshooting

**CORS errors**: Ensure frontend config matches SAM outputs
**Database errors**: Check database firewall allows Lambda IPs
**API key errors**: Verify keys in SAM parameters
**Build errors**: Check Amplify build logs

## Cost Estimate

