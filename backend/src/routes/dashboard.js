import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getEmployeeDashboard,
  getManagerDashboard,
  getAdminDashboard
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);

// Dashboard routes
router.get('/employee', authorize('employee'), getEmployeeDashboard);
router.get('/manager', authorize('manager', 'team_lead'), getManagerDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);

export default router;
