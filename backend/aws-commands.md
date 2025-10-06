# AWS CLI Commands Reference

## Profile Management

### List all profiles
```bash
aws configure list-profiles
```

### Show current profile configuration
```bash
aws configure list
```

### Add a new profile
```bash
aws configure --profile profile-name
```

### Set default profile
```bash
export AWS_PROFILE=profile-name
# Or permanently in ~/.bashrc or ~/.zshrc:
echo 'export AWS_PROFILE=profile-name' >> ~/.bashrc
```

### Use specific profile for a single command
```bash
aws s3 ls --profile profile-name
```

### Switch profile temporarily
```bash
export AWS_PROFILE=databanana
aws configure list  # Will show databanana profile
```

## Common AWS Commands

### S3 Operations
```bash
# List buckets
aws s3 ls

# List objects in bucket
aws s3 ls s3://bucket-name

# Create bucket
aws s3 mb s3://bucket-name --region eu-west-1

# Copy file to S3
aws s3 cp file.txt s3://bucket-name/

# Sync directory to S3
aws s3 sync ./local-folder s3://bucket-name/folder/
```

### CloudFormation
```bash
# List stacks
aws cloudformation list-stacks

# Describe stack
aws cloudformation describe-stacks --stack-name stack-name

# Get stack status
aws cloudformation describe-stacks --stack-name stack-name --query 'Stacks[0].StackStatus'

# Delete stack
aws cloudformation delete-stack --stack-name stack-name
```

### Lambda Functions
```bash
# List functions
aws lambda list-functions

# Invoke function
aws lambda invoke --function-name function-name output.json

# Get function configuration
aws lambda get-function-configuration --function-name function-name
```

### API Gateway
```bash
# List REST APIs
aws apigateway get-rest-apis

# Get API deployments
aws apigateway get-deployments --rest-api-id api-id
```

### Cognito
```bash
# List user pools
aws cognito-idp list-user-pools --max-results 10

# List users in pool
aws cognito-idp list-users --user-pool-id pool-id
```

## SAM Commands

### Build and Deploy
```bash
# Build SAM application
sam build

# Deploy (uses samconfig.toml)
sam deploy

# Deploy with guided setup
sam deploy --guided

# Deploy without confirmation
sam deploy --no-confirm-changeset
```

### Local Development
```bash
# Start API locally
sam local start-api

# Invoke function locally
sam local invoke FunctionName

# Generate sample events
sam local generate-event apigateway aws-proxy
```

### Logs
```bash
# Tail function logs
sam logs -n FunctionName --tail

# Get logs for specific time period
sam logs -n FunctionName -s '10min ago' -e '2min ago'
```

## Configuration Files

### ~/.aws/credentials
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

[databanana]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

### ~/.aws/config
```ini
[default]
region = us-east-1
output = json

[profile databanana]
region = eu-west-1
output = json
```

## Environment Variables

### Set AWS Profile
```bash
export AWS_PROFILE=databanana
export AWS_DEFAULT_PROFILE=databanana
```

### Set AWS Region
```bash
export AWS_DEFAULT_REGION=eu-west-1
export AWS_REGION=eu-west-1
```

## Useful Aliases

Add to ~/.bashrc or ~/.zshrc:
```bash
alias awsp='export AWS_PROFILE='
alias awsl='aws configure list'
alias awsprofiles='aws configure list-profiles'
alias samdeploy='sam build && sam deploy'
```

## Quick Profile Switch Function

Add to ~/.bashrc or ~/.zshrc:
```bash
function awsprofile() {
    if [ $# -eq 0 ]; then
        echo "Current profile: ${AWS_PROFILE:-default}"
        aws configure list
    else
        export AWS_PROFILE=$1
        echo "Switched to profile: $1"
        aws configure list
    fi
}
```

Usage:
```bash
awsprofile              # Show current profile
awsprofile databanana    # Switch to databanana profile
```