import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CourseViewStyles.css';

const CourseView = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login', { state: { from: `/course/${id}` } });
      return;
    }
    
    fetchCourseData();
  }, [id, user, navigate]);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch course details
      const courseRes = await axios.get(`/api/courses/${id}`);
      setCourse(courseRes.data);
      
      // Check if user is enrolled OR is the teacher
      if (user?.id) {
        // Check if user is the teacher
        if (courseRes.data.teacher?._id === user.id) {
          setIsEnrolled(true);
        } else {
          // Check enrollment
          const enrolledRes = await axios.get(`/api/enrollments/student/${user.id}`);
          const enrolled = enrolledRes.data.some(
            e => e.course?._id === id || e.course === id
          );
          setIsEnrolled(enrolled);
        }
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="course-view-container">
        <div className="loading-state">
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '48px', color: '#667eea' }}></i>
          <h3>Loading course content...</h3>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-view-container">
        <div className="error-state">
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ef4444' }}></i>
          <h3>Course not found</h3>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="course-view-container">
        <div className="locked-state">
          <div className="lock-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2>This Course is Locked 🔒</h2>
          <p>You need to enroll in this course to access the content</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-shopping-cart"></i> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-view-container">
      {/* Header */}
      <header className="course-view-header">
        <div className="header-content">
          <Link to="/my-courses" className="back-btn">
            <i className="fas fa-arrow-left"></i> Back to My Courses
          </Link>
          <div className="user-info">
            <span>{user?.username}</span>
            <span className="badge">{user?.role}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="course-view-main">
        {/* Video Section */}
        <div className="video-section">
          {course.videoUrl ? (
            <div className="video-player">
              {course.videoUrl.includes('youtube.com') || course.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(course.videoUrl)}`}
                  title={course.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : course.videoUrl.includes('vimeo.com') ? (
                <iframe
                  src={`https://player.vimeo.com/video/${getVimeoId(course.videoUrl)}`}
                  title={course.title}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video controls width="100%" style={{ borderRadius: '12px' }}>
                  <source src={course.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="no-video">
              <i className="fas fa-video-slash"></i>
              <h3>No Video Available Yet</h3>
              <p>The instructor hasn't uploaded a video for this course yet.</p>
            </div>
          )}
        </div>

        {/* Course Info Section */}
        <div className="course-info-section">
          <div className="course-info-card">
            <h1 className="course-title">{course.title}</h1>
            
            <div className="course-meta">
              <div className="instructor">
                <i className="fas fa-user-tie"></i>
                <span>Instructor: {course.teacher?.username || 'Unknown'}</span>
              </div>
            </div>

            <div className="course-description">
              <h3><i className="fas fa-book-open"></i> Course Description</h3>
              <p>{course.description}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper function to extract YouTube video ID
function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to extract Vimeo video ID
function getVimeoId(url) {
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+\/)?video\/|video\/|)(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default CourseView;