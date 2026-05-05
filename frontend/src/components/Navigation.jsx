import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canManageUsers = ['admin', 'manager'].includes(user?.role);

  return (
    <nav style={{
      backgroundColor: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-color)',
      padding: '15px 0',
      marginBottom: '0',
      boxShadow: '0 2px 4px var(--shadow)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px'
      }}>
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: 'var(--primary-color)',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            📊 Employee Tracker
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <Link
              to="/dashboard"
              style={{
                padding: '8px 16px',
                borderRadius: '5px',
                textDecoration: 'none',
                color: isActive('/dashboard') ? 'var(--primary-color)' : 'var(--text-primary)',
                backgroundColor: isActive('/dashboard') ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: isActive('/dashboard') ? '600' : '400',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Dashboard
            </Link>

            <Link
              to="/tasks"
              style={{
                padding: '8px 16px',
                borderRadius: '5px',
                textDecoration: 'none',
                color: isActive('/tasks') ? 'var(--primary-color)' : 'var(--text-primary)',
                backgroundColor: isActive('/tasks') ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: isActive('/tasks') ? '600' : '400',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Tasks
            </Link>

            {canManageUsers && (
              <Link
                to="/users"
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  color: isActive('/users') ? 'var(--primary-color)' : 'var(--text-primary)',
                  backgroundColor: isActive('/users') ? 'var(--bg-secondary)' : 'transparent',
                  fontWeight: isActive('/users') ? '600' : '400',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Users
              </Link>
            )}

            <Link
              to="/profile"
              style={{
                padding: '8px 16px',
                borderRadius: '5px',
                textDecoration: 'none',
                color: isActive('/profile') ? 'var(--primary-color)' : 'var(--text-primary)',
                backgroundColor: isActive('/profile') ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: isActive('/profile') ? '600' : '400',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Profile
            </Link>
          </div>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '8px 16px',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
