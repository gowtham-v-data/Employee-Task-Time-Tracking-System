import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TimeSession = sequelize.define('time_sessions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  active_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active time in seconds'
  },
  idle_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Idle time in seconds'
  },
  total_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total time in seconds'
  },
  ide_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'VS Code'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default TimeSession;
