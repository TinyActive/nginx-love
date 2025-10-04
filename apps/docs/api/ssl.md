# SSL API

The SSL API provides endpoints for managing SSL certificates.

## Base URL

```
https://your-domain.com/api/ssl
```

## Endpoints

### List SSL Certificates

Get a list of all SSL certificates.

**Endpoint:** `GET /`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": 1,
        "domainId": 1,
        "domainName": "example.com",
        "provider": "letsencrypt",
        "status": "active",
        "issuedAt": "2023-01-01T00:00:00Z",
        "expiresAt": "2023-04-01T00:00:00Z",
        "autoRenew": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get SSL Certificate

Get a specific SSL certificate by ID.

**Endpoint:** `GET /:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "domainId": 1,
    "domainName": "example.com",
    "provider": "letsencrypt",
    "status": "active",
    "issuedAt": "2023-01-01T00:00:00Z",
    "expiresAt": "2023-04-01T00:00:00Z",
    "autoRenew": true,
    "certificate": "-----BEGIN CERTIFICATE-----\n...",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
    "certificateChain": "-----BEGIN CERTIFICATE-----\n...",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Issue SSL Certificate

Issue a new SSL certificate.

**Endpoint:** `POST /issue`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "domainId": 1,
  "provider": "letsencrypt",
  "email": "admin@example.com",
  "autoRenew": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "domainId": 1,
    "domainName": "example.com",
    "provider": "letsencrypt",
    "status": "pending",
    "issuedAt": null,
    "expiresAt": null,
    "autoRenew": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Renew SSL Certificate

Renew an SSL certificate.

**Endpoint:** `POST /:id/renew`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Certificate renewal initiated"
}
```

### Revoke SSL Certificate

Revoke an SSL certificate.

**Endpoint:** `POST /:id/revoke`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Certificate revoked successfully"
}
```

### Upload Custom Certificate

Upload a custom SSL certificate.

**Endpoint:** `POST /upload`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "domainId": 1,
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
  "certificateChain": "-----BEGIN CERTIFICATE-----\n...",
  "autoRenew": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "domainId": 1,
    "domainName": "example.com",
    "provider": "custom",
    "status": "active",
    "issuedAt": "2023-01-01T00:00:00Z",
    "expiresAt": "2023-04-01T00:00:00Z",
    "autoRenew": false,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 404 Not Found
```json
{
  "success": false,
  "error": "Certificate not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "domainId": "Domain ID is required",
    "certificate": "Certificate is required"
  }
}