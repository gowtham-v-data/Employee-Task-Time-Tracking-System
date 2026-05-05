import { TimeSession, Task, User, TaskAssignment } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// Start a new time session (called when employee starts typing)
export const startTimeSession = async (req, res, next) => {
  try {
    const { task_id } = req.body;

    // Verify task exists and user is assigned
    const assignment = await TaskAssignment.findOne({
      where: { task_id, user_id: req.user.id }
    });

    // Also allow task creator (team lead) to track time
    const task = await Task.findOne({ where: { id: task_id, is_deleted: false } });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!assignment && task.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // End any existing active session for this user
    await TimeSession.update(
      {
        end_time: new Date(),
        total_time: sequelize.literal('TIMESTAMPDIFF(SECOND, start_time, NOW())')
      },
      {
        where: { user_id: req.user.id, end_time: null }
      }
    );

    // Create new session
    const session = await TimeSession.create({
      task_id,
      user_id: req.user.id,
      start_time: new Date(),
      active_time: 0,
      idle_time: 0,
      total_time: 0,
      ide_type: 'VS Code'
    });

    res.status(201).json({
      success: true,
      message: 'Time session started',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// Heartbeat - called every 30s while employee is active (typing)
export const heartbeat = async (req, res, next) => {
  try {
    const { session_id, active_seconds } = req.body;

    const session = await TimeSession.findOne({
      where: { id: session_id, user_id: req.user.id, end_time: null }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const now = new Date();
    const totalElapsed = Math.floor((now - new Date(session.start_time)) / 1000);

    session.active_time = active_seconds || session.active_time;
    session.total_time = totalElapsed;
    session.idle_time = totalElapsed - session.active_time;
    await session.save();

    res.json({
      success: true,
      data: {
        session_id: session.id,
        active_time: session.active_time,
        total_time: session.total_time,
        idle_time: session.idle_time
      }
    });
  } catch (error) {
    next(error);
  }
};

// Stop time session (called when idle timeout or VS Code closes)
export const stopTimeSession = async (req, res, next) => {
  try {
    const { session_id, active_seconds } = req.body;

    const session = await TimeSession.findOne({
      where: { id: session_id, user_id: req.user.id, end_time: null }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const now = new Date();
    const totalElapsed = Math.floor((now - new Date(session.start_time)) / 1000);

    session.end_time = now;
    session.active_time = active_seconds || session.active_time;
    session.total_time = totalElapsed;
    session.idle_time = totalElapsed - session.active_time;
    await session.save();

    res.json({
      success: true,
      message: 'Time session stopped',
      data: {
        session_id: session.id,
        active_time_seconds: session.active_time,
        total_time_seconds: session.total_time,
        active_hours: (session.active_time / 3600).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get active session for current user
export const getActiveSession = async (req, res, next) => {
  try {
    const session = await TimeSession.findOne({
      where: { user_id: req.user.id, end_time: null },
      include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'status', 'deadline'] }]
    });

    if (!session) {
      return res.json({ success: true, data: null });
    }

    const now = new Date();
    const totalElapsed = Math.floor((now - new Date(session.start_time)) / 1000);

    res.json({
      success: true,
      data: {
        ...session.toJSON(),
        current_total_seconds: totalElapsed
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get time summary per task (for dashboards)
export const getTaskTimeSummary = async (req, res, next) => {
  try {
    const { task_id } = req.params;

    const sessions = await TimeSession.findAll({
      where: { task_id, end_time: { [Op.not]: null } },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['start_time', 'DESC']]
    });

    // Group by user
    const byUser = {};
    sessions.forEach(s => {
      const uid = s.user_id;
      if (!byUser[uid]) {
        byUser[uid] = {
          user: s.user,
          total_active_seconds: 0,
          total_sessions: 0
        };
      }
      byUser[uid].total_active_seconds += s.active_time || 0;
      byUser[uid].total_sessions += 1;
    });

    const totalActiveSeconds = sessions.reduce((sum, s) => sum + (s.active_time || 0), 0);

    res.json({
      success: true,
      data: {
        task_id,
        total_active_seconds: totalActiveSeconds,
        total_active_hours: (totalActiveSeconds / 3600).toFixed(2),
        total_sessions: sessions.length,
        by_user: Object.values(byUser).map(u => ({
          ...u,
          total_active_hours: (u.total_active_seconds / 3600).toFixed(2)
        })),
        sessions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get time summary for a user (for employee dashboard)
export const getUserTimeSummary = async (req, res, next) => {
  try {
    // Allow managers/team leads to query other users
    const targetUserId = (req.user.role !== 'employee' && req.query.user_id)
      ? req.query.user_id
      : req.user.id;

    const { dateFrom, dateTo } = req.query;

    const where = {
      user_id: targetUserId,
      end_time: { [Op.not]: null }
    };

    if (dateFrom || dateTo) {
      where.start_time = {};
      if (dateFrom) where.start_time[Op.gte] = new Date(dateFrom);
      if (dateTo) where.start_time[Op.lte] = new Date(dateTo);
    }

    const sessions = await TimeSession.findAll({
      where,
      include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'status'] }],
      order: [['start_time', 'DESC']]
    });

    // Group by task
    const byTask = {};
    sessions.forEach(s => {
      const tid = s.task_id;
      if (!byTask[tid]) {
        byTask[tid] = {
          task_id: tid,
          task_title: s.task?.title,
          task_status: s.task?.status,
          total_active_seconds: 0,
          total_sessions: 0
        };
      }
      byTask[tid].total_active_seconds += s.active_time || 0;
      byTask[tid].total_sessions += 1;
    });

    const totalActiveSeconds = sessions.reduce((sum, s) => sum + (s.active_time || 0), 0);

    res.json({
      success: true,
      data: {
        total_active_seconds: totalActiveSeconds,
        total_active_hours: (totalActiveSeconds / 3600).toFixed(2),
        total_sessions: sessions.length,
        by_task: Object.values(byTask).map(t => ({
          ...t,
          total_active_hours: (t.total_active_seconds / 3600).toFixed(2)
        })).sort((a, b) => b.total_active_seconds - a.total_active_seconds),
        recent_sessions: sessions.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get team time summary (for manager/team lead dashboard)
export const getTeamTimeSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const where = { end_time: { [Op.not]: null } };

    if (dateFrom || dateTo) {
      where.start_time = {};
      if (dateFrom) where.start_time[Op.gte] = new Date(dateFrom);
      if (dateTo) where.start_time[Op.lte] = new Date(dateTo);
    }

    // For team lead, only show their team's tasks
    if (req.user.role === 'team_lead') {
      const myTaskIds = await Task.findAll({
        where: { created_by: req.user.id, is_deleted: false },
        attributes: ['id'],
        raw: true
      });
      where.task_id = { [Op.in]: myTaskIds.map(t => t.id) };
    }

    const sessions = await TimeSession.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
        { model: Task, as: 'task', attributes: ['id', 'title', 'status'] }
      ],
      order: [['start_time', 'DESC']]
    });

    // Group by user
    const byUser = {};
    sessions.forEach(s => {
      const uid = s.user_id;
      if (!byUser[uid]) {
        byUser[uid] = {
          user: s.user,
          total_active_seconds: 0,
          total_sessions: 0,
          tasks: {}
        };
      }
      byUser[uid].total_active_seconds += s.active_time || 0;
      byUser[uid].total_sessions += 1;

      // Track per task
      const tid = s.task_id;
      if (!byUser[uid].tasks[tid]) {
        byUser[uid].tasks[tid] = {
          task_id: tid,
          task_title: s.task?.title,
          active_seconds: 0
        };
      }
      byUser[uid].tasks[tid].active_seconds += s.active_time || 0;
    });

    res.json({
      success: true,
      data: {
        total_active_seconds: sessions.reduce((sum, s) => sum + (s.active_time || 0), 0),
        by_user: Object.values(byUser).map(u => ({
          user: u.user,
          total_active_hours: (u.total_active_seconds / 3600).toFixed(2),
          total_sessions: u.total_sessions,
          tasks: Object.values(u.tasks).map(t => ({
            ...t,
            active_hours: (t.active_seconds / 3600).toFixed(2)
          }))
        })).sort((a, b) => b.total_active_seconds - a.total_active_seconds)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Legacy endpoints kept for compatibility
export const createTimeSession = startTimeSession;
export const updateTimeSession = stopTimeSession;
export const getTimeSessions = getUserTimeSummary;
export const getTimeTrackingSummary = getUserTimeSummary;
