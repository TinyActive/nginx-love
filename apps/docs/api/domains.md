# Domains API

The domains API provides endpoints for managing Nginx domains.

## Base URL

```
https://your-domain.com/api/domains
```

## Endpoints

### List Domains

Get a list of all domains.

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
    "domains": [
      {
        "id": 1,
        "name": "example.com",
        "documentRoot": "/var/www/example.com",
        "listenPort": 80,
        "serverAlias": ["www.example.com"],
        "sslEnabled": false,
        "modSecurityEnabled": true,
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

### Get Domain

Get a specific domain by ID.

**Endpoint:** `GET /:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "example.com",
    "documentRoot": "/var/www/example.com",
    "listenPort": 80,
    "serverAlias": ["www.example.com"],
    "sslEnabled": false,
    "modSecurityEnabled": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Create Domain

Create a new domain.

**Endpoint:** `POST /`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "example.com",
  "documentRoot": "/var/www/example.com",
  "listenPort": 80,
  "serverAlias": ["www.example.com"],
  "sslEnabled": false,
  "modSecurityEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "example.com",
    "documentRoot": "/var/www/example.com",
    "listenPort": 80,
    "serverAlias": ["www.example.com"],
    "sslEnabled": false,
    "modSecurityEnabled": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Update Domain

Update an existing domain.

**Endpoint:** `PUT /:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "example.com",
  "documentRoot": "/var/www/example.com",
  "listenPort": 80,
  "serverAlias": ["www.example.com"],
  "sslEnabled": false,
  "modSecurityEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "example.com",
    "documentRoot": "/var/www/example.com",
    "listenPort": 80,
    "serverAlias": ["www.example.com"],
    "sslEnabled": false,
    "modSecurityEnabled": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Delete Domain

Delete a domain.

**Endpoint:** `DELETE /:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Domain deleted successfully"
}
```

### Reload Nginx

Reload Nginx configuration.

**Endpoint:** `POST /reload`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Nginx reloaded successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 404 Not Found
```json
{
  "success": false,
  "error": "Domain not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Domain name is required",
    "documentRoot": "Document root is required"
  }
}