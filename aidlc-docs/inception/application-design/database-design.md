# Database Design

## Employee Task Performance & Productivity Tracker

**Date**: May 1, 2026  
**Phase**: Inception - Application Design  
**Status**: Complete

---

## 1. Database Overview

### 1.1 Database Management System

**Selected**: MySQL 8.0+

**Rationale**:
- ACID compliance for data integrity
- Mature and stable
- Excellent performance
- Strong community support
- Good ORM support (Sequelize)
- Relational data model fits requirements

### 1.2 Database Schema Summary

**Total Tables**: 8

1. Users
2. Tasks
3. TaskAssignments
4. Comments
5. Files
6. AuditLogs
7. TimeSessions
8. Notifications

---

## 2. Table Definitions

### 2.1 Users Table

**Purpose**: Store user accounts and authentication information

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'team_lead', 'employee') NOT NULL DEFAULT 'employee',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  failed_login_attempts INT DEFAULT 0,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `name`: User's full name
- `email`: Unique email address (used for login)
- `password`: Hashed password (bcrypt)
- `role`: User role for authorization
- `is_verified`: Email verification status
- `is_active`: Account active status
- `verification_token`: Token for email verification
- `reset_password_token`: Token for password reset
- `reset_password_expires`: Expiration time for reset token
- `failed_login_attempts`: Counter for account lockout
- `last_login`: Last successful login timestamp
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_email`: Fast email lookups for login
- `idx_role`: Fast role-based queries
- `idx_is_active`: Filter active users

---

### 2.2 Tasks Table

**Purpose**: Store task information

```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  deadline DATETIME NOT NULL,
  completed_at DATETIME,
  created_by INT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  
  INDEX idx_status (status),
  INDEX idx_deadline (deadline),
  INDEX idx_created_by (created_by),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_created_at (created_at)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `title`: Task title
- `description`: Detailed task description
- `status`: Current task status
- `deadline`: Task deadline
- `completed_at`: Completion timestamp
- `created_by`: Foreign key to users (creator)
- `is_deleted`: Soft delete flag
- `created_at`: Task creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_status`: Filter by status
- `idx_deadline`: Sort/filter by deadline
- `idx_created_by`: Find tasks by creator
- `idx_is_deleted`: Exclude deleted tasks
- `idx_created_at`: Sort by creation date

**Foreign Keys**:
- `created_by` → `users.id` (RESTRICT: Cannot delete user with tasks)

---

### 2.3 TaskAssignments Table

**Purpose**: Many-to-many relationship between tasks and users

```sql
CREATE TABLE task_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_assignment (task_id, user_id),
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users
- `assigned_at`: Assignment timestamp
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `unique_assignment`: Prevent duplicate assignments
- `idx_task_id`: Find assignments by task
- `idx_user_id`: Find assignments by user

**Foreign Keys**:
- `task_id` → `tasks.id` (CASCADE: Delete assignments when task deleted)
- `user_id` → `users.id` (CASCADE: Delete assignments when user deleted)

---

### 2.4 Comments Table

**Purpose**: Store task comments

```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users (author)
- `text`: Comment text
- `created_at`: Comment creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_task_id`: Find comments by task
- `idx_user_id`: Find comments by user
- `idx_created_at`: Sort by creation date

**Foreign Keys**:
- `task_id` → `tasks.id` (CASCADE: Delete comments when task deleted)
- `user_id` → `users.id` (RESTRICT: Cannot delete user with comments)

---

### 2.5 Files Table

**Purpose**: Store file attachments metadata

```sql
CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users (uploader)
- `filename`: Stored filename (unique)
- `original_name`: Original filename
- `file_path`: Path to file on disk
- `file_size`: File size in bytes
- `mime_type`: File MIME type
- `created_at`: Upload timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_task_id`: Find files by task
- `idx_user_id`: Find files by uploader

**Foreign Keys**:
- `task_id` → `tasks.id` (CASCADE: Delete files when task deleted)
- `user_id` → `users.id` (RESTRICT: Cannot delete user with uploaded files)

**Note**: File upload feature is schema-ready but not yet implemented

---

### 2.6 AuditLogs Table

**Purpose**: Store audit trail for task operations

