# Domain Management Guide

This comprehensive guide covers all aspects of domain management in the Nginx WAF Management Platform, including adding domains, configuring upstream servers, load balancing, and advanced domain configurations.

## Overview

The domain management system allows you to:
- Add and configure multiple domains
- Set up load balancing with multiple upstream servers
- Configure health checks and failover
- Manage SSL certificates for each domain
- Enable ModSecurity WAF protection
- Monitor domain performance and availability

## Domain Management Interface

Access the domain management by clicking **Domains** in the sidebar navigation:

![Domain Management](/reference/screenshots/Domain_Management.png)

The interface provides:
- **Domain List**: Overview of all configured domains
- **Status Indicators**: Visual indicators for domain health
- **Quick Actions**: Common tasks for each domain
- **Search and Filter**: Find specific domains quickly

## Adding a New Domain

### Basic Domain Configuration

1. Click the **Add Domain** button
2. Fill in the basic domain information:

![Add Domain](/reference/screenshots/domain_add.png)

**Required Fields:**
- **Domain Name**: The domain name (e.g., `example.com`, `api.example.com`)
- **Upstream Servers**: At least one backend server

**Optional Settings:**
- **Status**: Active or Inactive
- **SSL Enabled**: Enable/disable SSL for this domain
- **ModSecurity Enabled**: Enable/disable WAF protection

### Domain Name Configuration

When entering a domain name, follow these guidelines:

- **Valid Characters**: Letters (a-z), numbers (0-9), hyphens (-)
- **Cannot Start/End**: Cannot start or end with a hyphen
- **Subdomains**: Use dot notation for subdomains (e.g., `api.example.com`)
- **Wildcards**: Wildcard domains are supported (*.example.com)

**Examples of Valid Domain Names:**
```
example.com
api.example.com
www.example.com
*.example.com
my-app.example.org
```

## Upstream Server Configuration

Upstream servers are the backend servers that handle the actual requests. Each domain must have at least one upstream server configured.

### Adding Upstream Servers

For each upstream server, configure the following:

#### Basic Configuration
- **Host**: IP address or hostname of the backend server
- **Port**: Port number (1-65535)
- **Protocol**: HTTP or HTTPS
- **Weight**: Load balancing weight (default: 1)
- **Max Fails**: Maximum failed attempts before marking as down (default: 3)
- **Fail Timeout**: Timeout in seconds before retrying (default: 10)

#### Advanced Configuration
- **SSL Verify**: Verify SSL certificates for HTTPS backends
- **Backup**: Mark server as backup (only used when all primary servers are down)
- **Down**: Manually mark server as down for maintenance

### Upstream Server Examples

#### Single Backend Server
```
Host: 192.168.1.100
Port: 8080
Protocol: HTTP
Weight: 1
Max Fails: 3
Fail Timeout: 10
SSL Verify: Yes
```

#### Multiple Backend Servers (Load Balancing)
```
Server 1:
  Host: 192.168.1.100
  Port: 8080
  Weight: 3
  
Server 2:
  Host: 192.168.1.101
  Port: 8080
  Weight: 2
  
Server 3 (Backup):
  Host: 192.168.1.102
  Port: 8080
  Weight: 1
  Backup: Yes
```

#### HTTPS Backend with SSL Verification
```
Host: api.backend.com
Port: 443
Protocol: HTTPS
Weight: 1
SSL Verify: Yes
```

## Load Balancing Configuration

The platform supports multiple load balancing algorithms to distribute traffic across upstream servers.

### Load Balancing Algorithms

#### Round Robin (Default)
Requests are distributed evenly across all available servers.

```nginx
upstream backend {
    server 192.168.1.100:8080 weight=1;
    server 192.168.1.101:8080 weight=1;
}
```

#### Least Connections
Requests are sent to the server with the fewest active connections.

```nginx
upstream backend {
    least_conn;
    server 192.168.1.100:8080 weight=1;
    server 192.168.1.101:8080 weight=1;
}
```

#### IP Hash
Client IP address is used to determine which server receives the request, ensuring session persistence.

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.100:8080;
    server 192.168.1.101:8080;
}
```

### Configuring Load Balancing

1. Select your domain from the list
2. Click the **Load Balancer** tab
3. Choose the appropriate algorithm
4. Configure health check settings

### Health Check Configuration

Health checks ensure that only healthy backend servers receive traffic.

#### Health Check Settings
- **Enabled**: Enable/disable health checks
- **Interval**: Check interval in seconds (default: 30)
- **Timeout**: Request timeout in seconds (default: 5)
- **Path**: Health check endpoint path (default: /)
- **Success Criteria**: HTTP status codes considered healthy (default: 200, 204)

#### Health Check Example
```
Enabled: Yes
Interval: 30 seconds
Timeout: 5 seconds
Path: /health
Success Criteria: 200, 204
```

## Advanced Domain Configuration

### Custom Nginx Configuration

For advanced use cases, you can add custom Nginx configuration directives:

1. Select your domain from the list
2. Click the **Advanced** tab
3. Add custom configuration in the text area

#### Example Custom Configuration
```nginx
# Custom headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# CORS configuration
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain; charset=utf-8';
    add_header 'Content-Length' 0;
    return 204;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

### URL Rewriting and Redirects

Configure URL rewriting and redirects for your domain:

#### Permanent Redirect (301)
```nginx
# Redirect old domain to new domain
server_name old-domain.com;
return 301 $scheme://new-domain.com$request_uri;
```

#### Temporary Redirect (302)
```nginx
# Temporary maintenance redirect
return 302 /maintenance.html;
```

#### URL Rewriting
```nginx
# Rewrite rules
location /old-path/ {
    rewrite ^/old-path/(.*)$ /new-path/$1 permanent;
}
```

## Domain Status and Monitoring

### Domain Status Indicators

Each domain displays status indicators:

- **Active**: Domain is online and accepting traffic
- **Inactive**: Domain is disabled and not accepting traffic
- **Error**: Domain has configuration errors or all upstreams are down

### Upstream Server Status

Upstream servers show individual health status:

- **Up**: Server is healthy and accepting traffic
- **Down**: Server is not responding or has failed health checks
- **Checking**: Health check is in progress

### Domain Performance Metrics

Monitor domain performance through the **Performance** tab:

- **Request Rate**: Requests per second
- **Response Time**: Average response time
- **Error Rate**: Percentage of failed requests
- **Bandwidth**: Data transfer statistics

## Domain Operations

### Editing a Domain

1. Select the domain from the list
2. Click the **Edit** button
3. Make your changes
4. Click **Save** to apply changes

### Toggling Domain Status

Quickly enable or disable a domain:

1. Select the domain from the list
2. Click the **Toggle Status** button
3. Confirm the action

### Deleting a Domain

⚠️ **Warning**: Deleting a domain will remove all configuration and cannot be undone.

1. Select the domain from the list
2. Click the **Delete** button
3. Confirm the deletion

### Reloading Nginx Configuration

After making changes to domain configuration, you may need to reload Nginx:

1. Click the **Reload Nginx** button in the domain list
2. Or use the system-wide reload in **System** settings

## Troubleshooting Domain Issues

### Common Issues and Solutions

#### Domain Not Accessible

**Symptoms**: 502 Bad Gateway, connection refused

**Possible Causes**:
- All upstream servers are down
- Incorrect upstream configuration
- Network connectivity issues

**Solutions**:
1. Check upstream server status
2. Verify host and port configuration
3. Test connectivity to upstream servers
4. Check firewall rules

#### SSL Certificate Issues

**Symptoms**: SSL warnings, certificate errors

**Possible Causes**:
- Expired SSL certificate
- Incorrect certificate configuration
- Domain mismatch

**Solutions**:
1. Check SSL certificate validity
2. Verify certificate matches domain
3. Renew or reissue certificate
4. Check certificate chain

#### Load Balancing Not Working

**Symptoms**: All traffic going to one server

**Possible Causes**:
- Incorrect load balancing algorithm
- Server weights not configured
- Health checks failing

**Solutions**:
1. Verify load balancing algorithm
2. Check server weights
3. Review health check configuration
4. Monitor server health status

### Debug Mode

Enable debug mode for detailed logging:

1. Go to **System** settings
2. Enable **Debug Mode**
3. Check logs in **Logs** section
4. Disable debug mode when finished

## Best Practices

### Domain Configuration

1. **Use Descriptive Names**: Make domain names clear and descriptive
2. **Organize by Environment**: Separate production, staging, and development domains
3. **Document Configuration**: Keep records of special configurations
4. **Regular Backups**: Backup domain configurations regularly

### Upstream Server Management

1. **Multiple Servers**: Always configure at least two upstream servers for redundancy
2. **Health Checks**: Enable health checks for all production domains
3. **Weight Distribution**: Use appropriate weights based on server capacity
4. **Backup Servers**: Configure backup servers for high availability

### Security

1. **SSL Everywhere**: Enable SSL for all production domains
2. **ModSecurity**: Enable WAF protection for all public-facing domains
3. **Access Control**: Use ACLs to restrict access as needed
4. **Regular Updates**: Keep SSL certificates and security rules updated

### Performance

1. **Monitor Metrics**: Regularly check performance metrics
2. **Optimize Configuration**: Tune settings based on traffic patterns
3. **Load Testing**: Test configuration under load
4. **Capacity Planning**: Plan for growth and scale accordingly

## API Integration

For programmatic domain management, use the REST API:

### List Domains
```bash
curl -X GET http://localhost:3001/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Domain
```bash
curl -X POST http://localhost:3001/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api.example.com",
    "status": "active",
    "upstreams": [
      {
        "host": "192.168.1.100",
        "port": 8080,
        "weight": 1
      }
    ]
  }'
```

### Update Domain
```bash
curl -X PUT http://localhost:3001/api/domains/DOMAIN_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "upstreams": [
      {
        "host": "192.168.1.100",
        "port": 8080,
        "weight": 2
      }
    ]
  }'
```

### Delete Domain
```bash
curl -X DELETE http://localhost:3001/api/domains/DOMAIN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For complete API documentation, see the [API Reference](/api/domains).

## Conclusion

Domain management is a core feature of the Nginx WAF Management Platform. By following this guide, you should be able to:

- Add and configure domains effectively
- Set up reliable load balancing
- Monitor domain performance
- Troubleshoot common issues
- Implement best practices for production use

For more information on related topics:
- [SSL Certificate Management](/guide/ssl)
- [ModSecurity WAF Configuration](/guide/modsecurity)
- [Performance Monitoring](/guide/performance)
- [Log Analysis](/guide/logs)