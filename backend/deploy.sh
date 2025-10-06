#!/bin/bash

# Data Banana Lambda Deployment Script

echo "🍌 Deploying Data Banana Backend..."

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "Error: AWS SAM CLI is not installed"
    echo "Install it with: pip install aws-sam-cli"
    exit 1
fi

# Build and deploy
echo "Building SAM application..."
sam build

echo "Deploying to AWS..."

# Deploy using samconfig.toml configuration
echo "Using parameters from samconfig.toml..."
sam deploy

echo "✅ Deployment complete!"
echo ""
echo "Update frontend/src/config.js with these values from the stack outputs:"
echo "- UserPoolId"
echo "- UserPoolClientId" 
echo "- ApiGatewayApi"
echo ""
echo "Then run: npm run build && npm run dev"