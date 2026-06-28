# SSL Certificate Management Guide

This comprehensive guide covers SSL certificate management in the Nginx WAF Management Platform, including Let's Encrypt automation, manual certificate uploads, renewal processes, and troubleshooting.

## Overview

The SSL management system provides:
- **Automated Let's Encrypt Certificates**: Free, automated SSL certificates
- **Manual Certificate Upload**: Support for custom certificates
- **Automatic Renewal**: Configurable auto-renewal with alerts
- **Certificate Monitoring**: Track expiry dates and status
- **Certificate Chain Management**: Complete certificate chain handling

## SSL Management Interface

Access SSL management by:
1. Click **Domains** in the sidebar
2. Select a domain from the list
3. Click the **SSL** tab

![SSL Certificate](/reference/screenshots/ssl_cert.png)

The SSL interface provides:
- ** Status**: Visual indicators for certificate validity
- **Valid From**: Date of creation certificate information
- **Valid To**: Expired ssl
- **Actions**: Delete SSL 

## Let's Encrypt Certificates

Let's Encrypt provides free, automated SSL certificates that are ideal for most use cases.

### Prerequisites for Let's Encrypt

Before requesting a Let's Encrypt certificate, ensure:

1. **Domain DNS**: Your domain must point to this server's IP address
2. **Port 80 Access**: Port 80 must be accessible for domain validation
3. **Email Address**: Valid email for certificate notifications

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

### Renewal Notifications

Configure notifications for renewal events:

- **Expiry Warnings**: Certificate expiring soon (if auto-renewal fails)

## API Integration

For programmatic SSL management, use the REST API. **Docker:** use `http://localhost:8080/api`. **Legacy VM / debug overlay:** use `http://localhost:3001/api`.

### List SSL Certificates
```bash
curl -X GET http://localhost:8080/api/ssl \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue Let's Encrypt Certificate
```bash
curl -X POST http://localhost:8080/api/ssl/auto \
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
curl -X POST http://localhost:8080/api/ssl/manual \
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
curl -X POST http://localhost:8080/api/ssl/CERTIFICATE_ID/renew \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Certificate
```bash
curl -X DELETE http://localhost:8080/api/ssl/CERTIFICATE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For complete API documentation, see the [API Reference](/api/ssl).



For more information on related topics:
- [Domain Management](/guide/domains)
- [ModSecurity WAF Configuration](/guide/modsecurity)
- [Performance Monitoring](/guide/performance)
- [Log Analysis](/guide/logs)