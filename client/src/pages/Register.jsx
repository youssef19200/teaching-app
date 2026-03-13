import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './AuthStyles.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Auto-redirect to login after success
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await register(username, email, password, role);
      setSuccessMessage('✅ Registration Successful! Redirecting to login...');
      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('student');
    } catch (err) {
      setErrorMessage('❌ Registration Failed. Please try again.');
    }
  };

  // If success message is shown, display success view
  if (successMessage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <i className="fas fa-check" style={{ fontSize: '40px' }}></i>
            </div>
            <h2 style={{ color: '#10b981' }}>Success!</h2>
            <p>Your account has been created successfully</p>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            background: '#f0fdf4',
            borderRadius: '10px',
            border: '2px solid #10b981',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#059669', fontSize: '16px', margin: 0 }}>
              {successMessage}
            </p>
            <div style={{ 
              marginTop: '16px', 
              height: '4px', 
              background: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                animation: 'progressBar 3s linear',
                borderRadius: '2px'
              }}></div>
            </div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px', 
              marginTop: '12px',
              margin: 0
            }}>
              Redirecting in <strong>3</strong> seconds...
            </p>
          </div>

          <Link to="/login" className="auth-button" style={{ textDecoration: 'none' }}>
            <i className="fas fa-arrow-right"></i> Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Create Account</h2>
          <p>Join us and start learning today</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-exclamation-circle"></i>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <i className="fas fa-user"></i> Username
            </label>
            <input 
              type="text" 
              placeholder="Choose a username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-envelope"></i> Email Address
            </label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Password
            </label>
            <input 
              type="password" 
              placeholder="Create a password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-id-badge"></i> I want to...
            </label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ 
                padding: '12px 16px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '10px', 
                fontSize: '14px', 
                width: '100%',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              <option value="student">🎓 Learn (Student)</option>
              <option value="teacher">👨‍ Teach (Teacher)</option>
            </select>
          </div>

          <button type="submit" className="auth-button">
            <i className="fas fa-user-plus"></i> Sign Up
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;