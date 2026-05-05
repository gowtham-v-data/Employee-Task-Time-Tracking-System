import User from './User.js';
import Task from './Task.js';
import TaskAssignment from './TaskAssignment.js';
import Comment from './Comment.js';
import File from './File.js';
import AuditLog from './AuditLog.js';
import TimeSession from './TimeSession.js';
import Notification from './Notification.js';

// Define associations

// User associations
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
User.hasMany(File, { foreignKey: 'uploaded_by', as: 'uploadedFiles' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
User.hasMany(TimeSession, { foreignKey: 'user_id', as: 'timeSessions' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.belongsToMany(Task, { through: TaskAssignment, foreignKey: 'user_id', as: 'assignedTasks' });

// Task associations
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.belongsToMany(User, { through: TaskAssignment, foreignKey: 'task_id', as: 'assignedUsers' });
Task.hasMany(TaskAssignment, { foreignKey: 'task_id', as: 'assignments' });
Task.hasMany(Comment, { foreignKey: 'task_id', as: 'comments' });
Task.hasMany(File, { foreignKey: 'task_id', as: 'files' });
Task.hasMany(AuditLog, { foreignKey: 'task_id', as: 'auditLogs' });
Task.hasMany(TimeSession, { foreignKey: 'task_id', as: 'timeSessions' });
Task.hasMany(Notification, { foreignKey: 'related_task_id', as: 'notifications' });

// TaskAssignment associations
TaskAssignment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TaskAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Comment associations
Comment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// File associations
File.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
File.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// AuditLog associations
AuditLog.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// TimeSession associations
TimeSession.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TimeSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Task, { foreignKey: 'related_task_id', as: 'relatedTask' });

export {
  User,
  Task,
  TaskAssignment,
  Comment,
  File,
  AuditLog,
  TimeSession,
  Notification
};