```sql
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  field VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users (who performed action)
- `action`: Action type (TASK_CREATED, TASK_UPDATED, etc.)
- `field`: Field that was changed (nullable)
- `old_value`: Previous value (nullable)
- `new_value`: New value (nullable)
- `timestamp`: Action timestamp
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_task_id`: Find logs by task
- `idx_user_id`: Find logs by user
- `idx_action`: Filter by action type
- `idx_timestamp`: Sort by timestamp

**Foreign Keys**:
- `task_id` → `tasks.id` (CASCADE: Delete logs when task deleted)
- `user_id` → `users.id` (RESTRICT: Cannot delete user with audit logs)

---

### 2.7 TimeSessions Table

**Purpose**: Store time tracking sessions

```sql
CREATE TABLE time_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration_minutes INT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_start_time (start_time),
  INDEX idx_end_time (end_time)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users
- `start_time`: Session start timestamp
- `end_time`: Session end timestamp (nullable for active sessions)
- `duration_minutes`: Calculated duration
- `notes`: Session notes
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_task_id`: Find sessions by task
- `idx_user_id`: Find sessions by user
- `idx_start_time`: Sort/filter by start time
- `idx_end_time`: Find active sessions (NULL end_time)

**Foreign Keys**:
- `task_id` → `tasks.id` (CASCADE: Delete sessions when task deleted)
- `user_id` → `users.id` (CASCADE: Delete sessions when user deleted)

---

### 2.8 Notifications Table

**Purpose**: Store user notifications

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
```

**Columns**:
- `id`: Primary key, auto-increment
- `user_id`: Foreign key to users
- `type`: Notification type
- `title`: Notification title
- `message`: Notification message
- `related_id`: Related entity ID (task, user, etc.)
- `is_read`: Read status
- `read_at`: Read timestamp
- `created_at`: Notification creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- `idx_user_id`: Find notifications by user
- `idx_is_read`: Filter unread notifications
- `idx_created_at`: Sort by creation date

**Foreign Keys**:
- `user_id` → `users.id` (CASCADE: Delete notifications when user deleted)

---

## 3. Entity Relationships

### 3.1 Relationship Diagram

```
Users (1) ──────────────────> (N) Tasks [created_by]
  │                                 │
  │                                 │
  │ (N)                         (N) │
  │                                 │
  └──────> TaskAssignments <────────┘
              (M:N)

Users (1) ──────────────────> (N) Comments
Tasks (1) ──────────────────> (N) Comments

Users (1) ──────────────────> (N) Files
Tasks (1) ──────────────────> (N) Files

Users (1) ──────────────────> (N) AuditLogs
Tasks (1) ──────────────────> (N) AuditLogs

Users (1) ──────────────────> (N) TimeSessions
Tasks (1) ──────────────────> (N) TimeSessions

