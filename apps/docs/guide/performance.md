# Performance Monitoring Guide

This comprehensive guide covers performance monitoring in the Nginx WAF Management Platform, including system metrics, domain performance tracking, alert configuration, and performance optimization.

## Overview

The performance monitoring system provides:
- **Real-time Metrics**: Live system and domain performance data
- **Historical Analysis**: Performance trends over time
- **Alert System**: Configurable alerts for performance issues
- **Performance Reports**: Detailed performance analytics
- **Bottleneck Identification**: Tools to identify performance issues
- **Capacity Planning**: Data for scaling decisions

## Performance Monitoring Interface

Access performance monitoring by clicking **Performance** in the sidebar navigation:

![Performance](/reference/screenshots/Performance.png)

The performance interface provides:
- **System Metrics**: CPU, memory, network, and disk usage
- **Domain Performance**: Request rates, response times, error rates
- **Historical Data**: Performance trends over time
- **Alert Status**: Active and recent performance alerts
- **Performance Reports**: Detailed analytics and insights

## System Metrics

Monitor overall system performance through key metrics:

### CPU Usage

Track CPU utilization across all cores:

- **Current Usage**: Real-time CPU percentage
- **Core Distribution**: Usage per CPU core
- **Process Breakdown**: CPU usage by process
- **Historical Trends**: CPU usage over time

**Normal Range**: 0-70% for healthy systems
**Warning Range**: 70-85% for systems under load
**Critical Range**: 85-100% for systems in distress

### Memory Usage

Monitor memory utilization and allocation:

- **Total Memory**: System RAM capacity
- **Used Memory**: Currently allocated memory
- **Free Memory**: Available memory
- **Cached Memory**: Memory used for caching
- **Swap Usage**: Virtual memory usage

**Memory Types**:
- **RAM**: Physical memory
- **Swap**: Virtual memory on disk
- **Buffers**: Memory for I/O operations
- **Cache**: Memory for frequently accessed data

### Network Usage

Track network traffic and connectivity:

- **Bandwidth**: Incoming and outgoing traffic
- **Connection Count**: Active network connections
- **Packet Loss**: Percentage of lost packets
- **Latency**: Network response times

**Network Metrics**:
- **Throughput**: Data transfer rate (Mbps/Gbps)
- **Connections**: Active TCP/UDP connections
- **Errors**: Network errors and retransmissions
- **Interface Stats**: Per-network interface statistics

### Disk Usage

Monitor disk space and I/O performance:

- **Disk Space**: Used and available disk space
- **I/O Operations**: Read/write operations per second
- **Disk Latency**: Average response times
- **Disk Queue**: Pending I/O operations

**Disk Metrics**:
- **Usage Percentage**: Disk space utilization
- **Read/Write Speed**: Data transfer rates
- **IOPS**: Input/output operations per second
- **Queue Depth**: Number of pending operations

## Domain Performance

Monitor performance metrics for individual domains:

### Request Metrics

Track request volume and patterns:

- **Request Rate**: Requests per second (RPS)
- **Request Count**: Total requests over time period
- **Request Methods**: Distribution of GET, POST, PUT, DELETE
- **Request Size**: Average request payload size

### Response Metrics

Monitor response performance:

- **Response Time**: Average time to first byte (TTFB)
- **Response Size**: Average response payload size
- **Response Codes**: Distribution of HTTP status codes
- **Response Rate**: Responses per second

### Error Metrics

Track errors and issues:

- **Error Rate**: Percentage of failed requests
- **4xx Errors**: Client-side errors (400-499)
- **5xx Errors**: Server-side errors (500-599)
- **Timeouts**: Request timeout occurrences

### SSL Metrics

Monitor SSL/TLS performance:

- **Handshake Time**: SSL negotiation time
- **Session Resumption**: SSL session reuse rate
- **Cipher Usage**: Distribution of SSL ciphers
- **Protocol Usage**: SSL/TLS protocol versions

## Performance Dashboard

The main performance dashboard provides an overview of system health:

### System Overview

- **CPU Usage**: Real-time CPU utilization
- **Memory Usage**: Current memory consumption
- **Network Traffic**: Incoming/outgoing bandwidth
- **Disk Usage**: Storage utilization
- **Load Average**: System load over time periods

### Domain Performance

- **Top Domains**: Domains by request volume
- **Response Times**: Average response times by domain
- **Error Rates**: Error percentages by domain
- **Throughput**: Data transfer rates by domain

### Recent Alerts

- **Active Alerts**: Currently unresolved performance issues
- **Recent History**: Recently resolved alerts
- **Alert Severity**: Critical, warning, or info alerts
- **Alert Sources**: System components generating alerts

## Historical Analysis

Analyze performance trends over time:

### Time Range Selection

Select custom time ranges for analysis:
- **Last Hour**: Recent performance data
- **Last 24 Hours**: Daily performance patterns
- **Last 7 Days**: Weekly performance trends
- **Last 30 Days**: Monthly performance analysis
- **Custom Range**: Specific date and time range

### Performance Graphs

Visualize performance data with interactive graphs:

- **Line Graphs**: Trends over time
- **Bar Charts**: Comparisons between categories
- **Heat Maps**: Performance patterns by time
- **Area Charts**: Cumulative metrics

### Performance Reports

Generate detailed performance reports:

#### System Performance Report

- **Executive Summary**: Key performance indicators
- **Resource Utilization**: CPU, memory, disk, network usage
- **Performance Trends**: Historical performance data
- **Bottleneck Analysis**: Identified performance issues
- **Recommendations**: Optimization suggestions

#### Domain Performance Report

- **Traffic Analysis**: Request patterns and volume
- **Response Performance**: Response times and throughput
- **Error Analysis**: Error rates and types
- **SSL Performance**: SSL/TLS metrics
- **User Experience**: Page load times and availability

## Alert Configuration

Configure alerts to notify you of performance issues:

### Alert Types

#### System Alerts

- **High CPU Usage**: CPU utilization exceeds threshold
- **High Memory Usage**: Memory utilization exceeds threshold
- **Low Disk Space**: Available disk space below threshold
- **Network Issues**: High latency or packet loss

#### Domain Alerts

- **High Response Time**: Response time exceeds threshold
- **High Error Rate**: Error percentage exceeds threshold
- **Low Throughput**: Request rate below threshold
- **SSL Certificate Expiry**: Certificate expiring soon

### Creating Alert Rules

1. Click **Alerts** in the sidebar
2. Go to **Alert Rules** tab
3. Click **Add Alert Rule**
4. Configure alert parameters:

![Alert Rule](/reference/screenshots/alert_rule.png)

**Alert Configuration**:
- **Name**: Descriptive alert name
- **Condition**: Performance metric to monitor
- **Threshold**: Alert trigger value
- **Severity**: Critical, warning, or info
- **Check Interval**: How often to check the condition

**Example Alert Rules**:

1. **High CPU Usage**:
   ```
   Name: High CPU Usage
   Condition: cpu > 80
   Threshold: 80%
   Severity: Warning
   Check Interval: 300 seconds (5 minutes)
   ```

2. **Slow Response Time**:
   ```
   Name: Slow Response Time
   Condition: response_time > 1000
   Threshold: 1000ms
   Severity: Warning
   Check Interval: 60 seconds (1 minute)
   ```

3. **High Error Rate**:
   ```
   Name: High Error Rate
   Condition: error_rate > 5
   Threshold: 5%
   Severity: Critical
   Check Interval: 60 seconds (1 minute)
   ```

### Notification Channels

Configure how alerts are delivered:

#### Email Notifications

1. Click **Alerts** in the sidebar
2. Go to **Notification Channels** tab
3. Click **Add Channel**
4. Select **Email** as channel type

![Alert Channel](/reference/screenshots/alert_chanel.png)

**Email Configuration**:
- **Name**: Channel name (e.g., "Email Alerts")
- **SMTP Server**: Mail server address
- **SMTP Port**: Mail server port (587 for TLS)
- **Username**: SMTP username
- **Password**: SMTP password or app password
- **Recipients**: Email addresses to receive alerts

#### Telegram Notifications

1. Click **Add Channel**
2. Select **Telegram** as channel type

**Telegram Configuration**:
- **Name**: Channel name (e.g., "Telegram Bot")
- **Bot Token**: Telegram bot token
- **Chat ID**: Telegram chat ID for notifications

### Alert Management

#### Viewing Alerts

1. Click **Alerts** in the sidebar
2. View active and historical alerts
3. Filter by severity, source, or time range

#### Acknowledging Alerts

1. Select an alert from the list
2. Click **Acknowledge**
3. Add acknowledgment notes
4. Alert will be marked as acknowledged

#### Resolving Alerts

1. Select an alert from the list
2. Click **Resolve**
3. Add resolution notes
4. Alert will be marked as resolved

## Performance Optimization

Use performance data to optimize your system:

### Identifying Bottlenecks

Analyze performance metrics to identify bottlenecks:

#### CPU Bottlenecks

**Symptoms**:
- High CPU utilization (>80%)
- Slow response times
- High load averages

**Solutions**:
- Optimize application code
- Enable caching
- Scale horizontally (add more servers)
- Upgrade CPU resources

#### Memory Bottlenecks

**Symptoms**:
- High memory utilization (>80%)
- Swap usage
- Out-of-memory errors

**Solutions**:
- Optimize memory usage
- Increase memory allocation
- Fix memory leaks
- Implement memory caching

#### Network Bottlenecks

**Symptoms**:
- High network latency
- Packet loss
- Low throughput

**Solutions**:
- Optimize network configuration
- Increase bandwidth
- Implement CDN
- Optimize application protocols

#### Disk Bottlenecks

**Symptoms**:
- High disk I/O wait
- Slow disk operations
- Low disk space

**Solutions**:
- Optimize disk usage
- Implement disk caching
- Upgrade to faster storage
- Clean up unnecessary files

### Performance Tuning

#### Nginx Optimization

Optimize Nginx configuration for better performance:

```nginx
# Worker processes (equal to CPU cores)
worker_processes auto;

# Worker connections
worker_connections 1024;

# Keep alive timeout
keepalive_timeout 65;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Application Optimization

Optimize your backend applications:

- **Database Optimization**: Optimize queries, add indexes
- **Caching**: Implement Redis or Memcached
- **Connection Pooling**: Reuse database connections
- **Code Optimization**: Profile and optimize slow code

#### SSL Optimization

Optimize SSL/TLS configuration:

```nginx
# SSL session cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# SSL protocols
ssl_protocols TLSv1.2 TLSv1.3;

# SSL ciphers
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

# Enable OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
```

## Capacity Planning

Use performance data for capacity planning:

### Resource Scaling

Plan resource scaling based on performance trends:

- **CPU Scaling**: Add CPU cores when utilization exceeds 70%
- **Memory Scaling**: Add RAM when usage exceeds 80%
- **Disk Scaling**: Add storage when usage exceeds 80%
- **Network Scaling**: Increase bandwidth when utilization exceeds 70%

### Load Balancing

Optimize load balancing for better performance:

- **Algorithm Selection**: Choose appropriate load balancing algorithm
- **Health Checks**: Configure proper health checks
- **Session Persistence**: Implement sticky sessions if needed
- **Failover**: Configure proper failover mechanisms

### Performance Monitoring

Implement continuous performance monitoring:

- **Baseline Metrics**: Establish performance baselines
- **Trend Analysis**: Monitor performance trends over time
- **Anomaly Detection**: Identify unusual performance patterns
- **Predictive Analysis**: Forecast future resource needs

## API Integration

For programmatic performance monitoring, use the REST API:

### Get Performance Metrics
```bash
curl -X GET "http://localhost:3001/api/performance/metrics?metric=cpu&timeframe=1h" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Performance Stats
```bash
curl -X GET http://localhost:3001/api/performance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Performance History
```bash
curl -X GET "http://localhost:3001/api/performance/history?domain=example.com&timeframe=24h" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cleanup Old Metrics
```bash
curl -X DELETE http://localhost:3001/api/performance/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

### Performance Monitoring

1. **Set Baselines**: Establish performance baselines for comparison
2. **Monitor Continuously**: Implement continuous monitoring
3. **Configure Alerts**: Set up appropriate alerts for issues
4. **Review Regularly**: Regularly review performance data

### Performance Optimization

1. **Identify Bottlenecks**: Use data to identify performance issues
2. **Optimize Systematically**: Address issues systematically
3. **Test Changes**: Test optimizations before deployment
4. **Monitor Impact**: Monitor the impact of optimizations

### Capacity Planning

1. **Plan for Growth**: Plan for future growth requirements
2. **Monitor Trends**: Monitor performance trends over time
3. **Scale Proactively**: Scale resources before issues occur
4. **Document Decisions**: Document scaling decisions and rationale

## Conclusion

Performance monitoring is essential for maintaining system health and optimizing user experience. By following this guide, you should be able to:

- Monitor system and domain performance effectively
- Configure alerts for performance issues
- Analyze performance trends and identify bottlenecks
- Optimize system performance based on data
- Plan for future capacity needs

For more information on related topics:
- [Domain Management](/guide/domains)
- [SSL Certificate Management](/guide/ssl)
- [ModSecurity WAF Configuration](/guide/modsecurity)
- [Log Analysis](/guide/logs)