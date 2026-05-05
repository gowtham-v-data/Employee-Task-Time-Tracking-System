import { User, Task, TaskAssignment } from '../models/index.js';
import { Op } from 'sequelize';
import { generateToken } from '../utils/jwt.js';

// Get all users (Admin and Manager only)
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_active: true };

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'verification_token', 'reset_token'] },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
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

// Get user by ID
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'verification_token', 'reset_token'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const stats = await getUserStats(id);

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create user (Admin creates Managers, Managers create Team Leads and Employees)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check permissions
    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Managers cannot create admin accounts'
      });
    }

    if (req.user.role === 'manager' && role === 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Managers cannot create other manager accounts'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      email_verified: true // Manager-created accounts are pre-verified
    });

    // TODO: Send welcome email with credentials

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prevent role escalation
    if (updates.role && req.user.role === 'manager' && (updates.role === 'admin' || updates.role === 'manager')) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change role to admin or manager'
      });
    }

    // Update allowed fields
    const allowedFields = req.user.role === 'admin' || req.user.role === 'manager' 
      ? ['name', 'email', 'role', 'is_active']
      : ['name'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (deactivate)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete self
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Deactivate user
    user.is_active = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get user statistics
async function getUserStats(userId) {
  const totalTasks = await TaskAssignment.count({
    where: { user_id: userId }
  });

  const completedTasks = await Task.count({
    include: [{
      model: TaskAssignment,
      as: 'assignments',
      where: { user_id: userId }
    }],
    where: { status: 'completed' }
  });

  const pendingTasks = await Task.count({
    include: [{
      model: TaskAssignment,
      as: 'assignments',
      where: { user_id: userId }
    }],
    where: { status: 'pending' }
  });

  const inProgressTasks = await Task.count({
    include: [{
      model: TaskAssignment,
      as: 'assignments',
      where: { user_id: userId }
    }],
    where: { status: 'in_progress' }
  });

  // Calculate on-time completion
  const completedTasksDetails = await Task.findAll({
    include: [{
      model: TaskAssignment,
      as: 'assignments',
      where: { user_id: userId }
    }],
    where: { 
      status: 'completed',
      completed_at: { [Op.ne]: null }
    }
  });

  const onTimeTasks = completedTasksDetails.filter(task => 
    new Date(task.completed_at) <= new Date(task.deadline)
  ).length;

  const performanceScore = totalTasks > 0 
    ? Math.round((onTimeTasks / totalTasks) * 100)
    : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    onTimeTasks,
    lateTasks: completedTasks - onTimeTasks,
    performanceScore
  };
}

export { getUserStats };
