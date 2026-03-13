import { useState, useEffect } from 'react';

const PaymentConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  course, 
  userBalance,
  isLoading 
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const remainingBalance = userBalance - (course?.price || 0);
  const canAfford = userBalance >= (course?.price || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            <i className="fas fa-shopping-cart" style={{ 
              fontSize: '32px', 
              color: 'white' 
            }}></i>
          </div>
          <h2 style={{ 
            margin: '0 0 10px', 
            color: '#1f2937',
            fontSize: '28px'
          }}>
            Confirm Enrollment
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Review your payment details
          </p>
        </div>

        {/* Course Details */}
        {course && (
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              margin: '0 0 12px', 
              color: '#1f2937',
              fontSize: '18px'
            }}>
              {course.title}
            </h3>
            <p style={{ 
              margin: '0 0 16px', 
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {course.description?.substring(0, 100)}...
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '2px dashed #e5e7eb'
            }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                <i className="fas fa-tag"></i> Course Price
              </span>
              <span style={{ 
                color: '#667eea', 
                fontSize: '24px', 
                fontWeight: '700' 
              }}>
                ${course.price.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div style={{
          background: canAfford ? '#f0fdf4' : '#fef3c7',
          border: `2px solid ${canAfford ? '#10b981' : '#f59e0b'}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ color: '#6b7280' }}>Current Balance:</span>
            <span style={{ 
              fontWeight: '600', 
              color: canAfford ? '#10b981' : '#f59e0b' 
            }}>
              ${userBalance.toFixed(2)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '2px dashed #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>Payment Amount:</span>
            <span style={{ 
              fontWeight: '600', 
              color: '#ef4444' 
            }}>
              -${course?.price.toFixed(2)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ 
              fontWeight: '700', 
              color: '#1f2937',
              fontSize: '16px'
            }}>
              Remaining Balance:
            </span>
            <span style={{ 
              fontWeight: '700', 
              color: canAfford ? '#10b981' : '#ef4444',
              fontSize: '20px'
            }}>
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Warning if insufficient funds */}
        {!canAfford && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ 
              color: '#ef4444', 
              fontSize: '24px' 
            }}></i>
            <div>
              <p style={{ 
                margin: 0, 
                color: '#dc2626', 
                fontWeight: '600' 
              }}>
                Insufficient Funds
              </p>
              <p style={{ 
                margin: '4px 0 0', 
                color: '#dc2626', 
                fontSize: '14px' 
              }}>
                You need ${Math.abs(remainingBalance).toFixed(2)} more to enroll
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '14px 24px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              background: 'white',
              color: '#374151',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <i className="fas fa-times"></i> Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !canAfford}
            style={{
              flex: 1,
              padding: '14px 24px',
              border: 'none',
              borderRadius: '10px',
              background: canAfford 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#d1d5db',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (isLoading || !canAfford) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !canAfford) ? 0.7 : 1,
              transition: 'all 0.3s ease',
              boxShadow: canAfford ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && canAfford) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = canAfford ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none';
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> Confirm Payment
              </>
            )}
          </button>
        </div>

        {/* Auto-close countdown */}
        <p style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#9ca3af',
          fontSize: '13px',
          margin: '16px 0 0'
        }}>
          This window will close in <strong>{countdown}</strong> seconds
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentConfirmation;