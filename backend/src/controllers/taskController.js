import { Task, TaskAssignment, User, Comment, File, AuditLog } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { sendTaskAssignmentEmail } from '../utils/email.js';

// Get all tasks (with filters and pagination)
export const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      assignedTo,
      createdBy,
      keyword,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'deadline',
      sortOrder = 'ASC'
    } = req.query;

    const where = { is_deleted: false };
    const offset = (page - 1) * limit;

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (createdBy) {
      where.created_by = createdBy;
    }

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }

    if (dateFrom || dateTo) {
      where.deadline = {};
      if (dateFrom) where.deadline[Op.gte] = new Date(dateFrom);
      if (dateTo) where.deadline[Op.lte] = new Date(dateTo);
    }

    // Role-based filtering
    let include = [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email', 'role']
      },
      {
        model: User,
        as: 'assignedUsers',
        attributes: ['id', 'name', 'email', 'role'],
        through: { attributes: ['assigned_at'] }
      }
    ];

    // Employee: only see their assigned tasks
    if (req.user.role === 'employee') {
      include.push({
        model: TaskAssignment,
        as: 'assignments',
        where: { user_id: req.user.id },
        required: true
      });
    }

    // Team Lead: see their created tasks + assigned tasks
    if (req.user.role === 'team_lead') {
      // Get task IDs where user is assigned
      const assignedTaskIds = await TaskAssignment.findAll({
        where: { user_id: req.user.id },
        attributes: ['task_id'],
        raw: true
      });

      const assignedIds = assignedTaskIds.map(a => a.task_id);

      // Filter to show tasks created by team lead OR assigned to team lead
      where[Op.or] = [
        { created_by: req.user.id },
        { id: { [Op.in]: assignedIds.length > 0 ? assignedIds : [0] } }
      ];
    }

    // Get tasks
    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get task by ID
export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, is_deleted: false },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'email', 'role'],
          through: { attributes: ['assigned_at'] }
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'role']
          }],
          order: [['created_at', 'ASC']]
        },
        {
          model: File,
          as: 'files',
          include: [{
            model: User,
            as: 'uploader',
            attributes: ['id', 'name']
          }]
        },
        {
          model: AuditLog,
          as: 'auditLogs',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'role']
          }],
          order: [['timestamp', 'DESC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const isAssigned = task.assignedUsers.some(u => u.id === req.user.id);
    const isCreator = task.created_by === req.user.id;
    const canView = req.user.role === 'admin' || req.user.role === 'manager' || isCreator || isAssigned;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Create task
export const createTask = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { title, description, deadline, assignedTo } = req.body;

    // Validate assignedTo is array
    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one user must be assigned to the task'
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      deadline,
      created_by: req.user.id,
      status: 'pending'
    }, { transaction: t });

    // Create task assignments
    const assignments = assignedTo.map(userId => ({
      task_id: task.id,
      user_id: userId
    }));

    await TaskAssignment.bulkCreate(assignments, { transaction: t });

    // Create audit log
    await AuditLog.create({
      task_id: task.id,
      user_id: req.user.id,
      action: 'TASK_CREATED',
      field: null,
      old_value: null,
      new_value: JSON.stringify({ title, deadline, assignedTo })
    }, { transaction: t });

    await t.commit();

    // Send notification emails (async, don't wait)
    const assignedUsers = await User.findAll({
      where: { id: assignedTo }
    });

    assignedUsers.forEach(user => {
      sendTaskAssignmentEmail(user.email, user.name, title, deadline).catch(err => {
        console.error('Failed to send email:', err);
      });
    });

    // Fetch complete task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Update task
export const updateTask = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findOne({
      where: { id, is_deleted: false },
      include: [{ model: User, as: 'assignedUsers' }]
    });

    if (!task) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const isCreator = task.created_by === req.user.id;
    const isAssigned = task.assignedUsers.some(u => u.id === req.user.id);
    const canEdit = req.user.role === 'admin' || req.user.role === 'manager' ||
                    (req.user.role === 'team_lead' && isCreator) ||
                    (req.user.role === 'employee' && isAssigned && updates.status && Object.keys(updates).length === 1);

    if (!canEdit) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Track changes for audit log
    const changes = [];
    const allowedFields = req.user.role === 'employee' ? ['status'] :
                         ['title', 'description', 'deadline', 'status', 'assignedTo'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined && field !== 'assignedTo') {
        if (task[field] !== updates[field]) {
          changes.push({
            field,
            old_value: String(task[field]),
            new_value: String(updates[field])
          });
          task[field] = updates[field];
        }
      }
    }

    // Handle status change to completed
    if (updates.status === 'completed' && task.status !== 'completed') {
      task.completed_at = new Date();
    }

    await task.save({ transaction: t });

    // Handle assignment changes
    if (updates.assignedTo && Array.isArray(updates.assignedTo)) {
      await TaskAssignment.destroy({
        where: { task_id: task.id },
        transaction: t
      });

      const assignments = updates.assignedTo.map(userId => ({
        task_id: task.id,
        user_id: userId
      }));

      await TaskAssignment.bulkCreate(assignments, { transaction: t });

      changes.push({
        field: 'assigned_users',
        old_value: task.assignedUsers.map(u => u.id).join(','),
        new_value: updates.assignedTo.join(',')
      });
    }

    // Create audit logs
    for (const change of changes) {
      await AuditLog.create({
        task_id: task.id,
        user_id: req.user.id,
        action: 'TASK_UPDATED',
        field: change.field,
        old_value: change.old_value,
        new_value: change.new_value
      }, { transaction: t });
    }

    await t.commit();

    // Fetch updated task
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Delete task (soft delete, managers only)
export const deleteTask = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, is_deleted: false }
    });

    if (!task) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Soft delete
    task.is_deleted = true;
    await task.save({ transaction: t });

    // Create audit log
    await AuditLog.create({
      task_id: task.id,
      user_id: req.user.id,
      action: 'TASK_DELETED',
      field: null,
      old_value: null,
      new_value: null
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Add comment to task
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const task = await Task.findOne({
      where: { id, is_deleted: false }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = await Comment.create({
      task_id: id,
      user_id: req.user.id,
      text
    });

    // Create audit log
    await AuditLog.create({
      task_id: id,
      user_id: req.user.id,
      action: 'COMMENT_ADDED',
      field: 'comment',
      old_value: null,
      new_value: text
    });

    // Fetch comment with author
    const createdComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: createdComment
    });
  } catch (error) {
    next(error);
  }
};
