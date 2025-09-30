# 🚀 Data Banana Deployment Guide

## Prerequisites
- AWS CLI configured with credentials
- SAM CLI installed (`pip install aws-sam-cli`)
- PostgreSQL database (RDS recommended)

## Step 1: Deploy Backend Infrastructure

```bash
cd backend
./deploy.sh
```

**SAM will prompt for:**
- Stack name: `databanana-prod`
- AWS region: `us-east-1`
- Database host: `your-db.rds.amazonaws.com`
- Database credentials
- API keys: Stripe, Claude, Nano Banana

**SAM outputs (save these):**
- `ApiGatewayApi`: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod/
- `UserPoolId`: us-east-1_XXXXXXXXX
- `UserPoolClientId`: xxxxxxxxxxxxxxxxxxxxxxxxxx

## Step 2: Configure Frontend

Update `frontend/src/config.js`:
```javascript
export const awsConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_XXXXXXXXX', // From SAM output
      userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // From SAM output
    }
  },
  API: {
    REST: {
      databanana: {
        endpoint: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod', // From SAM output
        region: 'us-east-1'
      }
    }
  }
}
```

## Step 3: Initialize Database

Connect to your PostgreSQL database and run:
```bash
psql -h your-db.rds.amazonaws.com -U username -d databanana -f backend/schema.sql
```

## Step 4: Deploy Frontend to Amplify

### Option A: AWS Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. **Connect repository** → Select your GitHub/GitLab repo
3. **Build settings** → Amplify detects `amplify.yml` automatically
4. **Deploy** → First build takes ~3-5 minutes

### Option B: Amplify CLI
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

## Step 5: Post-Deployment

1. **Test authentication** → Sign up/login should work
2. **Test API calls** → Generate images, view gallery
3. **Test payments** → Add credits via Stripe
4. **Monitor costs** → Check AWS billing dashboard

## Environment Variables (for reference)

Backend Lambda functions use:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `ANTHROPIC_API_KEY` (Claude)
- `NANO_BANANA_API_KEY` (Image generation)
- `STRIPE_SECRET` (Payments)
- `S3_BUCKET` (Auto-created by SAM)

## Troubleshooting

**CORS errors**: Ensure frontend config matches SAM outputs
**Database errors**: Check RDS security groups allow Lambda access
**API key errors**: Verify all keys are correctly set in SAM parameters
**Build errors**: Check Amplify build logs in console

## Costs Estimate

- **Lambda**: ~$0.20/1000 requests
- **API Gateway**: ~$3.50/million requests  
- **Cognito**: Free tier covers most usage
- **S3**: ~$0.023/GB storage
- **RDS**: ~$13/month (db.t3.micro)
- **Amplify Hosting**: ~$1/month for small apps