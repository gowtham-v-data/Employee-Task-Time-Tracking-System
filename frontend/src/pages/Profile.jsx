import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data.statistics);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `/api/users/${user.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update user in context
      setUser(response.data.data);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        '/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password changed successfully!');
      setPasswordMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
        <h1 style={{ marginBottom: '30px' }}>My Profile</h1>

      {/* Success/Error Messages */}
      {success && (
        <div className="card" style={{ backgroundColor: '#d1e7dd', padding: '15px', marginBottom: '20px' }}>
          <p style={{ color: '#0f5132', margin: 0 }}>✓ {success}</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ backgroundColor: '#fee', padding: '15px', marginBottom: '20px' }}>
          <p style={{ color: '#c00', margin: 0 }}>✗ {error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Profile Information */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Profile Information</h3>
            {!editMode && (
              <button 
                onClick={() => setEditMode(true)}
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '6px 12px' }}
              >
                Edit
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  Email cannot be changed
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditMode(false);
                    setFormData({ name: user.name, email: user.email });
                  }}
                  className="btn"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{user.name}</div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{user.email}</div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Role</div>
                <div style={{ fontSize: '16px', fontWeight: '500', textTransform: 'capitalize' }}>
                  {user.role.replace('_', ' ')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Member Since</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {format(new Date(user.created_at), 'MMMM dd, yyyy')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Statistics */}
        {stats && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Performance Statistics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ 
                padding: '15px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Total Tasks
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
                  {stats.total_tasks || 0}
                </div>
              </div>

              <div style={{ 
                padding: '15px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Completed
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2ecc71' }}>
                  {stats.tasks_completed || 0}
                </div>
              </div>

              <div style={{ 
                padding: '15px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  In Progress
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>
                  {stats.tasks_in_progress || 0}
                </div>
              </div>

              <div style={{ 
                padding: '15px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Performance
                </div>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: (stats.performance_score || 0) >= 70 ? '#2ecc71' : '#e74c3c'
                }}>
                  {stats.performance_score || 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Change Password</h3>
          {!passwordMode && (
            <button 
              onClick={() => setPasswordMode(true)}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              Change Password
            </button>
          )}
        </div>

        {passwordMode ? (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Current Password *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                New Password * (min 8 characters)
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={8}
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setPasswordMode(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="btn"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Keep your account secure by using a strong password
          </p>
        )}
      </div>
    </div>
  </>
  );
};

export default Profile;
