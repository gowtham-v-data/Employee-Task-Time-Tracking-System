# Component Design

## Employee Task Performance & Productivity Tracker

**Date**: May 1, 2026  
**Phase**: Inception - Application Design  
**Status**: Complete

---

## 1. Backend Components

### 1.1 Controllers

#### AuthController
**Purpose**: Handle authentication and authorization operations

**Methods**:
```javascript
register(req, res, next)
  - Input: { name, email, password }
  - Output: { success, message, data: { user } }
  - Business Logic: Create user, send verification email
  
login(req, res, next)
  - Input: { email, password }
  - Output: { success, data: { token, user } }
  - Business Logic: Validate credentials, generate JWT
  
verifyEmail(req, res, next)
  - Input: { token }
  - Output: { success, message }
  - Business Logic: Verify email token, activate account
  
forgotPassword(req, res, next)
  - Input: { email }
  - Output: { success, message }
  - Business Logic: Generate reset token, send email
  
resetPassword(req, res, next)
  - Input: { token, newPassword }
  - Output: { success, message }
  - Business Logic: Validate token, update password
```

**Dependencies**:
- User model
- JWT utility
- Email utility
- Bcrypt

---

#### TaskController
**Purpose**: Manage task CRUD operations

**Methods**:
```javascript
getTasks(req, res, next)
  - Input: Query params (status, keyword, dateFrom, dateTo, page, limit)
  - Output: { success, data: { tasks, pagination } }
  - Business Logic: Filter, paginate, role-based access
  
getTaskById(req, res, next)
  - Input: { id }
  - Output: { success, data: task }
  - Business Logic: Fetch task with associations, check permissions
  
createTask(req, res, next)
  - Input: { title, description, deadline, assignedTo[] }
  - Output: { success, data: task }
  - Business Logic: Create task, assignments, audit log, send emails
  
updateTask(req, res, next)
  - Input: { id, updates }
  - Output: { success, data: task }
  - Business Logic: Update task, track changes, audit log
  
deleteTask(req, res, next)
  - Input: { id }
  - Output: { success, message }
  - Business Logic: Soft delete, audit log
  
addComment(req, res, next)
  - Input: { id, text }
  - Output: { success, data: comment }
  - Business Logic: Create comment, audit log
```

**Dependencies**:
- Task, TaskAssignment, Comment, AuditLog models
- Email utility
- Authorization middleware

---

#### UserController
**Purpose**: Manage user operations

**Methods**:
```javascript
getUsers(req, res, next)
  - Input: Query params (search, role, page, limit)
  - Output: { success, data: { users, pagination } }
  - Business Logic: Search, filter, calculate statistics
  
getUserById(req, res, next)
  - Input: { id }
  - Output: { success, data: user }
  - Business Logic: Fetch user with statistics
  
createUser(req, res, next)
  - Input: { name, email, password, role }
  - Output: { success, data: user }
  - Business Logic: Create user, hash password
  
updateUser(req, res, next)
  - Input: { id, updates }
  - Output: { success, data: user }
  - Business Logic: Update user, validate permissions
  
deleteUser(req, res, next)
  - Input: { id }
  - Output: { success, message }
  - Business Logic: Soft delete or deactivate
```

**Dependencies**:
- User, Task, TaskAssignment models
- Bcrypt
- Authorization middleware

---

#### DashboardController
**Purpose**: Provide analytics and dashboard data

**Methods**:
```javascript
getEmployeeDashboard(req, res, next)
  - Input: User from token
  - Output: { success, data: { statistics, trends, recent_tasks } }
  - Business Logic: Calculate personal stats, performance trends
  
getManagerDashboard(req, res, next)
  - Input: User from token
  - Output: { success, data: { statistics, team_performance } }
  - Business Logic: Calculate team stats, member performance
  
getAdminDashboard(req, res, next)
  - Input: User from token
  - Output: { success, data: { statistics, system_metrics } }
  - Business Logic: Calculate system-wide statistics
```

**Dependencies**:
- User, Task, TaskAssignment models
- Sequelize aggregation functions

---

#### TimeTrackingController
**Purpose**: Manage time tracking sessions

