# Log Analysis

nginx-love provides comprehensive log analysis capabilities for Nginx access and error logs.

## Log Sources

nginx-love can analyze logs from:

- **Access Logs**: Nginx access logs
- **Error Logs**: Nginx error logs
- **ModSecurity Logs**: ModSecurity audit logs
- **Custom Logs**: User-defined log formats

## Access Log Analysis

### Overview

The access log analysis provides insights into:

- **Request Patterns**: Most requested URLs, referrers, user agents
- **Traffic Sources**: Geographic distribution, referrer analysis
- **Status Codes**: Breakdown of HTTP status codes
- **Response Times**: Response time distribution and outliers

### Filtering and Searching

Filter access logs by:

- **Date Range**: Select a specific time period
- **Status Code**: Filter by specific HTTP status codes
- **IP Address**: Filter by specific IP addresses
- **URL Pattern**: Filter by URL patterns
- **User Agent**: Filter by user agent strings

### Custom Queries

Create custom queries to analyze specific aspects of your traffic:

1. Navigate to the **Logs** section
2. Click **Access Logs**
3. Click **Custom Query**
4. Define your query using the query builder
5. Click **Run Query**

## Error Log Analysis

### Error Types

nginx-love categorizes errors into:

- **Client Errors**: 4xx status codes
- **Server Errors**: 5xx status codes
- **Configuration Errors**: Nginx configuration issues
- **System Errors**: System-level issues

### Error Resolution

nginx-love provides suggestions for resolving common errors:

- **404 Not Found**: Check for broken links or missing files
- **500 Internal Server Error**: Check application logs
- **502 Bad Gateway**: Check upstream server status
- **503 Service Unavailable**: Check server resources

## Log Retention

Configure log retention policies:

1. Navigate to **Settings** in the Logs section
2. Click **Retention**
3. Configure retention periods:
   - **Access Logs**: Retention period (default: 30 days)
   - **Error Logs**: Retention period (default: 90 days)
   - **ModSecurity Logs**: Retention period (default: 90 days)
4. Click **Save**

## Log Export

Export logs for external analysis:

1. Navigate to the **Logs** section
2. Select the log type (Access, Error, or ModSecurity)
3. Click **Export**
4. Configure export settings:
   - **Date Range**: Select the time period
   - **Format**: CSV, JSON, or plain text
   - **Filters**: Apply any necessary filters
5. Click **Export**

## Real-time Monitoring

Monitor logs in real-time:

1. Navigate to the **Logs** section
2. Click **Live View**
3. Select the log type to monitor
4. View logs as they are generated

## Alerting

Configure log-based alerts:

1. Navigate to the **Logs** section
2. Click **Alerts**
3. Click **Create Alert**
4. Configure alert settings:
   - **Trigger Condition**: What to alert on (error rate, specific error codes, etc.)
   - **Threshold**: Alert when condition is met
   - **Notification Method**: Email, webhook, or Slack
5. Click **Save**

## Troubleshooting

If you encounter issues with log analysis, check the [troubleshooting guide](/reference/troubleshooting).