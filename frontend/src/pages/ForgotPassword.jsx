import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 style={{ color: '#2ecc71' }}>Check Your Email</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '15px', lineHeight: '1.6' }}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Back to Login
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
        <h2 style={{ marginBottom: '10px' }}>Forgot Password?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Enter your email address and we'll send you a link to reset your password.
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
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
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
            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
