import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        newPassword: formData.password
      });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px'
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✗</div>
          <h2 style={{ color: '#e74c3c' }}>Invalid Reset Link</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px'
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
          <h2 style={{ color: '#2ecc71' }}>Password Reset Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Your password has been reset successfully.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Redirecting to login page...
          </p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px'
      }}>
        <h2 style={{ marginBottom: '10px' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Enter your new password below.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            padding: '12px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              New Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={8}
              placeholder="Enter new password (min 8 characters)"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              placeholder="Confirm new password"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link 
              to="/login"
              style={{
                color: 'var(--primary)',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