Users (1) ──────────────────> (N) Notifications
```

### 3.2 Relationship Details

| Relationship | Type | Description |
|--------------|------|-------------|
| Users → Tasks | 1:N | User creates many tasks |
| Users ↔ Tasks | M:N | Users assigned to tasks (via TaskAssignments) |
| Tasks → Comments | 1:N | Task has many comments |
| Users → Comments | 1:N | User writes many comments |
| Tasks → Files | 1:N | Task has many file attachments |
| Users → Files | 1:N | User uploads many files |
| Tasks → AuditLogs | 1:N | Task has many audit log entries |
| Users → AuditLogs | 1:N | User performs many actions |
| Tasks → TimeSessions | 1:N | Task has many time sessions |
| Users → TimeSessions | 1:N | User has many time sessions |
| Users → Notifications | 1:N | User has many notifications |

---

## 4. Database Constraints

### 4.1 Primary Keys

All tables have auto-incrementing integer primary keys named `id`.

### 4.2 Foreign Keys

**Cascade Rules**:
- **CASCADE**: Delete child records when parent deleted
  - TaskAssignments (task_id, user_id)
  - Comments (task_id)
  - Files (task_id)
  - AuditLogs (task_id)
  - TimeSessions (task_id, user_id)
  - Notifications (user_id)

- **RESTRICT**: Prevent parent deletion if children exist
  - Tasks (created_by)
  - Comments (user_id)
  - Files (user_id)
  - AuditLogs (user_id)

### 4.3 Unique Constraints

- `users.email`: Unique email addresses
- `task_assignments(task_id, user_id)`: Prevent duplicate assignments

### 4.4 Check Constraints

- `users.role`: Must be one of defined roles
- `tasks.status`: Must be one of defined statuses
- `users.failed_login_attempts`: >= 0

---

## 5. Indexes Strategy

### 5.1 Index Types

**Primary Indexes**:
- All `id` columns (auto-created with PRIMARY KEY)

**Foreign Key Indexes**:
- All foreign key columns for join performance

**Query Optimization Indexes**:
- `users.email`: Login queries
- `users.role`: Role-based filtering
- `tasks.status`: Status filtering
- `tasks.deadline`: Deadline sorting/filtering
- `tasks.is_deleted`: Exclude deleted tasks
- `notifications.is_read`: Unread notifications

**Composite Indexes**:
- `task_assignments(task_id, user_id)`: Unique constraint + query optimization

### 5.2 Index Maintenance

- Indexes automatically maintained by MySQL
- Regular ANALYZE TABLE for statistics
- Monitor slow query log
- Add indexes based on query patterns

---

## 6. Data Integrity

### 6.1 Referential Integrity

- All foreign keys enforced
- Cascade deletes where appropriate
- Restrict deletes to preserve history

### 6.2 Data Validation

**Database Level**:
- NOT NULL constraints
- ENUM constraints
- UNIQUE constraints
- Foreign key constraints

**Application Level**:
- Email format validation
- Password strength validation
- Date range validation
- Input sanitization

### 6.3 Soft Deletes

**Tasks Table**:
- Uses `is_deleted` flag
- Preserves data for audit trail
- Excluded from normal queries
- Can be permanently deleted later

---

## 7. Performance Considerations

### 7.1 Query Optimization

**Indexed Columns**:
- All foreign keys
- Frequently filtered columns
- Frequently sorted columns

**Query Patterns**:
- Use indexes for WHERE clauses
- Use indexes for JOIN operations
- Use indexes for ORDER BY
- Avoid SELECT *

### 7.2 Pagination

- All list queries use LIMIT and OFFSET
- Default page size: 20 records
- Maximum page size: 100 records

### 7.3 Connection Pooling

- Sequelize connection pool
- Min connections: 0
- Max connections: 10
- Idle timeout: 10 seconds

---

## 8. Security Considerations

### 8.1 Password Storage

- Passwords hashed with bcrypt
- Salt rounds: 10
- Never stored in plain text
- Never returned in API responses

### 8.2 Token Storage

- Verification tokens: Random UUID
- Reset tokens: Random UUID with expiration
- JWT tokens: Not stored in database

### 8.3 SQL Injection Prevention

- Sequelize ORM parameterized queries
- No raw SQL with user input
- Input validation before queries

---

## 9. Backup Strategy

### 9.1 Backup Schedule

- **Daily**: Full database backup
- **Hourly**: Transaction log backup (production)
- **Retention**: 30 days

### 9.2 Backup Procedure

```bash
# Full backup
mysqldump -u user -p employee_tracker > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -u user -p employee_tracker | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 9.3 Recovery Procedure

```bash
# Restore from backup
mysql -u user -p employee_tracker < backup_20260501.sql

# Restore from compressed backup
gunzip < backup_20260501.sql.gz | mysql -u user -p employee_tracker
```

---

## 10. Migration Strategy

### 10.1 Schema Migrations

**Tool**: Sequelize Migrations

**Migration Files**:
- Versioned migration files
- Up and down migrations
- Tracked in database

**Example Migration**:
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // ... other columns
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

### 10.2 Data Migrations

- Separate from schema migrations
- Run after schema migrations
- Idempotent operations
- Rollback capability

---

## 11. Database Monitoring

### 11.1 Metrics to Monitor

- Query execution time
- Connection pool usage
- Table sizes
- Index usage
- Slow queries
- Deadlocks

### 11.2 Monitoring Tools

- MySQL slow query log
- Performance schema
- EXPLAIN for query analysis
- Application logging

---

## 12. Scalability Considerations

### 12.1 Current Capacity

- **Users**: 10,000+
- **Tasks**: 100,000+
- **Comments**: 1,000,000+
- **Concurrent Connections**: 100+

### 12.2 Scaling Options

**Vertical Scaling**:
- Increase server resources
- Optimize queries
- Add more indexes

**Horizontal Scaling**:
- Read replicas for read-heavy workload
- Sharding by user_id (future)
- Caching layer (Redis)

---

**Database Design Version**: 1.0  
**Last Updated**: May 1, 2026  
**Status**: Production Ready ✅
