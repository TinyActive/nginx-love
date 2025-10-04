# Logs API

The logs API provides endpoints for accessing and analyzing Nginx logs.

## Base URL

```
https://your-domain.com/api/logs
```

## Endpoints

### Get Access Logs

Get access logs for a domain.

**Endpoint:** `GET /domains/:domainId/access`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `statusCode` (number): Filter by status code
- `ipAddress` (string): Filter by IP address
- `url` (string): Filter by URL pattern
- `method` (string): Filter by HTTP method

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "timestamp": "2023-01-01T12:00:00Z",
        "ipAddress": "192.168.1.1",
        "method": "GET",
        "url": "/",
        "protocol": "HTTP/1.1",
        "statusCode": 200,
        "responseSize": 1024,
        "referrer": "https://example.com",
        "userAgent": "Mozilla/5.0...",
        "responseTime": 150
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

### Get Error Logs

Get error logs for a domain.

**Endpoint:** `GET /domains/:domainId/error`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `level` (string): Filter by log level (error, warn, info, debug)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "timestamp": "2023-01-01T12:00:00Z",
        "level": "error",
        "message": "Connection refused to upstream server",
        "context": {
          "upstream": "127.0.0.1:8080",
          "host": "example.com",
          "request": "GET /api/data HTTP/1.1"
        }
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

### Get Log Statistics

Get log statistics for a domain.

**Endpoint:** `GET /domains/:domainId/stats`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "totalRequests": 10000,
    "uniqueVisitors": 1000,
    "averageResponseTime": 150,
    "errorRate": 0.05,
    "topUrls": [
      {
        "url": "/",
        "requests": 1000,
        "percentage": 10
      }
    ],
    "topStatusCodes": [
      {
        "code": 200,
        "count": 8000,
        "percentage": 80
      }
    ],
    "topUserAgents": [
      {
        "userAgent": "Mozilla/5.0...",
        "requests": 5000,
        "percentage": 50
      }
    ],
    "topReferrers": [
      {
        "referrer": "https://google.com",
        "requests": 1000,
        "percentage": 10
      }
    ]
  }
}
```

### Search Logs

Search logs for a domain.

**Endpoint:** `POST /domains/:domainId/search`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "query": "error",
  "fields": ["message", "url"],
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-01-02T00:00:00Z",
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "timestamp": "2023-01-01T12:00:00Z",
        "level": "error",
        "message": "Connection refused to upstream server",
        "context": {
          "upstream": "127.0.0.1:8080",
          "host": "example.com",
          "request": "GET /api/data HTTP/1.1"
        }
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

### Export Logs

Export logs for a domain.

**Endpoint:** `POST /domains/:domainId/export`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "access",
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-01-02T00:00:00Z",
  "format": "csv",
  "filters": {
    "statusCode": [200, 404, 500],
    "method": ["GET", "POST"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://your-domain.com/api/downloads/log-export-123.csv",
    "expiresAt": "2023-01-02T00:00:00Z"
  }
}
```

### Create Log Alert

Create a log-based alert for a domain.

**Endpoint:** `POST /domains/:domainId/alerts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "High Error Rate Alert",
  "condition": "errorRate",
  "operator": "greaterThan",
  "threshold": 0.1,
  "duration": 300,
  "notificationMethod": "email",
  "notificationTarget": "admin@example.com",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "High Error Rate Alert",
    "condition": "errorRate",
    "operator": "greaterThan",
    "threshold": 0.1,
    "duration": 300,
    "notificationMethod": "email",
    "notificationTarget": "admin@example.com",
    "enabled": true,
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### List Log Alerts

Get a list of log alerts for a domain.

**Endpoint:** `GET /domains/:domainId/alerts`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "name": "High Error Rate Alert",
        "condition": "errorRate",
        "operator": "greaterThan",
        "threshold": 0.1,
        "duration": 300,
        "notificationMethod": "email",
        "notificationTarget": "admin@example.com",
        "enabled": true,
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Delete Log Alert

Delete a log alert.

**Endpoint:** `DELETE /domains/:domainId/alerts/:alertId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Alert deleted successfully"
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
    "query": "Search query is required",
    "startDate": "Start date is required"
  }
}