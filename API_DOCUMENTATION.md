# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register (Employee Self-Registration)
```http
POST /api/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Verify Email
```http
GET /api/auth/verify-email/:token
```

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee"
    }
  }
}
```

### Request Password Reset
```http
POST /api/auth/request-password-reset
```

**Body:**
```json
{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password/:token
```

**Body:**
```json
{
  "password": "NewPassword@123"
}
```

### Get Current User
```http
GET /api/auth/me
```
**Requires:** Authentication

---

## Task Endpoints

### Get All Tasks
```http
GET /api/tasks
```
**Requires:** Authentication

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed)
- `assignedTo` - Filter by assigned user ID
- `createdBy` - Filter by creator user ID
- `keyword` - Search in title and description
- `dateFrom` - Filter by deadline start date
- `dateTo` - Filter by deadline end date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: deadline)
- `sortOrder` - Sort order (ASC/DESC, default: ASC)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Implement user authentication",
        "description": "Create JWT-based authentication...",
        "deadline": "2026-05-08T00:00:00.000Z",
        "status": "in_progress",
        "created_by": 2,
        "completed_at": null,
        "creator": {
          "id": 2,
          "name": "Michael Rodriguez",
          "email": "manager@example.com",
          "role": "manager"
        },
        "assignedUsers": [
          {
            "id": 4,
            "name": "David Thompson",
            "email": "employee1@example.com",
            "role": "employee"
          }
        ]
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### Get Task by ID
```http
GET /api/tasks/:id
```
**Requires:** Authentication

**Response:** Includes task details, comments, files, and audit logs

### Create Task
```http
POST /api/tasks
```
**Requires:** Authentication (Manager, Team Lead, Admin)

**Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "deadline": "2026-05-15T23:59:59.000Z",
  "assignedTo": [4, 5]
}
```

### Update Task
```http
PUT /api/tasks/:id
```
**Requires:** Authentication

**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "deadline": "2026-05-20T23:59:59.000Z",
  "status": "in_progress",
  "assignedTo": [4]
}
```

**Note:** Employees can only update `status` field

### Delete Task
```http
DELETE /api/tasks/:id
```
**Requires:** Authentication (Manager, Admin only)

### Add Comment
```http
POST /api/tasks/:id/comments
```
**Requires:** Authentication

**Body:**
```json
{
  "text": "This is a comment"
}
```

---

## User Endpoints

### Get All Users
```http
GET /api/users
```
**Requires:** Authentication (Manager, Admin)

**Query Parameters:**
- `role` - Filter by role
- `search` - Search by name or email
- `page` - Page number
- `limit` - Items per page

### Get User by ID
```http
GET /api/users/:id
```
**Requires:** Authentication

**Response:** Includes user details and statistics

### Create User
```http
POST /api/users
```
**Requires:** Authentication (Manager, Admin)

**Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "Password@123",
  "role": "employee"
}
```

**Note:** 
- Managers can create: employee, team_lead
- Admins can create: manager, team_lead, employee

### Update User
```http
PUT /api/users/:id
```
**Requires:** Authentication

**Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "team_lead",
  "is_active": true
}
```

### Delete User (Deactivate)
```http
DELETE /api/users/:id
```
**Requires:** Authentication (Admin only)

---

## Dashboard Endpoints

### Employee Dashboard
```http
GET /api/dashboard/employee
```
**Requires:** Authentication (Employee, Team Lead)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalTasks": 10,
      "completedTasks": 7,
      "pendingTasks": 2,
      "inProgressTasks": 1,
      "onTimeTasks": 6,
      "lateTasks": 1,
      "performanceScore": 60
    },
    "upcomingDeadlines": [...],
    "completionTrend": [...],
    "timeTracking": {
      "hoursThisWeek": 32.5,
      "hoursThisMonth": 140.2
    },
    "recentActivity": [...]
  }
}
```

### Manager Dashboard
```http
GET /api/dashboard/manager
```
**Requires:** Authentication (Manager, Admin)

**Response:** Includes team analytics, employee performance, task trends

### Admin Dashboard
```http
GET /api/dashboard/admin
```
**Requires:** Authentication (Admin)

**Response:** Includes system-wide metrics, user statistics, system health

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Task not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Registration**: 5 requests per hour

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee1@example.com","password":"Employee@123"}'
```

### Get Tasks (with token)
```bash
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "deadline": "2026-05-15T23:59:59.000Z",
    "assignedTo": [4]
  }'
```

---

## Postman Collection

Import this collection to test all endpoints:

1. Create a new collection in Postman
2. Add environment variables:
   - `baseUrl`: http://localhost:5000/api
   - `token`: (will be set after login)
3. Add requests for each endpoint above
4. Use `{{baseUrl}}` and `{{token}}` in requests

---

## WebSocket (Future)

Real-time notifications will be available via WebSocket:
```
ws://localhost:5000
```

---

For more details, see the source code in `backend/src/routes/` and `backend/src/controllers/`.
