import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Email verification failed');
    }
  };

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
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h2>Verifying your email...</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              Please wait while we verify your email address
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <h2 style={{ color: '#2ecc71' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              {message}
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              Redirecting to login page...
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✗</div>
            <h2 style={{ color: '#e74c3c' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              {message}
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
              <Link to="/register" className="btn" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                Register Again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
