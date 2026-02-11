# AWS Cloud Integration Guide

## Overview

This guide explains how to integrate Ross Tax Prep with AWS cloud services for enterprise-grade error logging and real-time alerting.

## Architecture

```
┌──────────────┐
│   Browser    │
│  (Client)    │
└──────┬───────┘
       │ Error occurs
       ▼
┌──────────────────┐
│ Client Logger    │
│ (client-logger.js)│
└──────┬───────────┘
       │ POST /api/logs/client
       ▼
┌──────────────────────────────┐
│ Cloudflare Worker            │
│ (functions/api/client-logs.ts)│
└──────┬───────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ D1 Database │   │  CloudWatch │   │  AWS SNS    │
│ (audit_logs)│   │    Logs     │   │  (Alerts)   │
└─────────────┘   └─────────────┘   └──────┬──────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Email/SMS/    │
                                    │ Webhook       │
                                    └───────────────┘
```

## Features

### AWS CloudWatch Logs
- **Centralized logging** for all critical errors
- **Long-term storage** with configurable retention
- **Powerful search** and filtering capabilities
- **CloudWatch Insights** for analytics and trends
- **Integration** with CloudWatch Dashboards and Alarms

### AWS SNS (Simple Notification Service)
- **Real-time alerts** for critical errors
- **Multi-channel delivery** (Email, SMS, HTTPS, SQS, Lambda)
- **Fanout pattern** - notify multiple subscribers
- **Message filtering** based on error attributes
- **Dead Letter Queue** for failed notifications

## Quick Start

### 1. Set up AWS CloudWatch Logs

```bash
# 1. Create log group
aws logs create-log-group \
  --log-group-name /ross-tax-prep/client-errors \
  --region us-east-1

# 2. Set retention policy (30 days)
aws logs put-retention-policy \
  --log-group-name /ross-tax-prep/client-errors \
  --retention-in-days 30 \
  --region us-east-1

# 3. Create IAM user for Cloudflare Workers
aws iam create-user --user-name cloudflare-logs

# 4. Attach CloudWatch Logs policy
aws iam attach-user-policy \
  --user-name cloudflare-logs \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# 5. Create access keys
aws iam create-access-key --user-name cloudflare-logs
```

### 2. Set up AWS SNS for Alerts

```bash
# 1. Create SNS topic
aws sns create-topic \
  --name ross-tax-prep-critical-errors \
  --region us-east-1

# 2. Subscribe email address
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ross-tax-prep-critical-errors \
  --protocol email \
  --notification-endpoint alerts@example.com

# 3. Confirm subscription (check email)

# 4. Create IAM policy for SNS
cat > sns-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "arn:aws:sns:us-east-1:ACCOUNT_ID:ross-tax-prep-critical-errors"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name CloudflareSNSPublish \
  --policy-document file://sns-policy.json

# 5. Attach policy to user
aws iam attach-user-policy \
  --user-name cloudflare-logs \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/CloudflareSNSPublish
```

### 3. Configure Cloudflare Workers

Set environment variables in Cloudflare Pages/Workers:

```bash
# Using Wrangler CLI
wrangler secret put AWS_REGION
# Enter: us-east-1

wrangler secret put AWS_ACCESS_KEY_ID
# Enter: AKIAIOSFODNN7EXAMPLE

wrangler secret put AWS_SECRET_ACCESS_KEY
# Enter: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

wrangler secret put AWS_CLOUDWATCH_LOG_GROUP
# Enter: /ross-tax-prep/client-errors

wrangler secret put AWS_SNS_TOPIC_ARN
# Enter: arn:aws:sns:us-east-1:ACCOUNT_ID:ross-tax-prep-critical-errors
```

Or via Cloudflare Dashboard:
1. Go to Workers & Pages → Your Project → Settings → Variables
2. Add each environment variable
3. Mark sensitive values (AWS credentials) as "Encrypted"

## IAM Policy Best Practices

### Minimal Permissions Policy

Create a custom IAM policy with least privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchLogsWrite",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:123456789012:log-group:/ross-tax-prep/client-errors",
        "arn:aws:logs:us-east-1:123456789012:log-group:/ross-tax-prep/client-errors:*"
      ]
    },
    {
      "Sid": "SNSPublish",
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "arn:aws:sns:us-east-1:123456789012:ross-tax-prep-critical-errors"
    }
  ]
}
```

### Apply Policy

```bash
# Create policy
aws iam create-policy \
  --policy-name RossTaxPrepCloudIntegration \
  --policy-document file://policy.json

# Attach to user
aws iam attach-user-policy \
  --user-name cloudflare-logs \
  --policy-arn arn:aws:iam::123456789012:policy/RossTaxPrepCloudIntegration
```

## Advanced Configuration

### CloudWatch Log Insights Queries

Analyze errors with CloudWatch Insights:

```sql
-- Top 10 error messages
fields @timestamp, message
| filter level = "critical"
| stats count() by message
| sort count desc
| limit 10

-- Errors by context
fields @timestamp, context, message
| filter level in ["error", "critical"]
| stats count() by context
| sort count desc

