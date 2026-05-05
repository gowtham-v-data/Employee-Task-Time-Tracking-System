# DevTrack — Employee Task & Time Tracking System

> Smart task management with VS Code integration and automatic coding time analytics

A comprehensive web-based system for managing tasks, tracking employee performance, and measuring productivity — with a built-in VS Code extension that automatically tracks how long employees spend coding on each task.

## 🎯 Features

### Core Features
- **Multi-Role System**: Admin, Manager, Team Lead, and Employee roles
- **Task Management**: Create, assign, track, and manage tasks
- **Performance Analytics**: Automatic performance score calculation
- **IDE Integration**: VS Code extension for automatic time tracking
- **Real-time Notifications**: In-app and email notifications
- **Reporting & Export**: PDF and Excel report generation
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile, tablet, and desktop support

### User Roles & Permissions
- **Admin**: System-wide management and analytics
- **Manager**: Full task and team management
- **Team Lead**: Team-specific task management
- **Employee**: Task execution and self-tracking

## 🛠️ Tech Stack

### Frontend
- React 18+ with Hooks
- React Router v6
- Axios for API calls
- Chart.js for visualizations
- React Hook Form + Yup for validation
- CSS Modules for styling

### Backend
- Node.js 18+ LTS
- Express.js 4+
- MySQL 8.0+ with Sequelize ORM
- JWT authentication
- Bcrypt for password hashing
- Nodemailer for emails
- Express Rate Limit for security

### IDE Plugin
- VS Code Extension API
- TypeScript
- Automatic activity detection

## 📋 Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+
- npm or yarn
- SMTP server (for email notifications)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd employee-task-tracker
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE employee_tracker;
exit;
```

### 4. Environment Configuration

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `FRONTEND_URL`

### 5. Run Database Migrations
```bash
cd backend
npm run migrate
```

### 6. Seed Initial Data (Optional)
```bash
npm run seed
```

## 🏃 Running the Application

### Development Mode

**Option 1: Run all services together**
```bash
# From root directory
npm run dev
```

**Option 2: Run services separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
```

## 📁 Project Structure

```
employee-task-tracker/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utility functions
│   │   └── server.js          # Entry point
│   ├── uploads/               # File uploads
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── ide-plugin/                 # VS Code extension
│   ├── src/
│   │   ├── extension.ts       # Extension entry
│   │   ├── timeTracker.ts     # Time tracking
│   │   └── apiClient.ts       # API client
│   └── package.json
│
├── aidlc-docs/                 # AIDLC documentation
│   ├── inception/
│   │   ├── requirements/
│   │   ├── user-stories/
│   │   └── plans/
│   └── audit.md
│
├── package.json                # Root package.json
└── README.md
```

## 🔑 Default Credentials

After seeding, use these credentials:

**Admin**
- Email: admin@example.com
- Password: Admin@123

**Manager**
- Email: manager@example.com
- Password: Manager@123

**Employee**
- Email: employee@example.com
- Password: Employee@123

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new employee
- `POST /api/auth/login` - Login
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment
- `POST /api/tasks/:id/files` - Upload file

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Dashboard
- `GET /api/dashboard/employee` - Employee dashboard
- `GET /api/dashboard/manager` - Manager dashboard
- `GET /api/dashboard/admin` - Admin dashboard

### Time Tracking
- `POST /api/time-tracking/sessions` - Create time session
- `PUT /api/time-tracking/sessions/:id` - Update time session
- `GET /api/time-tracking/sessions` - Get time sessions
- `GET /api/time-tracking/summary` - Get summary

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🔒 Security Features

- JWT authentication with 8-hour expiration
- Password hashing with bcrypt (10 salt rounds)
- Rate limiting on authentication endpoints
- Account lockout after 5 failed login attempts
- CORS configuration
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention (Sequelize ORM)
- XSS prevention
- CSRF protection

## 📈 Performance Metrics

- API response time: < 500ms (95th percentile)
- Page load time: < 2 seconds
- Dashboard charts: < 1 second render time
- Supports 1000 concurrent users
- Handles 100,000+ tasks

## 🎨 UI/UX Features

- Clean, modern dashboard design
- Sidebar navigation
- Status color coding (Red: Pending, Yellow: In Progress, Green: Completed)
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Interactive charts (Chart.js)
- Loading indicators
- Error handling with user-friendly messages

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Development Team

## 📞 Support

For support, email support@example.com or open an issue in the repository.

## 🚧 Remaining Implementation

The following components need to be completed:

### Backend Controllers
- Task Controller (CRUD operations)
- User Controller (user management)
- Dashboard Controller (analytics)
- Time Tracking Controller
- Notification Controller
- Report Controller (PDF/Excel export)

### Frontend Pages
- Register page
- Verify Email page
- Forgot Password page
- Reset Password page
- Dashboard pages (role-specific)
- Tasks page (list and detail)
- Users page
- Profile page
- Not Found page

### Frontend Components
- Layout components (Header, Sidebar, Footer)
- Task components (TaskCard, TaskForm, TaskList)
- User components (UserCard, UserForm)
- Chart components
- Notification components
- File upload components

### IDE Plugin
- VS Code extension implementation
- Time tracking logic
- API integration
- Activity detection

### Additional Features
- File upload handling (multer)
- Email templates
- Report generation (PDF/Excel)
- Notification system
- Audit logging
- Database seeding script
- Migration scripts

## 📚 Documentation

Complete AIDLC documentation is available in the `aidlc-docs/` directory:
- Requirements: `aidlc-docs/inception/requirements/requirements.md`
- User Stories: `aidlc-docs/inception/user-stories/stories.md`
- Execution Plan: `aidlc-docs/inception/plans/execution-plan.md`
- Audit Log: `aidlc-docs/audit.md`
