import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AuthStyles.css';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // التأكد من وجود الإيميل
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }
    resetCountdown();
  }, [email, navigate]);

  // المؤقت
  useEffect(() => {
    if (countdown > 0 && !canResend) {
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
  }, [countdown, canResend]);

  const resetCountdown = () => {
    setCountdown(60);
    setCanResend(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // التحقق من الكود
      const res = await axios.post('/api/auth/verify-reset-code', { 
        email, 
        code 
      });
      
      setMessage({ type: 'success', text: '✅ تم التحقق بنجاح! جاري التوجيه...' });
      
      // ✅ مهم جداً: نرسل الإيميل والكود معاً للصفحة التالية
      setTimeout(() => {
        navigate('/reset-password', { 
          state: { 
            email: email,
            code: code  // ← هذا هو المهم!
          } 
        });
      }, 1500);
      
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'الكود غير صحيح أو منتهي الصلاحية' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      
      setMessage({ 
        type: 'success', 
        text: res.data.debugCode 
          ? `✅ الكود الجديد: ${res.data.debugCode}` 
          : '✅ تم إرسال كود جديد!' 
      });
      
      resetCountdown();
      
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل في إعادة إرسال الكود' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h2>التحقق من الكود</h2>
          <p>أدخل الكود المكون من 6 أرقام المرسل إلى بريدك</p>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> الكود
            </label>
            <input 
              type="text" 
              placeholder="123456" 
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
              required 
              disabled={isLoading}
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              autoFocus
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              الكود ينتهي خلال:{' '}
              <strong style={{ color: countdown < 30 ? '#ef4444' : '#10b981' }}>
                {countdown} ثانية
              </strong>
            </p>
            <button 
              type="button" 
              onClick={handleResendCode}
              disabled={!canResend || isLoading}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: canResend ? '#667eea' : '#9ca3af',
                cursor: canResend ? 'pointer' : 'not-allowed',
                textDecoration: 'underline',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {canResend ? '🔄 إعادة إرسال الكود' : `انتظر ${countdown}ث لإعادة الإرسال`}
            </button>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading || code.length !== 6}
            style={{ 
              opacity: (isLoading || code.length !== 6) ? 0.7 : 1,
              cursor: (isLoading || code.length !== 6) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i> جاري التحقق...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> تحقق من الكود
              </>
            )}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/forgot-password">← العودة لصفحة نسيت كلمة المرور</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyCode;