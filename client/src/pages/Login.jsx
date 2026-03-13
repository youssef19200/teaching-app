import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './AuthStyles.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    // Basic validation
    if (!email || !password) {
      setErrorMessage('❌ Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('❌ Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    
    try {
      await login(email, password);
      
      // Save to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      
      // Get specific error message from backend
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      
      // Customize error messages based on the response
      if (errorMsg.includes('Invalid credentials')) {
        setErrorMessage('❌ Invalid email or password. Please try again.');
      } else if (errorMsg.includes('User already exists')) {
        setErrorMessage('❌ This email is already registered. Please login instead.');
      } else if (errorMsg.includes('network') || errorMsg.includes('Network Error')) {
        setErrorMessage('❌ Network error. Please check your connection and try again.');
      } else if (errorMsg.includes('not found')) {
        setErrorMessage('❌ No account found with this email. Please register first.');
      } else {
        setErrorMessage(`❌ ${errorMsg}`);
      }
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
  };

  // Load remembered email on mount
  useState(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h2>Welcome Back!</h2>
          <p>Sign in to continue learning</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="error-message-box">
            <i className="fas fa-exclamation-circle"></i>
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage('')}
              className="close-error-btn"
              type="button"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer',
              color: '#374151'
            }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                style={{ cursor: 'pointer' }}
              />
              Remember me
            </label>
            
            <Link to="/forgot-password" style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#5568d3'}
            onMouseOut={(e) => e.target.style.color = '#667eea'}
            >
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
            style={{ 
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i> Signing In...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Sign In
              </>
            )}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        {/* Demo Credentials Helper */}
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#f0f9ff', 
          borderRadius: '10px', 
          border: '1px solid #bae6fd',
          fontSize: '13px',
          color: '#0369a1'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
            <i className="fas fa-info-circle"></i> Quick Test:
          </p>
          <p style={{ margin: '4px 0', color: '#075985' }}>
            <strong>Teacher:</strong> teacher@example.com / password123
          </p>
          <p style={{ margin: '4px 0', color: '#075985' }}>
            <strong>Student:</strong> student@example.com / password123
          </p>
          <p style={{ margin: '8px 0 0 0', color: '#0369a1', fontSize: '12px' }}>
            ⚠️ Or register a new account above
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;