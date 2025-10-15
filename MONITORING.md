# 📊 Monitoring Guide

## Quick Health Check

### Test Main Flow
```bash
# 1. Test generation endpoint
curl -X POST https://your-api.execute-api.region.amazonaws.com/generate \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"context":"cat on windowsill","image_count":10}'

# 2. Check status
curl https://your-api.execute-api.region.amazonaws.com/status/EXECUTION_ID
```

### Test Workbench
Visit `/workbench/` to test APIs without authentication.

## AWS Console Monitoring

### Step Functions
- Go to AWS Console → Step Functions
- Find "ImageGenerationStateMachine"
- Monitor execution status and view logs

### CloudWatch Logs
Each Lambda has its own log group:
- `/aws/lambda/databanana-GenerateFunction`
- `/aws/lambda/databanana-ProcessImagesFunction`
- etc.

### Key Metrics to Watch
- Step Function execution duration: 2-15 minutes
- Lambda error rate: <1%
- API Gateway 4xx/5xx errors

## Cost Monitoring

### AWS Budgets
Set up monthly budget alerts in AWS Console → Billing → Budgets.

### Per-Batch Costs
Current implementation tracks costs in the `batches.cost` field:
- $0.05 per 100 images (Claude prompts)
- Gemini and Rekognition costs are estimated

## Troubleshooting

### Common Issues

**Step Functions not starting:**
```bash
# Check recent executions
aws stepfunctions list-executions --state-machine-arn YOUR_ARN --max-items 5
```

**Images not generating:**
- Check Gemini API key validity
- Verify S3 bucket permissions
- Check Lambda timeout settings (15 minutes for image processing)

**Authentication issues:**
- Verify Cognito User Pool configuration
- Check frontend config matches SAM outputs

### Debug Queries

**CloudWatch Insights - Find execution errors:**
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

**Find Step Function executions:**
```sql
fields @timestamp, @message
| filter @message like /Started Step Functions execution/
| sort @timestamp desc
| limit 20
```

## Performance Optimization

### Lambda Memory Settings
- Generate function: 256MB (lightweight)
- Process images: 1024MB (handles large image processing)
- Image labeling: 512MB (Rekognition calls)

### Database Optimization
Monitor PostgreSQL slow queries and add indexes as needed:
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

## Alerts Setup

### CloudWatch Alarms
```bash
# Step Function failures
aws cloudwatch put-metric-alarm \
  --alarm-name "StepFunction-Failures" \
  --metric-name "ExecutionsFailed" \
  --namespace "AWS/States" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold"

# High API Gateway errors
aws cloudwatch put-metric-alarm \
  --alarm-name "API-High-Errors" \
  --metric-name "4XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold"
```

## Scaling Considerations

**Current limits:**
- 10-100 images per batch
- ~2-15 minute processing time
- $2.11 cost per 100 images

**Scale bottlenecks:**
- Gemini API rate limits
- Lambda concurrent execution limits
- PostgreSQL connection limits

Monitor these metrics as usage grows.