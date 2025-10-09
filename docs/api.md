# API Documentation

This document describes the REST API endpoints for the admin backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/login

Login with email and password.

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
  "token": "jwt-token-here",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "user_typeid": 1
  }
}
```

### Users

#### GET /users

Get all users. Requires authentication.

**Response:**
```json
[
  {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "user_typeid": 1,
    "is_active": true
  }
]
```

#### GET /users/:id

Get a specific user by ID.

#### POST /users

Create a new user.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "user_typeid": 1
}
```

#### PUT /users/:id

Update a user.

#### DELETE /users/:id

Delete a user.

#### GET /users/user-types

Get all user types.

#### GET /users/modules

Get all admin modules.

#### GET /users/:id/modules

Get modules for a specific user.

#### PUT /users/:id/modules

Update modules for a user.

### Profile Management

#### GET /users/profile

Get current user profile.

#### PUT /users/profile

Update current user profile.

#### PUT /users/profile/password

Update current user password.

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

#### GET /users/preferences

Get current user preferences.

#### PUT /users/preferences

Update current user preferences.

**Request Body:**
```json
{
  "theme": "dark",
  "language": "en",
  "email_notifications": true
}
```

### Admin Modules

#### GET /api/admin-modules

Get all admin modules.

#### POST /api/admin-modules

Create a new admin module.

#### PUT /api/admin-modules/:id

Update an admin module.

#### DELETE /api/admin-modules/:id

Delete an admin module.

### User Types

#### GET /api/userTypes

Get all user types.

#### POST /api/userTypes

Create a new user type.

#### PUT /api/userTypes/:id

Update a user type.

#### DELETE /api/userTypes/:id

Delete a user type.

### Logging

#### GET /api/logging

Get system logs.

### Support

#### GET /api/support

Get support tickets.

#### POST /api/support

Create a new support ticket.

#### PUT /api/support/:id

Update a support ticket.

## Error Responses

All endpoints return errors in the following format:

```json
{
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error