**Methods**:
```javascript
createTimeSession(req, res, next)
  - Input: { task_id, start_time, notes }
  - Output: { success, data: session }
  - Business Logic: Create session, prevent multiple active
  
updateTimeSession(req, res, next)
  - Input: { id, end_time, notes }
  - Output: { success, data: session }
  - Business Logic: End session, calculate duration
  
getTimeSessions(req, res, next)
  - Input: Query params (task_id, user_id, dateFrom, dateTo)
  - Output: { success, data: { sessions, pagination } }
  - Business Logic: Filter sessions, role-based access
  
getTimeTrackingSummary(req, res, next)
  - Input: Query params (user_id, dateFrom, dateTo)
  - Output: { success, data: { summary, by_task, by_date } }
  - Business Logic: Aggregate time data
  
getActiveSession(req, res, next)
  - Input: User from token
  - Output: { success, data: session }
  - Business Logic: Find active session, calculate current duration
```

**Dependencies**:
- TimeSession, Task models
- Date utilities

---

#### NotificationController
**Purpose**: Manage user notifications

**Methods**:
```javascript
getNotifications(req, res, next)
  - Input: Query params (is_read, page, limit)
  - Output: { success, data: { notifications, unread_count, pagination } }
  - Business Logic: Fetch user notifications, count unread
  
markAsRead(req, res, next)
  - Input: { id }
  - Output: { success, data: notification }
  - Business Logic: Mark single notification as read
  
markAllAsRead(req, res, next)
  - Input: User from token
  - Output: { success, message }
  - Business Logic: Mark all user notifications as read
  
deleteNotification(req, res, next)
  - Input: { id }
  - Output: { success, message }
  - Business Logic: Delete notification
  
getUnreadCount(req, res, next)
  - Input: User from token
  - Output: { success, data: { unread_count } }
  - Business Logic: Count unread notifications
```

**Dependencies**:
- Notification model

---

### 1.2 Models

#### User Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  name: STRING (Required),
  email: STRING (Unique, Required),
  password: STRING (Hashed, Required),
  role: ENUM('admin', 'manager', 'team_lead', 'employee'),
  is_verified: BOOLEAN (Default: false),
  is_active: BOOLEAN (Default: true),
  verification_token: STRING (Nullable),
  reset_password_token: STRING (Nullable),
  reset_password_expires: DATE (Nullable),
  failed_login_attempts: INTEGER (Default: 0),
  last_login: DATE (Nullable),
  created_at: DATE,
  updated_at: DATE
}

Associations:
- hasMany: Tasks (as creator)
- belongsToMany: Tasks (through TaskAssignments)
- hasMany: Comments
- hasMany: AuditLogs
- hasMany: TimeSessions
- hasMany: Notifications
```

#### Task Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  title: STRING (Required),
  description: TEXT (Required),
  status: ENUM('pending', 'in_progress', 'completed'),
  deadline: DATE (Required),
  completed_at: DATE (Nullable),
  created_by: INTEGER (FK to Users),
  is_deleted: BOOLEAN (Default: false),
  created_at: DATE,
  updated_at: DATE
}

Associations:
- belongsTo: User (as creator)
- belongsToMany: Users (through TaskAssignments)
- hasMany: Comments
- hasMany: Files
- hasMany: AuditLogs
- hasMany: TimeSessions
```

#### TaskAssignment Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  task_id: INTEGER (FK to Tasks),
  user_id: INTEGER (FK to Users),
  assigned_at: DATE,
  created_at: DATE,
  updated_at: DATE
}

Associations:
- belongsTo: Task
- belongsTo: User
```

#### Comment Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  task_id: INTEGER (FK to Tasks),
  user_id: INTEGER (FK to Users),
  text: TEXT (Required),
  created_at: DATE,
  updated_at: DATE
}

Associations:
- belongsTo: Task
- belongsTo: User (as author)
```

#### AuditLog Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  task_id: INTEGER (FK to Tasks),
  user_id: INTEGER (FK to Users),
  action: STRING (Required),
  field: STRING (Nullable),
  old_value: TEXT (Nullable),
  new_value: TEXT (Nullable),
  timestamp: DATE,
  created_at: DATE,
  updated_at: DATE
}

