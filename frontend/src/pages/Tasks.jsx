import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Navigation from '../components/Navigation';

const Tasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchTasks();
  }, [filters, pagination.page]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setTasks(response.data.data.tasks);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      keyword: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const canCreateTask = ['admin', 'manager', 'team_lead'].includes(user?.role);

  if (loading && tasks.length === 0) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Loading tasks...</h2>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          gap: '20px'
        }}>
          <h1 style={{ margin: 0, flex: '0 0 auto' }}>Tasks</h1>
          {canCreateTask && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ 
                whiteSpace: 'nowrap',
                flex: '0 0 auto',
                minWidth: 'auto',
                width: 'auto'
              }}
            >
              + Create Task
            </button>
          )}
        </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Keyword</label>
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Search tasks..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>From Date</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>To Date</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button className="btn btn-primary" onClick={fetchTasks} style={{ marginRight: '10px' }}>
            Apply Filters
          </button>
          <button className="btn" onClick={handleClearFilters} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{ backgroundColor: '#fee', padding: '15px', marginBottom: '20px' }}>
          <p style={{ color: '#c00' }}>{error}</p>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No tasks found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            {canCreateTask ? 'Create your first task to get started!' : 'No tasks assigned to you yet.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Previous
                </button>
                <span style={{ padding: '10px 15px' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  </>
  );
};

// Task Card Component
const TaskCard = ({ task, onClick }) => {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        borderLeft: `4px solid ${
          task.status === 'completed' ? '#2ecc71' :
          task.status === 'in_progress' ? '#3498db' :
          isOverdue ? '#e74c3c' : '#f39c12'
        }`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 8px var(--shadow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px var(--shadow)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>{task.title}</h3>
        <span className={`badge badge-${isOverdue ? 'overdue' : task.status}`}>
          {isOverdue ? 'Overdue' : task.status.replace('_', ' ')}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '14px' }}>
        {task.description?.substring(0, 150)}{task.description?.length > 150 ? '...' : ''}
      </p>

      <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div>
          <strong>Deadline:</strong> {format(new Date(task.deadline), 'MMM dd, yyyy')}
        </div>
        <div>
          <strong>Assigned to:</strong> {task.assignedUsers?.length || 0} user(s)
        </div>
        {task.creator && (
          <div>
            <strong>Created by:</strong> {task.creator.name}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assignedTo: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched users:', response.data);
      
      if (response.data.success && response.data.data.users) {
        setUsers(response.data.data.users);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Failed to load users list');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load users. Please check your permissions.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.assignedTo.length === 0) {
      setError('Please assign at least one user');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      await axios.post('http://localhost:5000/api/tasks', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '30px'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Create New Task</h2>

        {error && (
          <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Deadline *</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              required
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              Assign to Users * ({formData.assignedTo.length} selected)
            </label>
            {users.length === 0 ? (
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '5px',
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p>No users available to assign.</p>
                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                  Please contact your administrator to create user accounts.
                </p>
              </div>
            ) : (
              <div style={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '5px',
                padding: '10px'
              }}>
                {users.map(user => (
                  <label
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '5px',
                      marginBottom: '5px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedTo.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      style={{ marginRight: '10px' }}
                    />
                    <div>
                      <div>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {user.email} - {user.role}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;
