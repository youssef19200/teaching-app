import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PaymentConfirmation from '../components/PaymentConfirmation';
import './DashboardStyles.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [teacherEarnings, setTeacherEarnings] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const navigate = useNavigate();

  // Fetch all data on mount or user change
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all available courses
        const coursesRes = await axios.get('/api/courses');
        setCourses(coursesRes.data);
        
        // Fetch user balance and role
        const balanceRes = await axios.get(`/api/user/${user.id}/balance`);
        setUserBalance(balanceRes.data.balance);
        
        // If teacher, fetch earnings
        if (balanceRes.data.role === 'teacher') {
          const earningsRes = await axios.get(`/api/enrollments/teacher/${user.id}`);
          setTeacherEarnings(earningsRes.data.totalEarnings);
        }
        
        // Fetch enrolled courses if student
        if (balanceRes.data.role === 'student') {
          const enrolledRes = await axios.get(`/api/enrollments/student/${user.id}`);
          setEnrolledCourses(enrolledRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setMessage({ 
          type: 'error', 
          text: '❌ Failed to load data. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle enrollment click - show professional modal
  const handleEnroll = (course) => {
    if (!user?.id) {
      setMessage({ type: 'error', text: '❌ Please login first' });
      return;
    }
    
    setSelectedCourse(course);
    setShowPaymentModal(true);
  };

  // Handle confirmed enrollment from modal
  const handleConfirmEnrollment = async () => {
    if (!selectedCourse || !user?.id) return;

    // Close modal and start processing
    setShowPaymentModal(false);
    setEnrollingId(selectedCourse._id);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(`/api/courses/${selectedCourse._id}/enroll`, {
        userId: user.id
      });

      // Show success message
      setMessage({ 
        type: 'success', 
        text: `✅ Successfully enrolled in "${selectedCourse.title}"! Remaining balance: $${res.data.enrollment.remainingBalance.toFixed(2)}` 
      });

      // Update local state
      setUserBalance(res.data.enrollment.remainingBalance);
      
      // Refresh all data
      const coursesRes = await axios.get('/api/courses');
      setCourses(coursesRes.data);
      
      const enrolledRes = await axios.get(`/api/enrollments/student/${user.id}`);
      setEnrolledCourses(enrolledRes.data);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to enroll';
      
      if (err.response?.data?.message === 'Insufficient balance') {
        setMessage({ 
          type: 'error', 
          text: `❌ Insufficient balance! You need $${err.response.data.deficit.toFixed(2)} more.` 
        });
      } else {
        setMessage({ type: 'error', text: `❌ ${errorMsg}` });
      }

      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setEnrollingId(null);
      setSelectedCourse(null);
    }
  };

  // Close modal without enrolling
  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedCourse(null);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigate to my courses page
  const handleGoToMyCourses = () => {
    navigate('/my-courses');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h1 className="logo-text">TeachingApp</h1>
          </div>
          
          <div className="header-actions">
            {/* Balance Display - Only for Students */}
            {user?.role === 'student' && (
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '10px 20px', 
                borderRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white',
                fontWeight: '600',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <i className="fas fa-wallet"></i>
                <span>${userBalance.toFixed(2)}</span>
              </div>
            )}

            {user?.role === 'teacher' && (
              <Link to="/create-course" className="create-course-btn">
                <i className="fas fa-plus"></i> Create Course
              </Link>
            )}
            
            <Link to="/profile" className="create-course-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <i className="fas fa-user"></i> Profile
            </Link>
            
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <span>{user?.username}</span>
            </div>
            
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2 className="welcome-title">Welcome back, {user?.username}! 👋</h2>
          <p className="welcome-subtitle">
            Role: <span className="badge">{user?.role}</span>
            {user?.role === 'student' && (
              <span className="badge" style={{ marginLeft: '10px', background: '#10b981' }}>
                <i className="fas fa-dollar-sign"></i> ${userBalance.toFixed(2)}
              </span>
            )}
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message message-${message.type}`} style={{
            padding: '16px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>Total Courses</h3>
                <p className="stat-number">{courses.length}</p>
              </div>
              <div className="stat-icon">
                <i className="fas fa-book"></i>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>Enrolled</h3>
                <p className="stat-number">{enrolledCourses.length}</p>
              </div>
              <div className="stat-icon">
                <i className="fas fa-user-graduate"></i>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{user?.role === 'student' ? 'Balance' : 'Earnings'}</h3>
                <p className="stat-number">
                  ${user?.role === 'student' ? userBalance.toFixed(2) : teacherEarnings.toFixed(2)}
                </p>
              </div>
              <div className="stat-icon">
                <i className={`fas fa-${user?.role === 'student' ? 'wallet' : 'chart-line'}`}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="courses-section">
          <h3 className="section-title">
            <i className="fas fa-graduation-cap"></i> Available Courses
          </h3>
          
          {isLoading ? (
            <div className="empty-state">
              <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
              <h3>Loading courses...</h3>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>Please wait while we fetch the latest courses</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-book-open"></i>
              <h3>No courses available yet</h3>
              <p>Check back soon for new content!</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(course => {
                const isEnrolled = enrolledCourses.some(e => e.course?._id === course._id);
                const canAfford = userBalance >= course.price;
                const isTeacher = user?.role === 'teacher';
                
                return (
                  <div key={course._id} className="course-card">
                    {/* Course Cover Image */}
                    <div className="course-image">
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '16px 16px 0 0'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<i className="fas fa-book"></i>';
                          }}
                          onLoad={(e) => {
                            e.target.style.opacity = '1';
                          }}
                        />
                      ) : (
                        <i className="fas fa-book"></i>
                      )}
                    </div>
                    
                    <div className="course-content">
                      <h4 className="course-title">{course.title}</h4>
                      <p className="course-description">
                        {course.description?.length > 100 
                          ? course.description.substring(0, 100) + '...' 
                          : course.description}
                      </p>
                      
                      <div className="course-meta">
                        <div className="course-teacher">
                          <i className="fas fa-user"></i>
                          <span>{course.teacher?.username || 'Unknown'}</span>
                        </div>
                        <div className="course-price">
                          <i className="fas fa-dollar-sign"></i>
                          <span>{course.price?.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      {isEnrolled ? (
                        <button 
                          className="enroll-btn"
                          style={{ 
                            background: '#10b981',
                            cursor: 'pointer'
                          }}
                          onClick={handleGoToMyCourses}
                        >
                          <i className="fas fa-check"></i> Enrolled - Start Learning
                        </button>
                      ) : isTeacher ? (
                        <button 
                          className="enroll-btn"
                          style={{ 
                            background: '#6b7280',
                            cursor: 'not-allowed'
                          }}
                          disabled
                        >
                          <i className="fas fa-user-tie"></i> Your Course
                        </button>
                      ) : (
                        <button 
                          className="enroll-btn"
                          onClick={() => handleEnroll(course)}
                          disabled={enrollingId === course._id || !canAfford}
                          style={{
                            opacity: (enrollingId === course._id || !canAfford) ? 0.6 : 1,
                            cursor: (enrollingId === course._id || !canAfford) ? 'not-allowed' : 'pointer',
                            background: !canAfford ? '#9ca3af' : undefined
                          }}
                        >
                          {enrollingId === course._id ? (
                            <>
                              <i className="fas fa-circle-notch fa-spin"></i> Processing...
                            </>
                          ) : !canAfford ? (
                            <>
                              <i className="fas fa-exclamation-triangle"></i> Need ${((course.price || 0) - userBalance).toFixed(2)} More
                            </>
                          ) : (
                            <>
                              <i className="fas fa-shopping-cart"></i> Enroll Now - ${course.price?.toFixed(2)}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmation
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmEnrollment}
        course={selectedCourse}
        userBalance={userBalance}
        isLoading={enrollingId === selectedCourse?._id}
      />
    </div>
  );
};

export default Dashboard;