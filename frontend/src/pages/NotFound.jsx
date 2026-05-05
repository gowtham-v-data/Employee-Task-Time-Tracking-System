import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', margin: '0' }}>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