Associations:
- belongsTo: Task
- belongsTo: User
```

#### TimeSession Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  task_id: INTEGER (FK to Tasks),
  user_id: INTEGER (FK to Users),
  start_time: DATE (Required),
  end_time: DATE (Nullable),
  duration_minutes: INTEGER (Nullable),
  notes: TEXT (Nullable),
  created_at: DATE,
  updated_at: DATE
}

Associations:
- belongsTo: Task
- belongsTo: User
```

#### Notification Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  user_id: INTEGER (FK to Users),
  type: STRING (Required),
  title: STRING (Required),
  message: TEXT (Required),
  related_id: INTEGER (Nullable),
  is_read: BOOLEAN (Default: false),
  read_at: DATE (Nullable),
  created_at: DATE,
  updated_at: DATE
}

Associations:
- belongsTo: User
```

---

### 1.3 Middleware Components

#### Authentication Middleware
```javascript
authenticate(req, res, next)
  - Verify JWT token from Authorization header
  - Extract user information
  - Attach user to request object
  - Handle token expiration
```

#### Authorization Middleware
```javascript
authorize(...roles)
  - Check if user has required role
  - Return 403 if unauthorized
  - Allow request to proceed if authorized
```

#### Validation Middleware
```javascript
validate(req, res, next)
  - Check validation results from express-validator
  - Return 400 with errors if validation fails
  - Allow request to proceed if valid
```

#### Error Handler Middleware
```javascript
errorHandler(err, req, res, next)
  - Log error details
  - Format error response
  - Return appropriate status code
  - Hide sensitive information in production
```

#### Rate Limiter Middleware
```javascript
rateLimiter
  - Track requests per IP
  - Limit to 100 requests per 15 minutes
  - Return 429 if limit exceeded
```

---

### 1.4 Utility Components

#### JWT Utility
```javascript
generateToken(payload, expiresIn)
  - Create JWT token with payload
  - Set expiration time
  - Sign with secret key
  
verifyToken(token)
  - Verify token signature
  - Check expiration
  - Return decoded payload
```

#### Email Utility
```javascript
sendVerificationEmail(email, name, token)
  - Generate verification link
  - Send HTML email
  - Handle errors
  
sendPasswordResetEmail(email, name, token)
  - Generate reset link
  - Send HTML email
  - Handle errors
  
sendTaskAssignmentEmail(email, name, taskTitle, deadline)
  - Format task details
  - Send notification email
  - Handle errors
```

---

## 2. Frontend Components

### 2.1 Page Components

#### Login Page
```jsx
<Login />
  - Email input
  - Password input
  - Remember me checkbox
  - Login button
  - Forgot password link
  - Register link
  - Error display
  - Loading state
```

#### Register Page
```jsx
<Register />
  - Name input
  - Email input
  - Password input
  - Confirm password input
  - Register button
  - Login link
  - Error display
  - Success message
```

#### Dashboard Page
```jsx
<Dashboard />
  - Role-specific content
  - Statistics cards
  - Charts (Doughnut, Line, Bar)
  - Recent tasks table
  - Loading state
  - Error handling
```

#### Tasks Page
```jsx
<Tasks />
  - Filter section
  - Create task button (role-based)
  - Task cards list
  - Pagination controls
  - Create task modal
  - Loading state
  - Empty state
```

#### Task Detail Page
```jsx
<TaskDetail />
  - Task information
  - Edit form (conditional)
  - Status update buttons
  - Comments section
  - Add comment form
  - Assigned users list
  - Creator info
  - Audit history
  - Delete button (role-based)
```

#### Users Page
```jsx
<Users />
  - Search input
  - Role filter
  - Create user button (role-based)
  - User cards grid
  - Create/Edit user modal
  - Loading state
  - Empty state
```

#### Profile Page
```jsx
<Profile />
  - Profile information
  - Edit profile form
  - Change password form
  - Performance statistics
  - Success/error messages
```

---

### 2.2 Reusable Components

#### StatCard Component
```jsx
<StatCard title={string} value={string|number} color={string} />
  - Display statistic
  - Color-coded border
  - Responsive design