-- Error rate over time
fields @timestamp
| filter level in ["error", "critical"]
| stats count() by bin(5m)
```

### SNS Message Filtering

Filter SNS messages by attributes:

```bash
# Subscribe with filter policy (only authentication errors)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ross-tax-prep-critical-errors \
  --protocol email \
  --notification-endpoint auth-alerts@example.com \
  --attributes '{
    "FilterPolicy": "{\"context\": [\"authentication\"]}"
  }'
```

### CloudWatch Alarms

Create alarms for high error rates:

```bash
# Alarm when error rate exceeds threshold
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --alarm-description "Alert when error rate exceeds 10 per minute" \
  --metric-name IncomingLogEvents \
  --namespace AWS/Logs \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=LogGroupName,Value=/ross-tax-prep/client-errors \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ross-tax-prep-critical-errors
```

## Monitoring and Analytics

### CloudWatch Dashboard

Create a dashboard to visualize errors:

```bash
cat > dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Logs", "IncomingLogEvents", {"stat": "Sum", "label": "Error Count"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Client Errors (5 min)"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name RossTaxPrepErrors \
  --dashboard-body file://dashboard.json
```

### Cost Optimization

1. **Log Retention**: Set appropriate retention (7-90 days)
   ```bash
   aws logs put-retention-policy \
     --log-group-name /ross-tax-prep/client-errors \
     --retention-in-days 30
   ```

2. **SNS Cost**: Free tier includes 1,000 email deliveries/month
3. **CloudWatch Logs**: ~$0.50/GB ingested, ~$0.03/GB stored

### Pricing Estimate (Monthly)

For a typical tax prep application:
- **CloudWatch Logs**: ~100MB/month = ~$0.50
- **SNS**: ~50 critical alerts = Free tier
- **Total**: ~$0.50 - $1.00/month

## Testing

### Test CloudWatch Logs Integration

```bash
# Trigger a test error from browser console
fetch('/api/logs/client', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'critical',
    message: 'Test error for CloudWatch',
    context: 'test',
    details: { test: true },
    url: window.location.href,
    userAgent: navigator.userAgent,
    sessionId: 'test-session'
  })
});

# Check CloudWatch Logs
aws logs tail /ross-tax-prep/client-errors --follow
```

### Test SNS Alerts

```bash
# Same as above - critical errors trigger SNS
# Check your email for the alert
```

## Troubleshooting

### Issue: Logs not appearing in CloudWatch

**Solution:**
1. Verify AWS credentials are correct
2. Check IAM policy has `logs:CreateLogStream` and `logs:PutLogEvents`
3. Ensure log group exists: `aws logs describe-log-groups --log-group-name-prefix /ross-tax-prep`
4. Check Cloudflare Worker logs for errors
5. Verify AWS region matches in all configurations

### Issue: SNS alerts not received

**Solution:**
1. Confirm subscription: `aws sns list-subscriptions-by-topic --topic-arn YOUR_ARN`
2. Check subscription is confirmed (not "PendingConfirmation")
3. Verify IAM policy has `sns:Publish` permission
4. Test SNS directly: `aws sns publish --topic-arn YOUR_ARN --message "Test"`
5. Check spam folder for email alerts

### Issue: High AWS costs

**Solution:**
1. Reduce log retention period
2. Implement rate limiting on client-side logger
3. Filter logs before sending to CloudWatch
4. Use CloudWatch Logs Insights instead of exporting to S3

### Issue: Authentication errors

**Solution:**
1. Verify access keys are not expired
2. Rotate keys if compromised: `aws iam create-access-key --user-name cloudflare-logs`
3. Ensure secrets are correctly set in Cloudflare
4. Check for typos in region or ARN

## Security Best Practices

1. **Rotate Credentials**: Rotate AWS access keys every 90 days
2. **Use IAM Roles**: Consider AWS STS for temporary credentials (advanced)
3. **Encrypt Secrets**: Mark AWS credentials as encrypted in Cloudflare
4. **Monitor Access**: Enable CloudTrail for IAM and SNS API calls
5. **Least Privilege**: Use minimal IAM policy (see above)
6. **MFA**: Enable MFA on AWS root and IAM user accounts
7. **IP Restrictions**: Consider restricting IAM user to Cloudflare IP ranges

## Migration from Generic MCP Server

If you're currently using `MCP_SERVER_URL`:

1. AWS integration runs in parallel with MCP server
2. Both will receive critical errors
3. Remove `MCP_SERVER_URL` when AWS is validated
4. No code changes required - configuration only

## Support Resources

- [AWS CloudWatch Logs Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Ross Tax Prep Cloud Integration](./CLOUD-INTEGRATION.md)

## Next Steps

1. ✅ Complete AWS setup (CloudWatch + SNS)
2. ✅ Configure Cloudflare environment variables
3. ✅ Test error logging end-to-end
4. ⬜ Set up CloudWatch Dashboard
5. ⬜ Configure CloudWatch Alarms
6. ⬜ Review logs weekly for patterns
7. ⬜ Optimize retention and costs

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
