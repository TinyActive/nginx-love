# Authentication API

The authentication API provides endpoints for user authentication and authorization.

## Base URL

```
https://your-domain.com/api/auth
```

## Endpoints

### Login

Authenticate a user and receive a JWT token.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin"
    }
  }
}
```

### Logout

Invalidate the current session.

**Endpoint:** `POST /logout`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Token

Refresh an existing JWT token.

**Endpoint:** `POST /refresh`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Register

Create a new user account.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

### Get Current User

Get information about the currently authenticated user.

**Endpoint:** `GET /me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid credentials"
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