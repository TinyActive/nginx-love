# ModSecurity API

The ModSecurity API provides endpoints for managing ModSecurity rules and configurations.

## Base URL

```
https://your-domain.com/api/modsecurity
```

## Endpoints

### List Rule Sets

Get a list of all ModSecurity rule sets.

**Endpoint:** `GET /rule-sets`

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
    "ruleSets": [
      {
        "id": 1,
        "name": "OWASP CRS",
        "version": "3.3.0",
        "paranoiaLevel": 1,
        "enabled": true,
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

### Get Domain ModSecurity Settings

Get ModSecurity settings for a specific domain.

**Endpoint:** `GET /domains/:domainId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "domainId": 1,
    "enabled": true,
    "ruleSetId": 1,
    "paranoiaLevel": 1,
    "customRules": [
      {
        "id": 1,
        "ruleId": 100001,
        "message": "Custom rule example",
        "action": "deny",
        "expression": "@rx attack",
        "enabled": true
      }
    ],
    "exclusions": [
      {
        "id": 1,
        "ruleId": 941100,
        "uri": "/api/sensitive-endpoint",
        "method": "POST",
        "ipAddress": null
      }
    ]
  }
}
```

### Update Domain ModSecurity Settings

Update ModSecurity settings for a domain.

**Endpoint:** `PUT /domains/:domainId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "enabled": true,
  "ruleSetId": 1,
  "paranoiaLevel": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "domainId": 1,
    "enabled": true,
    "ruleSetId": 1,
    "paranoiaLevel": 1
  }
}
```

### Add Custom Rule

Add a custom ModSecurity rule to a domain.

**Endpoint:** `POST /domains/:domainId/rules`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "ruleId": 100001,
  "message": "Custom rule example",
  "action": "deny",
  "expression": "@rx attack",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ruleId": 100001,
    "message": "Custom rule example",
    "action": "deny",
    "expression": "@rx attack",
    "enabled": true
  }
}
```

### Update Custom Rule

Update a custom ModSecurity rule.

**Endpoint:** `PUT /domains/:domainId/rules/:ruleId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "Updated rule message",
  "action": "deny",
  "expression": "@rx updated-attack",
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ruleId": 100001,
    "message": "Updated rule message",
    "action": "deny",
    "expression": "@rx updated-attack",
    "enabled": false
  }
}
```

### Delete Custom Rule

Delete a custom ModSecurity rule.

**Endpoint:** `DELETE /domains/:domainId/rules/:ruleId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

### Add Rule Exclusion

Add a rule exclusion for a domain.

**Endpoint:** `POST /domains/:domainId/exclusions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "ruleId": 941100,
  "uri": "/api/sensitive-endpoint",
  "method": "POST",
  "ipAddress": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ruleId": 941100,
    "uri": "/api/sensitive-endpoint",
    "method": "POST",
    "ipAddress": null
  }
}
```

### Delete Rule Exclusion

Delete a rule exclusion.

**Endpoint:** `DELETE /domains/:domainId/exclusions/:exclusionId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Exclusion deleted successfully"
}
```

### Get ModSecurity Logs

Get ModSecurity logs for a domain.

**Endpoint:** `GET /domains/:domainId/logs`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `ruleId` (number): Filter by rule ID
- `action` (string): Filter by action (deny, allow, log)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "timestamp": "2023-01-01T12:00:00Z",
        "ruleId": 941100,
        "message": "XSS Attack Detected",
        "action": "deny",
        "ipAddress": "192.168.1.1",
        "uri": "/api/test",
        "method": "POST",
        "data": "request data"
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
    "ruleId": "Rule ID is required",
    "expression": "Rule expression is required"
  }
}