import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('role').isIn(['manager', 'team_lead', 'employee']).withMessage('Invalid role')
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin', 'manager', 'team_lead', 'employee']),
  body('is_active').optional().isBoolean()
];

// User routes
router.get('/', authorize('admin', 'manager', 'team_lead'), getUsers);
router.post('/', authorize('admin', 'manager'), createUserValidation, validate, createUser);
router.get('/:id', getUser);
router.put('/:id', updateUserValidation, validate, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
