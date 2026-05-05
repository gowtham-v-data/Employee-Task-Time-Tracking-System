# DevTrack — Employee Task & Time Tracking System

> Smart task management with VS Code integration and automatic coding time analytics

## What This Project Is

A full-stack **Employee Task Management System** that lets managers assign tasks to employees, track progress, and measure how much time employees spend coding on each task — all integrated directly into VS Code.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER / USER                           │
│              http://localhost:5173                          │
│           (React Frontend - Vite)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (axios)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API SERVER                         │
│              http://localhost:5000                          │
│           (Node.js + Express.js)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL (Sequelize ORM)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  MySQL DATABASE                             │
│              localhost:3308                                 │
│           Database: employee_tracker                        │
└─────────────────────────────────────────────────────────────┘
                       ▲
                       │ HTTP (axios)
┌──────────────────────┴──────────────────────────────────────┐
│              VS CODE EXTENSION                              │
│         (TypeScript - Extension Host)                       │
│   Shows tasks in sidebar + auto time tracking               │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Folder Structure

```
project-root/
├── backend/                    ← Node.js API server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     ← MySQL connection (Sequelize)
│   │   ├── controllers/        ← Business logic
│   │   │   ├── authController.js
│   │   │   ├── taskController.js
│   │   │   ├── userController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── timeTrackingController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/         ← Request processing
│   │   │   ├── auth.js         ← JWT authentication
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validator.js
│   │   ├── models/             ← Database tables (Sequelize)
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   ├── TaskAssignment.js
│   │   │   ├── TimeSession.js
│   │   │   ├── Comment.js
│   │   │   ├── File.js
│   │   │   ├── AuditLog.js
│   │   │   ├── Notification.js
│   │   │   └── index.js        ← All associations defined here
│   │   ├── routes/             ← API endpoint definitions
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── users.js
│   │   │   ├── dashboard.js
│   │   │   ├── timeTracking.js
│   │   │   └── notifications.js
│   │   ├── utils/
│   │   │   ├── email.js        ← Nodemailer (Gmail SMTP)
│   │   │   └── jwt.js          ← Token generation
│   │   ├── scripts/
│   │   │   └── seed.js         ← Sample data seeder
│   │   └── server.js           ← App entry point
│   ├── .env                    ← Environment variables
│   └── package.json
│
├── frontend/                   ← React web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.jsx  ← Top nav bar
│   │   │   └── PrivateRoute.jsx← Auth guard
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx ← Login state (localStorage)
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx   ← Role-specific dashboards
│   │   │   ├── Tasks.jsx       ← Task list + create modal
│   │   │   ├── TaskDetail.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── App.jsx             ← Routes
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── vscode-extension/           ← VS Code extension
    ├── src/
    │   └── extension.ts        ← All extension logic
    ├── out/
    │   └── extension.js        ← Compiled output
    ├── .vscode/
    │   ├── launch.json         ← F5 debug config
    │   └── tasks.json
    ├── resources/
    │   └── task-icon.svg
    ├── package.json
    └── tsconfig.json
```

---

## User Roles

| Role | Can Do |
|------|--------|
| **Admin** | See all users, all tasks, all dashboards, manage system |
| **Manager** | Create tasks, assign to anyone, see all team data |
| **Team Lead** | Create tasks, assign to their team, see team dashboard |
| **Employee** | See only their assigned tasks, update task status |

---

## How to Start the Application

