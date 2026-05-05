import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment
} from '../controllers/taskController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createTaskValidation = [
  body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('description').trim().notEmpty().isLength({ max: 5000 }).withMessage('Description is required (max 5000 characters)'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
  body('assignedTo').isArray({ min: 1 }).withMessage('At least one user must be assigned')
];

const updateTaskValidation = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('deadline').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed']),
  body('assignedTo').optional().isArray()
];

const commentValidation = [
  body('text').trim().notEmpty().isLength({ max: 2000 }).withMessage('Comment text is required (max 2000 characters)')
];

// Task routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('admin', 'manager', 'team_lead'), createTaskValidation, validate, createTask);
router.put('/:id', updateTaskValidation, validate, updateTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);
router.post('/:id/comments', commentValidation, validate, addComment);

export default router;
