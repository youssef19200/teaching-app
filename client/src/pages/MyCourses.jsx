import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './DashboardStyles.css';

const MyCourses = () => {
  const { user, logout } = useContext(AuthContext);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/enrollments/student/${user.id}`);
      setEnrolledCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch enrolled courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartLearning = (courseId) => {
    navigate(`/course/${courseId}`);
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
            <h1 className="logo-text">My Courses</h1>
          </div>
          
          <div className="header-actions">
            <Link to="/dashboard" className="create-course-btn">
              <i className="fas fa-home"></i> Dashboard
            </Link>
            
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <span>{user.username}</span>
            </div>
            
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2 className="welcome-title">My Enrolled Courses 📚</h2>
          <p className="welcome-subtitle">
            You are enrolled in <strong>{enrolledCourses.length}</strong> courses
          </p>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <i className="fas fa-circle-notch fa-spin"></i>
            <h3>Loading your courses...</h3>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-book-open"></i>
            <h3>No enrolled courses yet</h3>
            <p>Browse available courses and start learning!</p>
            <Link to="/dashboard" className="btn-primary" style={{ 
              display: 'inline-flex', 
              marginTop: '20px',
              textDecoration: 'none'
            }}>
              <i className="fas fa-search"></i> Browse Courses
            </Link>
          </div>
        ) : (
          <div className="courses-grid">
            {enrolledCourses.map(enrollment => (
              <div key={enrollment._id} className="course-card">
                <div className="course-image">
                  {enrollment.course.thumbnailUrl ? (
                    <img 
                      src={enrollment.course.thumbnailUrl} 
                      alt={enrollment.course.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <i className="fas fa-book"></i>
                  )}
                </div>
                
                <div className="course-content">
                  <h4 className="course-title">{enrollment.course.title}</h4>
                  <p className="course-description">
                    {enrollment.course.description?.length > 100 
                      ? enrollment.course.description.substring(0, 100) + '...' 
                      : enrollment.course.description}
                  </p>
                  
                  <div className="course-meta">
                    <div className="course-teacher">
                      <i className="fas fa-user"></i>
                      <span>{enrollment.course.teacher?.username || 'Unknown'}</span>
                    </div>
                    <div className="course-price">
                      <i className="fas fa-check-circle"></i>
                      <span>Enrolled</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    marginTop: '12px',
                    padding: '8px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <i className="fas fa-calendar"></i> Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </div>
                  
                  <button 
                    className="enroll-btn" 
                    style={{ background: '#10b981' }}
                    onClick={() => handleStartLearning(enrollment.course._id)}
                  >
                    <i className="fas fa-play"></i> Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCourses;