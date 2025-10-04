# SSL Certificate Management Guide

This comprehensive guide covers SSL certificate management in the Nginx WAF Management Platform, including Let's Encrypt automation, manual certificate uploads, renewal processes, and troubleshooting.

## Overview

The SSL management system provides:
- **Automated Let's Encrypt Certificates**: Free, automated SSL certificates
- **Manual Certificate Upload**: Support for custom certificates
- **Automatic Renewal**: Configurable auto-renewal with alerts
- **Certificate Monitoring**: Track expiry dates and status
- **Multi-Domain Support**: SAN certificates and wildcard domains
- **Certificate Chain Management**: Complete certificate chain handling

## SSL Management Interface

Access SSL management by:
1. Click **Domains** in the sidebar
2. Select a domain from the list
3. Click the **SSL** tab

![SSL Certificate](/reference/screenshots/ssl_cert.png)

The SSL interface provides:
- **Certificate Status**: Visual indicators for certificate validity
- **Certificate Details**: Complete certificate information
- **Renewal Settings**: Auto-renewal configuration
- **Quick Actions**: Common SSL operations

## Let's Encrypt Certificates

Let's Encrypt provides free, automated SSL certificates that are ideal for most use cases.

### Prerequisites for Let's Encrypt

Before requesting a Let's Encrypt certificate, ensure:

1. **Domain DNS**: Your domain must point to this server's IP address
2. **Port 80 Access**: Port 80 must be accessible for domain validation
3. **Email Address**: Valid email for certificate notifications
4. **Domain Ownership**: You must control the domain

### Requesting a Let's Encrypt Certificate

1. Select your domain from the list
2. Click the **SSL** tab
3. Click **Enable SSL**
4. Select **Let's Encrypt** as the certificate provider

![Add SSL](/reference/screenshots/ssl_add.png)

5. Configure the certificate settings:
   - **Email Address**: For certificate notifications and recovery
   - **Auto-Renew**: Enable automatic renewal (recommended)
   - **Renewal Days**: Days before expiry to renew (default: 30)

6. Click **Save and Issue Certificate**

### Certificate Validation Process

Let's Encrypt uses the HTTP-01 challenge to validate domain ownership:

1. **Challenge File**: A temporary file is created in `/.well-known/acme-challenge/`
2. **Domain Verification**: Let's Encrypt attempts to access this file
3. **Certificate Issuance**: If successful, the certificate is issued
4. **Installation**: Certificate is automatically installed and configured

### Let's Encrypt Certificate Types

#### Single Domain Certificate
Covers only the specific domain name:
```
Domain: example.com
Covers: example.com
```

#### SAN Certificate (Multiple Domains)
Covers multiple domains in one certificate:
```
Domains: example.com, www.example.com, api.example.com
Covers: All listed domains
```

#### Wildcard Certificate
Covers a domain and all its subdomains:
```
Domain: *.example.com
Covers: example.com, www.example.com, api.example.com, etc.
```

⚠️ **Note**: Wildcard certificates require DNS validation, which may need manual configuration.

## Manual Certificate Upload

For scenarios where Let's Encrypt isn't suitable, you can upload custom certificates.

### When to Use Manual Certificates

- **Internal Domains**: Private/internal domain names
- **Corporate Certificates**: Organization-specific certificates
- **Extended Validation (EV)**: EV certificates that require special validation
- **Special Requirements**: Custom certificate requirements

### Uploading a Manual Certificate

1. Select your domain from the list
2. Click the **SSL** tab
3. Click **Enable SSL**
4. Select **Manual Upload** as the certificate provider

5. Upload the certificate files:
   - **Certificate**: Your domain certificate (.crt or .pem file)
   - **Private Key**: Your private key (.key file)
   - **Certificate Chain**: Optional intermediate certificates

6. Enter certificate details:
   - **Issuer**: Certificate authority (e.g., "DigiCert", "GlobalSign")
   - **Auto-Renew**: Enable/disable auto-renewal (if applicable)

7. Click **Save**

### Certificate File Formats

#### Certificate File (.crt, .pem)
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoKHHqH1+5cMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
...
-----END CERTIFICATE-----
```

#### Private Key File (.key)
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5...
-----END PRIVATE KEY-----
```

#### Certificate Chain File (.ca-bundle)
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoKHHqH1+5cMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoKHHqH1+5cMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
...
-----END CERTIFICATE-----
```

## Certificate Management

### Certificate Status Indicators

Certificates display status indicators:

- **Valid**: Certificate is valid and not expiring soon
- **Expiring**: Certificate expires within 30 days
- **Expired**: Certificate has expired
- **Error**: Certificate has configuration errors

### Certificate Details

View comprehensive certificate information:

- **Common Name**: Primary domain name
- **Subject Alternative Names (SANs)**: Additional domains covered
- **Issuer**: Certificate authority
- **Valid From**: Certificate issue date
- **Valid To**: Certificate expiry date
- **Serial Number**: Certificate serial number
- **Signature Algorithm**: Encryption algorithm used
- **Fingerprint**: Certificate fingerprint for verification

### Certificate Operations

#### Renew Certificate
1. Select the certificate
2. Click **Renew Certificate**
3. Confirm the renewal action

#### Replace Certificate
1. Select the certificate
2. Click **Replace Certificate**
3. Upload new certificate files
4. Click **Save**

#### Delete Certificate
⚠️ **Warning**: This will disable SSL for the domain.

1. Select the certificate
2. Click **Delete Certificate**
3. Confirm the deletion

## Automatic Renewal

Configure automatic renewal to ensure certificates never expire.

### Renewal Configuration

1. Select your domain
2. Click the **SSL** tab
3. Configure renewal settings:
   - **Auto-Renew**: Enable/disable automatic renewal
   - **Renewal Days**: Days before expiry to renew (default: 30)
   - **Notification Email**: Email for renewal notifications

### Renewal Process

The automatic renewal process:

1. **Expiry Check**: System checks certificate expiry daily
2. **Renewal Trigger**: Renewal starts when certificate is within renewal period
3. **Certificate Request**: New certificate is requested from Let's Encrypt
4. **Validation**: Domain ownership is validated
5. **Installation**: New certificate is installed
6. **Notification**: Success/failure notification is sent

### Renewal Notifications

Configure notifications for renewal events:

- **Success Notifications**: Certificate renewed successfully
- **Failure Notifications**: Renewal failed, manual intervention required
- **Expiry Warnings**: Certificate expiring soon (if auto-renewal fails)

## Advanced SSL Configuration

### SSL Protocols and Ciphers

Configure SSL protocols and ciphers for enhanced security:

1. Select your domain
2. Click the **Advanced** tab
3. Configure SSL settings

#### Recommended SSL Configuration
```nginx
# SSL Protocols
ssl_protocols TLSv1.2 TLSv1.3;

# SSL Ciphers
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;

# Prefer Server Ciphers
ssl_prefer_server_ciphers off;

# SSL Session Cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
```

### HTTP to HTTPS Redirect

Automatically redirect HTTP traffic to HTTPS:

1. Select your domain
2. Click the **Advanced** tab
3. Enable **Force HTTPS Redirect**

#### Redirect Configuration
```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}
```

### HSTS (HTTP Strict Transport Security)

Enable HSTS to enforce HTTPS connections:

1. Select your domain
2. Click the **Advanced** tab
3. Enable **HSTS**
4. Configure HSTS settings:
   - **Max Age**: Time in seconds (default: 31536000 = 1 year)
   - **Include Subdomains**: Apply to all subdomains
   - **Preload**: Include in browser preload list

#### HSTS Configuration
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Troubleshooting SSL Issues

### Common SSL Problems

#### Certificate Validation Failed

**Symptoms**: Let's Encrypt certificate issuance fails

**Possible Causes**:
- Domain doesn't point to server IP
- Port 80 blocked by firewall
- DNS propagation not complete
- Nginx configuration errors

**Solutions**:
1. Verify DNS A record points to server IP
2. Check port 80 accessibility: `telnet yourdomain.com 80`
3. Wait for DNS propagation (up to 48 hours)
4. Check Nginx configuration: `nginx -t`

#### Certificate Chain Issues

**Symptoms**: Browser shows certificate warnings

**Possible Causes**:
- Missing intermediate certificates
- Incorrect certificate order
- Incomplete certificate chain

**Solutions**:
1. Upload complete certificate chain
2. Verify certificate order (domain cert first, then intermediates)
3. Use certificate chain checker tools

#### Mixed Content Errors

**Symptoms**: Browser shows mixed content warnings

**Possible Causes**:
- HTTP resources on HTTPS page
- Insecure content loading

**Solutions**:
1. Update all resource URLs to HTTPS
2. Use protocol-relative URLs: `//example.com/resource`
3. Implement content security policy

### Debug Mode

Enable SSL debug mode for detailed logging:

1. Go to **System** settings
2. Enable **SSL Debug Mode**
3. Check logs in **Logs** section
4. Disable debug mode when finished

### SSL Certificate Testing

Test your SSL configuration with these tools:

#### Online SSL Testers
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Qualys SSL Test**: Comprehensive SSL analysis
- **Why No Padlock**: https://www.whynopadlock.com/

#### Command Line Tools
```bash
# Check certificate details
openssl s_client -connect example.com:443 -servername example.com

# Verify certificate chain
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt certificate.crt

# Check certificate expiry
openssl x509 -in certificate.crt -noout -dates
```

## Best Practices

### Certificate Management

1. **Auto-Renewal**: Always enable automatic renewal
2. **Monitoring**: Regularly check certificate status
3. **Backup**: Keep backup copies of certificates
4. **Documentation**: Document certificate configurations

### Security

1. **Strong Ciphers**: Use modern, secure cipher suites
2. **Protocol Versions**: Disable outdated protocols (SSLv2, SSLv3, TLSv1.0, TLSv1.1)
3. **HSTS**: Enable HSTS for enhanced security
4. **OCSP Stapling**: Enable OCSP stapling for performance

### Performance

1. **Session Cache**: Configure SSL session cache
2. **Session Tickets**: Enable SSL session tickets
3. **HTTP/2**: Enable HTTP/2 for better performance
4. **Certificate Size**: Use appropriate certificate key size (2048-bit minimum)

### Monitoring

1. **Expiry Alerts**: Configure alerts for certificate expiry
2. **Renewal Monitoring**: Monitor automatic renewal process
3. **Performance Metrics**: Track SSL performance metrics
4. **Error Tracking**: Monitor SSL-related errors

## API Integration

For programmatic SSL management, use the REST API:

### List SSL Certificates
```bash
curl -X GET http://localhost:3001/api/ssl \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue Let's Encrypt Certificate
```bash
curl -X POST http://localhost:3001/api/ssl/auto \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domainId": "DOMAIN_ID",
    "email": "admin@example.com",
    "autoRenew": true
  }'
```

### Upload Manual Certificate
```bash
curl -X POST http://localhost:3001/api/ssl/manual \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domainId": "DOMAIN_ID",
    "certificate": "-----BEGIN CERTIFICATE-----\n...",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
    "chain": "-----BEGIN CERTIFICATE-----\n...",
    "issuer": "Custom CA"
  }'
```

### Renew Certificate
```bash
curl -X POST http://localhost:3001/api/ssl/CERTIFICATE_ID/renew \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Certificate
```bash
curl -X DELETE http://localhost:3001/api/ssl/CERTIFICATE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For complete API documentation, see the [API Reference](/api/ssl).

## Conclusion

SSL certificate management is crucial for securing your web applications. By following this guide, you should be able to:

- Configure Let's Encrypt certificates automatically
- Upload and manage custom certificates
- Set up automatic renewal with monitoring
- Troubleshoot common SSL issues
- Implement SSL best practices

For more information on related topics:
- [Domain Management](/guide/domains)
- [ModSecurity WAF Configuration](/guide/modsecurity)
- [Performance Monitoring](/guide/performance)
- [Log Analysis](/guide/logs)