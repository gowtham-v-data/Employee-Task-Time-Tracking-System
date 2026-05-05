import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  getCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
];

// Routes
router.post('/register', registerLimiter, registerValidation, validate, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/request-password-reset', authLimiter, body('email').isEmail(), validate, requestPasswordReset);
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);
router.get('/me', authenticate, getCurrentUser);

export default router;
