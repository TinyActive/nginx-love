# Performance API

The performance API provides endpoints for accessing performance metrics and monitoring data.

## Base URL

```
https://your-domain.com/api/performance
```

## Endpoints

### Get Performance Metrics

Get performance metrics for a domain.

**Endpoint:** `GET /domains/:domainId/metrics`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `interval` (string): Data interval (1m, 5m, 1h, 1d)
- `metrics` (string): Comma-separated list of metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "timestamp": "2023-01-01T12:00:00Z",
        "requestRate": 100,
        "responseTime": 150,
        "errorRate": 0.05,
        "activeConnections": 50,
        "incomingTraffic": 1024,
        "outgoingTraffic": 2048
      }
    ]
  }
}
```

### Get Performance Summary

Get a performance summary for a domain.

**Endpoint:** `GET /domains/:domainId/summary`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "requestRate": {
      "avg": 100,
      "min": 50,
      "max": 200
    },
    "responseTime": {
      "avg": 150,
      "min": 50,
      "max": 500,
      "p50": 120,
      "p95": 300,
      "p99": 450
    },
    "errorRate": {
      "avg": 0.05,
      "min": 0,
      "max": 0.1
    },
    "activeConnections": {
      "avg": 50,
      "min": 20,
      "max": 100
    },
    "traffic": {
      "incoming": {
        "total": 1024000,
        "avg": 1024
      },
      "outgoing": {
        "total": 2048000,
        "avg": 2048
      }
    }
  }
}
```

### Get Top URLs

Get the most requested URLs for a domain.

**Endpoint:** `GET /domains/:domainId/top-urls`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (1h, 24h, 7d, 30d)
- `limit` (number): Number of URLs to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "url": "/",
        "requests": 1000,
        "percentage": 50,
        "avgResponseTime": 150,
        "errorRate": 0.05
      },
      {
        "url": "/api/data",
        "requests": 500,
        "percentage": 25,
        "avgResponseTime": 200,
        "errorRate": 0.1
      }
    ]
  }
}
```

### Get Status Code Distribution

Get the distribution of HTTP status codes for a domain.

**Endpoint:** `GET /domains/:domainId/status-codes`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "statusCodes": [
      {
        "code": 200,
        "count": 1000,
        "percentage": 80
      },
      {
        "code": 404,
        "count": 100,
        "percentage": 8
      },
      {
        "code": 500,
        "count": 50,
        "percentage": 4
      }
    ]
  }
}
```

### Get Geographic Distribution

Get the geographic distribution of requests for a domain.

**Endpoint:** `GET /domains/:domainId/geographic`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "countries": [
      {
        "country": "United States",
        "code": "US",
        "requests": 500,
        "percentage": 50
      },
      {
        "country": "Germany",
        "code": "DE",
        "requests": 200,
        "percentage": 20
      }
    ]
  }
}
```

### Create Performance Alert

Create a performance alert for a domain.

**Endpoint:** `POST /domains/:domainId/alerts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "High Response Time Alert",
  "metric": "responseTime",
  "operator": "greaterThan",
  "threshold": 500,
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
    "name": "High Response Time Alert",
    "metric": "responseTime",
    "operator": "greaterThan",
    "threshold": 500,
    "duration": 300,
    "notificationMethod": "email",
    "notificationTarget": "admin@example.com",
    "enabled": true,
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### List Performance Alerts

Get a list of performance alerts for a domain.

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
        "name": "High Response Time Alert",
        "metric": "responseTime",
        "operator": "greaterThan",
        "threshold": 500,
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

### Delete Performance Alert

Delete a performance alert.

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
    "threshold": "Threshold is required",
    "notificationMethod": "Notification method is required"
  }
}