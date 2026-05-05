import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  startTimeSession,
  heartbeat,
  stopTimeSession,
  getActiveSession,
  getTaskTimeSummary,
  getUserTimeSummary,
  getTeamTimeSummary
} from '../controllers/timeTrackingController.js';

const router = express.Router();

router.use(authenticate);

// Active session
router.get('/sessions/active', getActiveSession);

// Start tracking (employee starts typing)
router.post('/sessions/start', startTimeSession);

// Heartbeat while active
router.post('/sessions/heartbeat', heartbeat);

// Stop tracking (idle or close)
router.post('/sessions/stop', stopTimeSession);

// Per-task time summary (team lead / manager)
router.get('/tasks/:task_id/summary',
  authorize('admin', 'manager', 'team_lead'),
  getTaskTimeSummary
);

// User's own time summary
router.get('/my-summary', getUserTimeSummary);

// Team summary (manager / team lead)
router.get('/team-summary',
  authorize('admin', 'manager', 'team_lead'),
  getTeamTimeSummary
);

export default router;
