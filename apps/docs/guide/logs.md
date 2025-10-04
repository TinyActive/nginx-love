# Log Analysis Guide

This comprehensive guide covers log analysis in the Nginx WAF Management Platform, including viewing different log types, filtering and searching logs, analyzing security events, and troubleshooting issues through log data.

## Overview

The log analysis system provides:
- **Centralized Logging**: Access to all system logs in one interface
- **Real-time Viewing**: Live log streaming for real-time monitoring
- **Advanced Filtering**: Filter logs by type, domain, time range, and more
- **Search Capabilities**: Search logs using keywords and patterns
- **Security Analysis**: Identify security threats and attack patterns
- **Export Functionality**: Export logs for external analysis

## Log Analysis Interface

Access log analysis by clicking **Logs** in the sidebar navigation:

![Domain Logs](/reference/screenshots/domain_log.png)

The log analysis interface provides:
- **Log Type Selection**: Choose between different log types
- **Filter Options**: Filter logs by various criteria
- **Search Bar**: Search for specific log entries
- **Log Display**: Formatted log entries with highlighting
- **Export Options**: Download logs in various formats

## Log Types

The platform collects and analyzes several types of logs:

### Access Logs

Access logs record all HTTP requests to your domains:

**Log Format**:
```
192.168.1.100 - - [04/Oct/2025:10:00:00 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://example.com/dashboard" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

**Access Log Fields**:
- **Remote Address**: Client IP address
- **Remote User**: Authenticated username (if any)
- **Timestamp**: Request date and time
- **Request**: HTTP method, path, and protocol
- **Status**: HTTP response status code
- **Body Size**: Response body size in bytes
- **Referer**: Referring page
- **User Agent**: Client browser information

### Error Logs

Error logs record server errors and issues:

**Log Format**:
```
2025/10/04 10:00:00 [error] 1234#0: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.100, server: example.com, request: "GET /api/data HTTP/1.1", upstream: "http://192.168.1.200:8080/api/data"
```

**Error Log Fields**:
- **Timestamp**: Error date and time
- **Log Level**: Error severity (error, warn, info, debug)
- **Process ID**: Nginx process ID
- **Connection ID**: Connection identifier
- **Error Message**: Detailed error description
- **Client Information**: Client IP and request details
- **Upstream Information**: Backend server details

### ModSecurity Logs

ModSecurity logs record security events and rule matches:

**Log Format**:
```
[04/Oct/2025:10:00:00 +0000] [-] [error] [client 192.168.1.100] ModSecurity: Access denied with code 403 (phase 2). Matched "Operator `Rx' with parameter `(?i:(?:[.;&\\|`'"]|(?:%[0-9a-f]{2}))+select(?:[\\s]+(?:distinct|all))?)" against variable "ARGS:sql" (Value: "';SELECT * FROM users;--") [file "/etc/nginx/modsec/REQUEST-942-APPLICATION-ATTACK-SQLI.conf"] [line "173"] [id "942100"] [rev ""] [msg "SQL Injection Attack Detected"] [data "Matched Data: ';SELECT found within ARGS:sql"] [severity "CRITICAL"] [ver "OWASP_CRS/3.3.0"] [tag "application-multi"] [tag "language-multi"] [tag "platform-multi"] [tag "attack-sqli"] [tag "OWASP_CRS/WEB_ATTACK/SQL_INJECTION"] [tag "WASCTC/WASC-19"] [tag "OWASP_TOP_10/A1"] [tag "OWASP_AppSec/REGEX/941100"] [hostname "example.com"] [uri "/api/search"] [unique_id "X123456"]
```

**ModSecurity Log Fields**:
- **Timestamp**: Event date and time
- **Client IP**: Source IP address
- **Action**: Action taken (deny, allow, etc.)
- **Phase**: Processing phase (1-5)
- **Match Details**: Rule match information
- **Rule Information**: Rule ID, file, line number
- **Message**: Rule description
- **Data**: Matched data
- **Severity**: Event severity
- **Tags**: Event tags and categories

### System Logs

System logs record application and system events:

**Log Format**:
```
2025-10-04T10:00:00.000Z [INFO] (nginx-love-api) User admin logged in successfully from 192.168.1.100
```

**System Log Fields**:
- **Timestamp**: Event date and time (ISO 8601)
- **Log Level**: Event severity (INFO, WARN, ERROR, DEBUG)
- **Component**: System component generating the log
- **Message**: Event description
- **Metadata**: Additional event data

## Viewing Logs

### Selecting Log Types

1. Click **Logs** in the sidebar
2. Select the log type from the dropdown:
   - **Access**: HTTP access logs
   - **Error**: Server error logs
   - **ModSecurity**: Security event logs
   - **System**: Application and system logs

### Filtering Logs

Filter logs to find specific information:

#### By Domain

1. Select a domain from the **Domain** dropdown
2. Only logs for that domain will be displayed
3. Select "All Domains" to view logs for all domains

#### By Time Range

1. Select a time range from the **Time Range** dropdown:
   - **Last Hour**: Recent log entries
   - **Last 24 Hours**: Logs from the past day
   - **Last 7 Days**: Logs from the past week
   - **Last 30 Days**: Logs from the past month
   - **Custom Range**: Specific date and time range

2. For custom ranges, select start and end dates

#### By Log Level

1. Select log levels from the **Log Level** dropdown:
   - **Error**: Error messages and critical issues
   - **Warning**: Warning messages and potential issues
   - **Info**: Informational messages
   - **Debug**: Debug messages (verbose)

2. Multiple levels can be selected

#### By Status Code (Access Logs)

1. Select status codes from the **Status Code** dropdown:
   - **2xx**: Success responses (200-299)
   - **3xx**: Redirection responses (300-399)
   - **4xx**: Client errors (400-499)
   - **5xx**: Server errors (500-599)

### Searching Logs

Search for specific log entries using the search bar:

#### Text Search

Enter keywords to search for in log messages:
```
search term
```

#### Regular Expression Search

Use regular expressions for advanced searching:
```
regex:(error|warning|critical)
```

#### Field-Specific Search

Search specific log fields:
```
status:404
ip:192.168.1.100
user:admin
```

#### Combined Search

Combine multiple search criteria:
```
status:5xx ip:192.168.1.100
```

## Log Analysis

### Analyzing Access Patterns

Analyze access logs to understand traffic patterns:

#### Traffic Volume

Monitor request volume over time:
- **Peak Hours**: Identify busiest times
- **Traffic Sources**: Identify top referrers
- **Popular Pages**: Identify most requested content
- **User Agents**: Identify browser and OS distribution

#### Geographic Analysis

Analyze traffic by geographic location:
- **Top Countries**: Countries with most traffic
- **Top Cities**: Cities with most traffic
- **Unusual Locations**: Identify unexpected geographic sources

#### Response Code Analysis

Analyze HTTP response codes:
- **Success Rate**: Percentage of successful requests
- **Error Rate**: Percentage of error responses
- **Redirect Rate**: Percentage of redirects
- **Client Errors**: 4xx error analysis
- **Server Errors**: 5xx error analysis

### Security Analysis

Analyze security logs to identify threats:

#### Attack Detection

Identify potential attacks in ModSecurity logs:
- **SQL Injection**: Look for SQL injection patterns
- **XSS Attacks**: Look for cross-site scripting attempts
- **Command Injection**: Look for command execution attempts
- **Path Traversal**: Look for directory traversal attempts
- **Brute Force**: Look for repeated login attempts

#### IP Analysis

Analyze source IP addresses:
- **Top Attackers**: IPs with most security events
- **Geographic Distribution**: Attack sources by country
- **Attack Patterns**: Common attack vectors by IP
- **Reputation**: Check IP reputation against threat intelligence

#### Attack Trends

Analyze attack trends over time:
- **Attack Volume**: Number of attacks over time
- **Attack Types**: Most common attack types
- **Targeted Resources**: Most attacked endpoints
- **Success Rate**: Percentage of successful attacks

### Performance Analysis

Analyze logs to identify performance issues:

#### Response Time Analysis

Analyze response times from access logs:
- **Average Response Time**: Overall performance metric
- **Slow Requests**: Identify slow endpoints
- **Response Time Distribution**: Performance distribution
- **Performance Trends**: Performance over time

#### Error Analysis

Analyze error logs to identify issues:
- **Error Frequency**: Most common errors
- **Error Patterns**: Error occurrence patterns
- **Error Impact**: Impact of errors on users
- **Error Resolution**: Error resolution time

#### Upstream Analysis

Analyze upstream server performance:
- **Upstream Response Times**: Backend server performance
- **Upstream Errors**: Backend server errors
- **Upstream Failures**: Backend server failures
- **Load Balancing**: Load distribution across upstreams

## Log Export

Export logs for external analysis and compliance:

### Export Formats

1. Click **Logs** in the sidebar
2. Apply desired filters
3. Click **Export** button
4. Choose export format:
   - **JSON**: Structured data format
   - **CSV**: Comma-separated values
   - **TXT**: Plain text format
   - **Syslog**: Standard syslog format

### Export Options

Configure export options:
- **Date Range**: Select specific date range
- **Log Types**: Choose which log types to export
- **Fields**: Select specific fields to include
- **Compression**: Compress export file

### Scheduled Exports

Configure scheduled log exports:
1. Go to **System** settings
2. Click **Log Export** tab
3. Configure scheduled export:
   - **Frequency**: Daily, weekly, monthly
   - **Format**: Export file format
   - **Destination**: Export destination (email, FTP, etc.)
   - **Retention**: Export file retention period

## Log Retention

Configure log retention policies:

### Retention Policies

1. Go to **System** settings
2. Click **Log Retention** tab
3. Configure retention policies:
   - **Access Logs**: Retention period (default: 30 days)
   - **Error Logs**: Retention period (default: 90 days)
   - **ModSecurity Logs**: Retention period (default: 180 days)
   - **System Logs**: Retention period (default: 90 days)

### Storage Management

Monitor log storage usage:
- **Disk Usage**: Current disk usage by logs
- **Growth Rate**: Log growth rate over time
- **Storage Forecast**: Predicted storage needs
- **Cleanup Actions**: Automatic cleanup actions

## Troubleshooting with Logs

Use logs to troubleshoot common issues:

### Connection Issues

**Symptoms**: Users cannot connect to the server

**Log Analysis**:
1. Check error logs for connection refused messages
2. Check access logs for connection attempts
3. Check system logs for service status
4. Identify firewall or network issues

### Performance Issues

**Symptoms**: Slow response times

**Log Analysis**:
1. Check access logs for response times
2. Check error logs for timeout messages
3. Check ModSecurity logs for rule processing time
4. Identify bottlenecks and optimization opportunities

### SSL Issues

**Symptoms**: SSL certificate errors

**Log Analysis**:
1. Check error logs for SSL handshake errors
2. Check access logs for HTTPS requests
3. Check system logs for certificate status
4. Identify certificate configuration issues

### Security Issues

**Symptoms**: Security breaches or attacks

**Log Analysis**:
1. Check ModSecurity logs for attack patterns
2. Check access logs for suspicious requests
3. Check system logs for authentication events
4. Identify attack sources and methods

## API Integration

For programmatic log access, use the REST API:

### Get Logs
```bash
curl -X GET "http://localhost:3001/api/logs?type=access&domain=example.com&limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Log Statistics
```bash
curl -X GET "http://localhost:3001/api/logs/stats?type=modsecurity&timeframe=24h" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Available Domains
```bash
curl -X GET http://localhost:3001/api/logs/domains \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Download Logs
```bash
curl -X GET "http://localhost:3001/api/logs/download?type=error&format=json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o logs.json
```

## Best Practices

### Log Management

1. **Regular Review**: Regularly review logs for issues
2. **Proactive Monitoring**: Set up alerts for critical log events
3. **Log Retention**: Implement appropriate log retention policies
4. **Log Security**: Secure log files and limit access

### Security Analysis

1. **Threat Detection**: Use logs to detect security threats
2. **Incident Response**: Use logs for incident response
3. **Forensics**: Maintain logs for forensic analysis
4. **Compliance**: Ensure logs meet compliance requirements

### Performance Optimization

1. **Bottleneck Identification**: Use logs to identify performance bottlenecks
2. **Trend Analysis**: Analyze performance trends over time
3. **Capacity Planning**: Use logs for capacity planning
4. **Optimization**: Optimize based on log analysis

## Conclusion

Log analysis is essential for maintaining system security, performance, and reliability. By following this guide, you should be able to:

- View and filter different types of logs
- Search for specific log entries
- Analyze access patterns and security events
- Troubleshoot issues using log data
- Export logs for external analysis

For more information on related topics:
- [Domain Management](/guide/domains)
- [SSL Certificate Management](/guide/ssl)
- [ModSecurity WAF Configuration](/guide/modsecurity)
- [Performance Monitoring](/guide/performance)