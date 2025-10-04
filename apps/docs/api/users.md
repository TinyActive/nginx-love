# Users API

The users API provides endpoints for managing user accounts and permissions.

## Base URL

```
https://your-domain.com/api/users
```

## Endpoints

### List Users

Get a list of all users.

**Endpoint:** `GET /`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term
- `role` (string): Filter by role (admin, user)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin",
        "active": true,
        "lastLoginAt": "2023-01-01T12:00:00Z",
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

### Get User

Get a specific user by ID.

**Endpoint:** `GET /:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "active": true,
    "lastLoginAt": "2023-01-01T12:00:00Z",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Create User

Create a new user.

**Endpoint:** `POST /`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "user",
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "active": true,
    "lastLoginAt": null,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Update User

Update an existing user.

**Endpoint:** `PUT /:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "admin",
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "admin",
    "active": true,
    "lastLoginAt": null,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Delete User

Delete a user.

**Endpoint:** `DELETE /:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Update User Password

Update a user's password.

**Endpoint:** `PUT /:id/password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Reset User Password

Reset a user's password (admin only).

**Endpoint:** `POST /:id/reset-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Get User Permissions

Get permissions for a user.

**Endpoint:** `GET /:id/permissions`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "resource": "domains",
        "actions": ["read", "create", "update", "delete"]
      },
      {
        "resource": "ssl",
        "actions": ["read", "create", "update", "delete"]
      },
      {
        "resource": "modsecurity",
        "actions": ["read", "update"]
      }
    ]
  }
}
```

### Update User Permissions

Update permissions for a user.

**Endpoint:** `PUT /:id/permissions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "permissions": [
    {
      "resource": "domains",
      "actions": ["read", "create", "update", "delete"]
    },
    {
      "resource": "ssl",
      "actions": ["read", "create", "update", "delete"]
    },
    {
      "resource": "modsecurity",
      "actions": ["read", "update"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions updated successfully"
}
```

### Get User Activity

Get activity log for a user.

**Endpoint:** `GET /:id/activity`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "action": "login",
        "resource": "auth",
        "details": "User logged in",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2023-01-01T12:00:00Z"
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
  "error": "User not found"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}