### Step 1: Start the Backend
```bash
cd backend
npm start
```
Expected output:
```
✅ Database synchronized
🚀 Server running on port 5000
```

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```
Expected output:
```
Local: http://localhost:5173/
```

### Step 3: Open the App
Go to: **http://localhost:5173**

---

## Login Credentials (Test Accounts)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Manager | manager@example.com | Manager@123 |
| Team Lead | teamlead@example.com | TeamLead@123 |
| Employee | employee1@example.com | Employee@123 |

> Password rules: min 8 chars, must have uppercase + lowercase + number

---

## Feature Walkthrough (Start to End)

### 1. Registration & Login

**Register a new account:**
- Go to http://localhost:5173/register
- Fill in name, email, password (e.g. `MyPass123`)
- A verification email is sent via Gmail SMTP
- Click the link in the email to verify
- Login at http://localhost:5173/login

**How it works technically:**
- Frontend sends `POST /api/auth/register`
- Backend creates user with `email_verified: false`
- Backend sends email with token via Nodemailer
- User clicks link → `GET /api/auth/verify-email/:token`
- Backend sets `email_verified: true`
- User can now login → receives JWT token
- Token stored in `localStorage`

---

### 2. Dashboard

After login, each role sees a different dashboard:

**Admin Dashboard:**
- Total users, active users, total tasks, completed tasks
- User distribution by role (Admin/Manager/Team Lead/Employee)
- Top active users table
- Team coding time (from VS Code extension)

**Manager / Team Lead Dashboard:**
- Task summary (total, completed, pending, late)
- Top performers chart
- Workload distribution chart
- Late tasks table (overdue)
- Tasks nearing deadline (next 3 days)
- Employee performance table
- Team coding time (hours per employee)
- My own coding time

**Employee Dashboard:**
- Personal task stats (total, completed, in progress, performance %)
- Task status distribution (doughnut chart)
- Completion trend (last 30 days line chart)
- Upcoming deadlines
- Recent activity
- My VS Code coding time (hours per task)

---

### 3. Creating and Assigning Tasks

**As Team Lead or Manager:**
1. Click "Tasks" in the navigation
2. Click "+ Create Task" button (top right)
3. Fill in:
   - **Title**: e.g. "Complete the Navbar Section"
   - **Description**: detailed instructions
   - **Deadline**: pick a date
   - **Assign to**: select one or more employees
4. Click "Create Task"

**What happens technically:**
- Frontend sends `POST /api/tasks` with `{ title, description, deadline, assignedTo: [userId] }`
- Backend creates a `tasks` record
- Backend creates `task_assignments` records (one per assigned user)
- Backend sends email notification to assigned employees
- Task appears in employee's task list

---

### 4. Employee Views Task in Web App

1. Employee logs in at http://localhost:5173
2. Clicks "Tasks" in navigation
3. Sees only tasks assigned to them (role-based filtering)
4. Can click a task to see full details
5. Can update status: Pending → In Progress → Completed

---

### 5. VS Code Extension — See Tasks in Editor

**Setup (one time):**
```bash
cd vscode-extension
npm install
npm run compile
```

**Launch:**
1. Open the `vscode-extension` folder in VS Code
2. Press **F5** → a new VS Code window opens (Extension Development Host)
3. A popup appears: "Please login to Employee Tracker" → click **Login**
4. Enter: `employee1@example.com` / `Employee@123`
5. Click the **checklist icon** in the left sidebar (Activity Bar)
6. See all assigned tasks!

**What the extension shows:**
```
MY TASKS
├── ○ Complete the Navbar Section    Due: May 7, 2026
├── ⟳ Fix Login Bug                  Due: May 10, 2026
└── ✓ Setup Database                 Due: May 1, 2026
```

Icons: ○ = Pending, ⟳ = In Progress, ✓ = Completed

---

### 6. Auto Time Tracking (The Key Feature)

**How it works:**

When an employee starts typing code in VS Code:

```
Employee opens VS Code
        ↓
Right-click task → "▶ Start Timer"
        ↓
Timer starts + task auto-changes: Pending → In Progress
        ↓
Status bar shows: ⏱ Complete the Navbar: 0m 30s
        ↓
Employee types code → timer counts active seconds
        ↓
Employee stops typing for 5 minutes → timer PAUSES ⏸
        ↓
Employee types again → timer RESUMES ▶
        ↓
Every 30 seconds → heartbeat sent to backend (saves progress)
        ↓
Session ends → total active time saved to database
```

**Status bar display:**
```
⏱ Complete the Navbar: 2h 15m    ← bottom of VS Code
```

**Idle detection:**
- If no typing for 5 minutes → timer pauses automatically
- When typing resumes → timer continues from where it left off
- This ensures only ACTIVE coding time is counted

---

### 7. Time Data Shows on Dashboards

After the employee works, managers can see:

**Team Lead / Manager Dashboard:**
```
⏱ Team Coding Time
┌──────────────────────────────────────────────────────┐
│ Employee      │ Role     │ Active Hours │ Sessions    │
├──────────────────────────────────────────────────────┤
│ John Smith    │ employee │ 3.25h        │ 5           │
│ Jane Doe      │ employee │ 1.50h        │ 2           │
└──────────────────────────────────────────────────────┘
```

**Employee Dashboard:**
```
⏱ My VS Code Coding Time
┌──────────────────────────────────────────────────────┐
│ Task                    │ Status  │ Active Hours      │
├──────────────────────────────────────────────────────┤
│ Complete the Navbar     │ pending │ 2.03h             │
│ Fix Login Bug           │ in_prog │ 0.75h             │
└──────────────────────────────────────────────────────┘
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | All users (admin, manager, team_lead, employee) |
| `tasks` | Task records (title, description, deadline, status) |
| `task_assignments` | Which user is assigned to which task |
| `time_sessions` | VS Code coding sessions (start, end, active_time) |
| `comments` | Comments on tasks |
| `files` | File attachments on tasks |
| `audit_logs` | History of all changes |
| `notifications` | In-app notifications |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new employee |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/login` | Login, get JWT token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (role-filtered) |
| GET | `/api/tasks/:id` | Get task details |
| POST | `/api/tasks` | Create task (manager/team_lead) |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Soft delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Time Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/time-tracking/sessions/start` | Start coding session |
| POST | `/api/time-tracking/sessions/heartbeat` | Update active time |
| POST | `/api/time-tracking/sessions/stop` | End session |
| GET | `/api/time-tracking/sessions/active` | Get current session |
| GET | `/api/time-tracking/my-summary` | My time summary |
| GET | `/api/time-tracking/team-summary` | Team time summary |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/admin` | Admin dashboard data |
| GET | `/api/dashboard/manager` | Manager/team_lead data |
| GET | `/api/dashboard/employee` | Employee data |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get user |
| PUT | `/api/users/:id` | Update user |

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.18 | Web framework |
| Sequelize | 6.35 | ORM (MySQL) |
| MySQL2 | 3.6 | Database driver |
| JWT (jsonwebtoken) | 9.0 | Authentication tokens |
| bcrypt | 5.1 | Password hashing |
| Nodemailer | 6.9 | Email sending |
| Helmet | 7.1 | Security headers |
| express-rate-limit | 7.1 | Rate limiting |
| express-validator | 7.0 | Input validation |
| Winston | 3.11 | Logging |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 5.0 | Build tool |
| React Router | 6.20 | Client-side routing |
| Axios | 1.6 | HTTP requests |
| Chart.js | 4.4 | Charts and graphs |
| react-chartjs-2 | 5.2 | React Chart.js wrapper |
| date-fns | 3.0 | Date formatting |
| react-hook-form | 7.49 | Form handling |

### VS Code Extension
| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 4.4 | Language |
| VS Code API | 1.60+ | Extension framework |
| Axios | 1.6 | HTTP requests to backend |

### Database
| Technology | Purpose |
|------------|---------|
| MySQL | Primary database |
| Port 3308 | Non-standard port |
| Database name | `employee_tracker` |

---

## Security Features

1. **JWT Authentication** — All API calls require a valid token
2. **Password Hashing** — bcrypt with salt rounds
3. **Email Verification** — New accounts must verify email
4. **Account Lockout** — 5 failed logins → 15 min lockout
5. **Rate Limiting** — Prevents brute force attacks
6. **Helmet.js** — Security HTTP headers
7. **CORS** — Only allows requests from frontend URL
8. **Input Validation** — All inputs validated server-side
9. **Role-Based Access** — Each role can only access their data
10. **Soft Delete** — Tasks are never permanently deleted

---

## Environment Configuration

The backend uses `.env` file:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3308
DB_NAME=employee_tracker
DB_USER=root
DB_PASSWORD=root

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=8h

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## Complete User Journey Example

### Scenario: Team Lead assigns "Complete Navbar" to Employee

**Step 1 — Team Lead creates task (Web App)**
1. Login: teamlead@example.com / TeamLead@123
2. Go to Tasks → "+ Create Task"
3. Title: "Complete the Navbar Section"
4. Assign to: employee1@example.com
5. Deadline: May 7, 2026
6. Click "Create Task" ✅

**Step 2 — Employee receives email notification**
- Email: "You have been assigned a new task: Complete the Navbar Section"

**Step 3 — Employee opens VS Code**
1. Opens VS Code with extension loaded (F5)
2. Logs in: employee1@example.com / Employee@123
3. Sees task in sidebar: "○ Complete the Navbar Section"

**Step 4 — Employee starts working**
1. Right-clicks task → "▶ Start Timer"
2. Notification: "⏱ Timer started! Complete the Navbar → In Progress"
3. Task status automatically changes to "In Progress"
4. Status bar shows: `⏱ Complete the Navbar: 0m 5s`

**Step 5 — Employee codes**
- Types code → timer counts active seconds
- Stops for 5 min → timer pauses ⏸
- Types again → timer resumes ▶
- Status bar updates every 30 seconds

**Step 6 — Team Lead checks progress (Web App)**
1. Login: teamlead@example.com
2. Dashboard shows:
   - Task "Complete the Navbar" → Status: In Progress
   - Team Coding Time: employee1 → 1.5h active

**Step 7 — Employee completes task**
1. Right-clicks task in VS Code → "Mark as Completed"
2. Timer stops, total time saved
3. Task status → Completed

**Step 8 — Team Lead sees completion**
1. Dashboard shows task as Completed
2. Employee coding time: 2.5h total

---

## Common Issues & Solutions

| Issue | Solution |
|-------|---------|
| Backend won't start | Check MySQL is running on port 3308 |
| 500 error on tasks | Restart backend after code changes |
| Tasks not loading | Check you're logged in with correct role |
| Extension not showing tasks | Make sure backend is running on port 5000 |
| Email not sending | Check SMTP credentials in .env |
| Registration 400 error | Password needs uppercase + lowercase + number |
| Dashboard shows no data | Check role — employees see limited data |

---

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Terminal 3: Setup VS Code Extension (one time)
cd vscode-extension
npm install
npm run compile

# Then open vscode-extension folder in VS Code and press F5
```

**App URL:** http://localhost:5173

---

## Summary

This project is a complete employee task management system with:

1. **Web Application** — For creating tasks, viewing dashboards, managing users
2. **REST API** — Secure backend with role-based access control
3. **MySQL Database** — Stores all data with proper relationships
4. **VS Code Extension** — Employees see tasks without leaving their editor
5. **Auto Time Tracking** — Automatically tracks coding time per task
6. **Email Notifications** — Sends emails for task assignments and verification
7. **Role-Based Dashboards** — Different views for Admin, Manager, Team Lead, Employee

The system solves the problem of context switching — employees can see their tasks and track time directly in VS Code, while managers get real visibility into how much time is being spent on each task.
