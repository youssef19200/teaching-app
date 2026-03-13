import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AuthStyles.css';

const ResetPassword = () => {
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // استقبال البيانات من VerifyCode
  const email = location.state?.email;
  const code = location.state?.code;

  // التحقق من وجود البيانات
  useEffect(() => {
    if (!email || !code) {
      setMessage({ 
        type: 'error', 
        text: '❌ البيانات غير مكتملة. يرجى البدء من جديد.' 
      });
      setTimeout(() => {
        navigate('/forgot-password');
      }, 3000);
    }
  }, [email, code, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // التحقق من تطابق كلمات المرور
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '❌ كلمات المرور غير متطابقة' });
      setIsLoading(false);
      return;
    }

    // التحقق من طول كلمة المرور
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📤 Sending reset request:', { email, code, newPassword: '***' });
      
      const response = await axios.post('/api/auth/reset-password', {
        email,
        code,
        newPassword: passwordData.newPassword
      });

      console.log('✅ Reset successful:', response.data);
      
      setIsSuccess(true);
      setMessage({ type: 'success', text: '✅ تم تغيير كلمة المرور بنجاح!' });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('❌ Reset error:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || 'فشل في إعادة تعيين كلمة المرور';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // شاشة النجاح
  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="icon-wrapper" style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
            }}>
              <i className="fas fa-check" style={{ fontSize: '40px' }}></i>
            </div>
            <h2 style={{ color: '#10b981' }}>تم بنجاح!</h2>
            <p>تم تغيير كلمة المرور بنجاح</p>
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
              ✅ يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
            </p>
          </div>

          <Link to="/login" className="auth-button" style={{ textDecoration: 'none' }}>
            <i className="fas fa-arrow-right"></i> الذهاب للدخول الآن
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
            <i className="fas fa-lock"></i>
          </div>
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>أدخل كلمة مرور جديدة لحسابك</p>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ 
            background: '#f0f9ff', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #bae6fd',
            fontSize: '14px',
            color: '#0369a1'
          }}>
            <i className="fas fa-envelope"></i> البريد الإلكتروني: <strong>{email}</strong>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> كلمة المرور الجديدة
            </label>
            <input 
              type="password" 
              name="newPassword"
              placeholder="أدخل كلمة مرور جديدة (6 أحرف على الأقل)" 
              value={passwordData.newPassword}
              onChange={handleInputChange}
              required 
              minLength="6"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> تأكيد كلمة المرور
            </label>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="أعد إدخال كلمة المرور" 
              value={passwordData.confirmPassword}
              onChange={handleInputChange}
              required 
              disabled={isLoading}
              autoComplete="new-password"
            />
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
                <i className="fas fa-circle-notch fa-spin"></i> جاري التغيير...
              </>
            ) : (
              <>
                <i className="fas fa-shield-alt"></i> تغيير كلمة المرور
              </>
            )}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/login">← العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;