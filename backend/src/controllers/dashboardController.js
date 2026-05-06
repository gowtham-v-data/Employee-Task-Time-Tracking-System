import { Task, TaskAssignment, User, TimeSession } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { getUserStats } from './userController.js';

// Employee Dashboard
export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user stats
    const stats = await getUserStats(userId);

    // Pre-fetch assigned task IDs once (reused across queries)
    const assignedRows = await TaskAssignment.findAll({
      where: { user_id: userId },
      attributes: ['task_id'],
      raw: true
    });
    const assignedIds = assignedRows.map(r => r.task_id);
    const taskIdFilter = assignedIds.length > 0 ? assignedIds : [0];

    // Get upcoming deadlines (next 7 days)
    const upcomingDeadlines = await Task.findAll({
      where: {
        id: { [Op.in]: taskIdFilter },
        status: { [Op.in]: ['pending', 'in_progress'] },
        deadline: {
          [Op.between]: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        },
        is_deleted: false
      },
      order: [['deadline', 'ASC']],
      limit: 5
    });

    // Get task completion trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completionTrend = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('completed_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('tasks.id')), 'count']
      ],
      where: {
        id: { [Op.in]: taskIdFilter },
        status: 'completed',
        completed_at: { [Op.gte]: thirtyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('completed_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('completed_at')), 'ASC']],
      raw: true
    });

    // Get time tracking summary (this week and month)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const timeThisWeek = await TimeSession.sum('active_time', {
      where: {
        user_id: userId,
        created_at: { [Op.gte]: weekStart }
      }
    }) || 0;

    const timeThisMonth = await TimeSession.sum('active_time', {
      where: {
        user_id: userId,
        created_at: { [Op.gte]: monthStart }
      }
    }) || 0;

    // Get recent activity (last 10 tasks updated)
    const recentActivity = await Task.findAll({
      where: {
        id: { [Op.in]: taskIdFilter },
        is_deleted: false
      },
      order: [['updated_at', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        stats,
        upcomingDeadlines,
        completionTrend,
        timeTracking: {
          hoursThisWeek: Math.round(timeThisWeek / 3600 * 10) / 10,
          hoursThisMonth: Math.round(timeThisMonth / 3600 * 10) / 10
        },
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// Manager Dashboard
export const getManagerDashboard = async (req, res, next) => {
  try {
    // Get all tasks statistics
    const totalTasks = await Task.count({ where: { is_deleted: false } });
    const completedTasks = await Task.count({ where: { status: 'completed', is_deleted: false } });
    const pendingTasks = await Task.count({ where: { status: 'pending', is_deleted: false } });
    const inProgressTasks = await Task.count({ where: { status: 'in_progress', is_deleted: false } });

    // Get late tasks
    const lateTasks = await Task.findAll({
      where: {
        status: { [Op.in]: ['pending', 'in_progress'] },
        deadline: { [Op.lt]: new Date() },
        is_deleted: false
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] }
      ],
      order: [['deadline', 'ASC']]
    });

    // Get tasks nearing deadline (within 3 days)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const tasksNearingDeadline = await Task.findAll({
      where: {
        status: { [Op.in]: ['pending', 'in_progress'] },
        deadline: {
          [Op.between]: [new Date(), threeDaysFromNow]
        },
        is_deleted: false
      },
      include: [
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] }
      ],
      order: [['deadline', 'ASC']],
      limit: 10
    });

    // Get employee performance scores
    const employees = await User.findAll({
      where: {
        role: { [Op.in]: ['employee', 'team_lead'] },
        is_active: true
      },
      attributes: ['id', 'name', 'email', 'role']
    });

    const employeePerformance = await Promise.all(
      employees.map(async (employee) => {
        const stats = await getUserStats(employee.id);
        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          ...stats
        };
      })
    );

    // Sort by performance score
    employeePerformance.sort((a, b) => b.performanceScore - a.performanceScore);

    // Get top performers (top 5)
    const topPerformers = employeePerformance.slice(0, 5);

    // Get task completion trends (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const completionTrend = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('completed_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        status: 'completed',
        completed_at: { [Op.gte]: ninetyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('completed_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('completed_at')), 'ASC']],
      raw: true
    });

    // Get workload distribution
    const workloadDistribution = employeePerformance.map(emp => ({
      name: emp.name,
      totalTasks: emp.totalTasks,
      pendingTasks: emp.pendingTasks,
      inProgressTasks: emp.inProgressTasks
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          lateTasksCount: lateTasks.length
        },
        lateTasks,
        tasksNearingDeadline,
        employeePerformance,
        topPerformers,
        completionTrend,
        workloadDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin Dashboard
export const getAdminDashboard = async (req, res, next) => {
  try {
    // Get system-wide statistics
    const totalUsers = await User.count({ where: { is_active: true } });
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { is_active: true },
      group: ['role'],
      raw: true
    });

    const totalTasks = await Task.count({ where: { is_deleted: false } });
    const completedTasks = await Task.count({ where: { status: 'completed', is_deleted: false } });

    // Get active users (logged in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.count({
      where: {
        last_login: { [Op.gte]: sevenDaysAgo },
        is_active: true
      }
    });

    // Get task creation trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const taskCreationTrend = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Get user registration trend (last 30 days)
    const userRegistrationTrend = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Get top active users (by task count)
    const topActiveUsers = await User.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'role',
        [sequelize.fn('COUNT', sequelize.col('assignedTasks.id')), 'taskCount']
      ],
      include: [{
        model: Task,
        as: 'assignedTasks',
        attributes: [],
        through: { attributes: [] }
      }],
      where: { is_active: true },
      group: ['users.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('assignedTasks.id')), 'DESC']],
      limit: 10,
      subQuery: false
    });

    // Get system health metrics
    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          usersByRole,
          totalTasks,
          completedTasks,
          activeUsers
        },
        trends: {
          taskCreation: taskCreationTrend,
          userRegistration: userRegistrationTrend
        },
        topActiveUsers,
        systemHealth
      }
    });
  } catch (error) {
    next(error);
  }
};
