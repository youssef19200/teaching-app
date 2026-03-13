import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthStyles.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    setResetCode('');

    // Basic validation
    if (!email) {
      setMessage({ type: 'error', text: '❌ Please enter your email address' });
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: '❌ Please enter a valid email address' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      
      if (res.data.userExists) {
        setMessage({ 
          type: 'success', 
          text: res.data.emailSent 
            ? '✅ Reset code sent to your email!' 
            : '✅ Reset code generated! (See below)' 
        });
        
        // Show code in development mode or if email failed
        if (res.data.debugCode) {
          setResetCode(res.data.debugCode);
        }
        
        // Start countdown for resend
        setCountdown(60);
        setCanResend(false);
        
        // Auto-redirect to verify page after 5 seconds
        setTimeout(() => {
          if (email) {
            navigate('/verify-code', { state: { email } });
          }
        }, 5000);
      } else {
        setMessage({ 
          type: 'error', 
          text: '❌ This email is not registered. Please create an account first.' 
        });
      }
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send reset code';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isLoading) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      
      if (res.data.userExists) {
        setMessage({ 
          type: 'success', 
          text: res.data.emailSent 
            ? '✅ New code sent to your email!' 
            : '✅ New code generated!' 
        });
        
        if (res.data.debugCode) {
          setResetCode(res.data.debugCode);
        }
        
        // Reset countdown
        setCountdown(60);
        setCanResend(false);
      } else {
        setMessage({ type: 'error', text: '❌ Email not registered' });
      }
      
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Failed to resend code' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <i className="fas fa-key"></i>
          </div>
          <h2>Forgot Password?</h2>
          <p>Enter your registered email to receive a reset code</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message message-${message.type}`}>
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message.text}
            {message.type === 'success' && (
              <button 
                onClick={() => setMessage({ type: '', text: '' })}
                className="close-message-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        )}

        {/* Reset Code Display (Development Mode) */}
        {resetCode && (
          <div style={{ 
            background: '#fef3c7', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '2px solid #f59e0b',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <p style={{ 
              color: '#92400e', 
              margin: '0 0 12px 0', 
              fontWeight: '600',
              fontSize: '14px'
            }}>
              🔑 Your Reset Code:
            </p>
            <p style={{ 
              fontSize: '36px', 
              fontWeight: '800', 
              color: '#78350f',
              letterSpacing: '12px',
              margin: '0',
              fontFamily: 'monospace'
            }}>
              {resetCode}
            </p>
            <p style={{ 
              color: '#b45309', 
              fontSize: '12px', 
              marginTop: '12px',
              margin: 0
            }}>
              ⚠️ Copy this code before redirecting
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <i className="fas fa-envelope"></i> Registered Email Address
            </label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="email"
              style={{ 
                padding: '14px 16px',
                fontSize: '15px'
              }}
            />
          </div>

          {/* Resend Section */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '8px',
            padding: '12px',
            background: '#f9fafb',
            borderRadius: '10px'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '0 0 8px 0'
            }}>
              {countdown > 0 ? (
                <>
                  Next code available in:{' '}
                  <strong style={{ color: countdown < 30 ? '#ef4444' : '#10b981' }}>
                    {countdown}s
                  </strong>
                </>
              ) : (
                "Didn't receive a code?"
              )}
            </p>
            <button 
              type="button" 
              onClick={handleResendCode}
              disabled={!canResend || isLoading}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: canResend && !isLoading ? '#667eea' : '#9ca3af',
                cursor: canResend && !isLoading ? 'pointer' : 'not-allowed',
                textDecoration: 'underline',
                fontSize: '14px',
                fontWeight: canResend ? '600' : '400',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (canResend && !isLoading) {
                  e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'none';
              }}
            >
              {canResend && !isLoading 
                ? '🔄 Resend Code' 
                : isLoading 
                  ? 'Sending...' 
                  : `Wait ${countdown}s`}
            </button>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading || !email}
            style={{ 
              opacity: (isLoading || !email) ? 0.7 : 1,
              cursor: (isLoading || !email) ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i> Sending Code...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Send Reset Code
              </>
            )}
          </button>
        </form>

        <p className="auth-link">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>

        {/* Test Accounts Helper */}
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
            <i className="fas fa-info-circle"></i> Test Accounts:
          </p>
          <div style={{ color: '#075985', fontSize: '12px', lineHeight: '1.8' }}>
            <p>📧 test@gmail.com</p>
            <p>📧 test@yahoo.com</p>
            <p>📧 test@outlook.com</p>
            <p>📧 teacher@test.com</p>
            <p style={{ marginTop: '8px', color: '#0369a1' }}>
              🔑 Password: password123
            </p>
          </div>
          <p style={{ margin: '12px 0 0 0', color: '#0369a1', fontSize: '12px' }}>
            💡 Run: node create-test-users.js to create these accounts
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;