```

#### TaskCard Component
```jsx
<TaskCard task={object} onClick={function} />
  - Task title
  - Status badge
  - Description preview
  - Deadline
  - Assigned users count
  - Creator name
  - Hover effects
```

#### UserCard Component
```jsx
<UserCard 
  user={object} 
  canManage={boolean}
  onEdit={function}
  onDeactivate={function}
  onActivate={function}
/>
  - User name
  - Role badge
  - Email
  - Statistics
  - Action buttons
```

#### Modal Component
```jsx
<Modal isOpen={boolean} onClose={function}>
  {children}
</Modal>
  - Overlay
  - Modal content
  - Close button
  - Click outside to close
```

#### LoadingSpinner Component
```jsx
<LoadingSpinner />
  - Animated spinner
  - Centered display
```

#### ErrorMessage Component
```jsx
<ErrorMessage message={string} />
  - Error icon
  - Error text
  - Styled container
```

---

### 2.3 Context Components

#### AuthContext
```jsx
<AuthProvider>
  State:
    - user: Current user object
    - loading: Authentication loading state
    - error: Authentication error
  
  Methods:
    - login(email, password)
    - logout()
    - register(userData)
    - setUser(user)
  
  Provides:
    - Authentication state
    - User information
    - Auth methods
</AuthProvider>
```

#### ThemeContext
```jsx
<ThemeProvider>
  State:
    - theme: 'light' | 'dark'
  
  Methods:
    - toggleTheme()
  
  Provides:
    - Current theme
    - Theme toggle function
</ThemeProvider>
```

---

### 2.4 Routing Components

#### PrivateRoute Component
```jsx
<PrivateRoute>
  {children}
</PrivateRoute>
  - Check authentication
  - Redirect to login if not authenticated
  - Render children if authenticated
```

#### App Component
```jsx
<App />
  - Router setup
  - Context providers
  - Route definitions
  - Public routes
  - Protected routes
  - 404 route
```

---

## 3. Component Interactions

### 3.1 Authentication Flow

```
Login Component
    ↓ (submit)
AuthContext.login()
    ↓ (API call)
Backend AuthController.login()
    ↓ (validate)
Database User Model
    ↓ (return token + user)
AuthContext (update state)
    ↓ (store token)
localStorage
    ↓ (redirect)
Dashboard Component
```

### 3.2 Task Creation Flow

```
Tasks Component
    ↓ (click create)
CreateTaskModal Component
    ↓ (submit form)
API Client (axios)
    ↓ (POST /api/tasks)
Backend TaskController.createTask()
    ↓ (validate & create)
Database Task Model
    ↓ (create assignments)
TaskAssignment Model
    ↓ (create audit log)
AuditLog Model
    ↓ (send emails)
Email Utility
    ↓ (return response)
CreateTaskModal (close)
    ↓ (refresh list)
Tasks Component (re-fetch)
```

### 3.3 Dashboard Data Flow

```
Dashboard Component
    ↓ (mount)
useEffect Hook
    ↓ (API call)
Backend DashboardController
    ↓ (calculate stats)
Database Models (aggregate)
    ↓ (return data)
Dashboard Component (update state)
    ↓ (render)
Chart Components
StatCard Components
Table Components
```

---

## 4. Component Dependencies

### 4.1 Backend Dependencies

```
Controllers
    ↓ depends on
Models + Middleware + Utilities
    ↓ depends on
Database + External Services
```

### 4.2 Frontend Dependencies

```
Pages
    ↓ depends on
Components + Contexts + API Client
    ↓ depends on
External Libraries (React, Axios, Chart.js)
```

---

## 5. Component Testing Strategy

### 5.1 Backend Component Tests

- **Controllers**: Unit tests with mocked models
- **Models**: Integration tests with test database
- **Middleware**: Unit tests with mocked req/res
- **Utilities**: Unit tests with various inputs

### 5.2 Frontend Component Tests

- **Pages**: Integration tests with React Testing Library
- **Components**: Unit tests with props variations
- **Contexts**: Unit tests with state changes
- **Hooks**: Unit tests with custom hook testing

---

**Component Design Version**: 1.0  
**Last Updated**: May 1, 2026  
**Status**: Complete ✅
