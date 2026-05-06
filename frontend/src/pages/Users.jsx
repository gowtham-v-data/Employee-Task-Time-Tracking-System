import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setUsers(response.data.data.users);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/users/${userId}`,
        { is_active: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error('Failed to deactivate user:', err);
      alert('Failed to deactivate user');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/users/${userId}`,
        { is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error('Failed to activate user:', err);
      alert('Failed to activate user');
    }
  };

  const canManageUsers = ['admin', 'manager'].includes(user?.role);

  if (loading && users.length === 0) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Loading users...</h2>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Users</h1>
        {canManageUsers && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
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
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="team_lead">Team Lead</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{ backgroundColor: '#fee', padding: '15px', marginBottom: '20px' }}>
          <p style={{ color: '#c00' }}>{error}</p>
        </div>
      )}

      {/* Users Grid */}
      {users.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No users found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Try adjusting your search filters
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {users.map(userItem => (
            <UserCard
              key={userItem.id}
              user={userItem}
              currentUser={user}
              canManage={canManageUsers}
              onDeactivate={handleDeactivateUser}
              onActivate={handleActivateUser}
              onEdit={setSelectedUser}
            />
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <UserFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <UserFormModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={() => {
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  </>
  );
};

// User Card Component
const UserCard = ({ user, currentUser, canManage, onDeactivate, onActivate, onEdit }) => {
  const getRoleColor = (role) => {
    const colors = {
      admin: '#e74c3c',
      manager: '#3498db',
      team_lead: '#9b59b6',
      employee: '#2ecc71'
    };
    return colors[role] || '#95a5a6';
  };

  return (
    <div className="card" style={{ padding: '20px', borderTop: `4px solid ${getRoleColor(user.role)}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '5px' }}>{user.name}</h3>
          <span 
            style={{
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: getRoleColor(user.role),
              color: 'white',
              textTransform: 'capitalize'
            }}
          >
            {user.role.replace('_', ' ')}
          </span>
        </div>
        {!user.is_active && (
          <span style={{
            fontSize: '12px',
            padding: '3px 8px',
            borderRadius: '10px',
            backgroundColor: '#e74c3c',
            color: 'white'
          }}>
            Inactive
          </span>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
          📧 {user.email}
        </div>
        {user.statistics && (
          <div style={{ 
            marginTop: '10px', 
            paddingTop: '10px', 
            borderTop: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '13px'
          }}>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Tasks</div>
              <div style={{ fontWeight: '500' }}>{user.statistics.total_tasks || 0}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Completed</div>
              <div style={{ fontWeight: '500' }}>{user.statistics.tasks_completed || 0}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Performance</div>
              <div style={{ fontWeight: '500', color: (user.statistics.performance_score || 0) >= 70 ? '#2ecc71' : '#e74c3c' }}>
                {user.statistics.performance_score || 0}%
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Joined</div>
              <div style={{ fontWeight: '500' }}>
                {format(new Date(user.created_at), 'MMM yyyy')}
              </div>
            </div>
          </div>
        )}
      </div>

      {canManage && user.id !== currentUser.id && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            onClick={() => onEdit(user)}
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '13px', padding: '8px' }}
          >
            Edit
          </button>
          {user.is_active ? (
            <button 
              onClick={() => onDeactivate(user.id)}
              className="btn"
              style={{ flex: 1, fontSize: '13px', padding: '8px', backgroundColor: '#e74c3c', color: 'white' }}
            >
              Deactivate
            </button>
          ) : (
            <button 
              onClick={() => onActivate(user.id)}
              className="btn btn-success"
              style={{ flex: 1, fontSize: '13px', padding: '8px' }}
            >
              Activate
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// User Form Modal Component
const UserFormModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'employee',
    password: '',
    is_active: user?.is_active !== undefined ? user.is_active : true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const payload = { ...formData };
      if (user && !payload.password) {
        delete payload.password; // Don't send empty password on update
      }

      if (user) {
        // Update existing user
        await axios.put(`/api/users/${user.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new user
        await axios.post('/api/users', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '30px'
      }}>
        <h2 style={{ marginBottom: '20px' }}>
          {user ? 'Edit User' : 'Create New User'}
        </h2>

        {error && (
          <div style={{ backgroundColor: '#fee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={!!user}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: user ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
            {user && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                Email cannot be changed
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Password {!user && '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required={!user}
              placeholder={user ? 'Leave blank to keep current password' : ''}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="employee">Employee</option>
              <option value="team_lead">Team Lead</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {user && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <span>Active</span>
              </label>
            </div>
          )}

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
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;
