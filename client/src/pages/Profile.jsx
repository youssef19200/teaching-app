import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ProfileStyles.css';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Message state
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Teacher courses state
  const [teacherCourses, setTeacherCourses] = useState([]);
  
  // Edit course state
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    thumbnailUrl: '',
    videoUrl: ''
  });
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check for tab parameter from navigation
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || ''
      });
      
      // Fetch teacher's courses if user is teacher
      if (user.role === 'teacher') {
        fetchTeacherCourses();
      }
    }
  }, [user]);

  // Fetch teacher's courses
  const fetchTeacherCourses = async () => {
    try {
      const res = await axios.get(`/api/courses/teacher/${user.id}`);
      setTeacherCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.put(`/api/profile/${user.id}`, formData);
      setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
      setIsEditing(false);
      
      // Update context with new user data
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '❌ New passwords do not match' });
      setIsLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '❌ Password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }
    
    try {
      await axios.put(`/api/profile/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: '✅ Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update password';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit profile
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      role: user.role || ''
    });
    setMessage({ type: '', text: '' });
  };

  // Edit course
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description,
      price: course.price.toString(),
      thumbnailUrl: course.thumbnailUrl || '',
      videoUrl: course.videoUrl || ''
    });
    setActiveTab('edit-course');
  };

  // Save edited course
  const handleSaveEditedCourse = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await axios.put(`/api/courses/${editingCourse._id}`, editFormData);
      setMessage({ type: 'success', text: '✅ Course updated successfully!' });
      setEditingCourse(null);
      fetchTeacherCourses();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        setActiveTab('courses');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update course';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit course
  const handleCancelEditCourse = () => {
    setEditingCourse(null);
    setActiveTab('courses');
  };

  // Delete course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/courses/${courseId}`);
      setMessage({ type: 'success', text: '✅ Course deleted successfully!' });
      fetchTeacherCourses();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Failed to delete course' });
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate teacher stats
  const totalStudents = teacherCourses.reduce((sum, course) => 
    sum + (course.students?.length || 0), 0
  );
  
  const totalEarnings = teacherCourses.reduce((sum, course) => 
    sum + (course.totalEarnings || 0), 0
  );

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <Link to="/dashboard" className="back-link">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <h2>My Profile</h2>
          <p>Manage your account settings and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          {/* Banner */}
          <div className="profile-banner">
            <div className="profile-avatar-large">
              <i className="fas fa-user"></i>
            </div>
          </div>

          {/* Content */}
          <div className="profile-content">
            {/* Profile Info */}
            <div className="profile-info">
              <h3 className="profile-name">{formData.username}</h3>
              <p className="profile-email">
                <i className="fas fa-envelope"></i> {formData.email}
              </p>
              <span className={`profile-role-badge ${formData.role}`}>
                <i className={`fas fa-${formData.role === 'teacher' ? 'chalkboard-teacher' : 'user-graduate'}`}></i>
                {formData.role === 'teacher' ? 'Teacher' : 'Student'}
              </span>
            </div>

            {/* Messages */}
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

            {/* Tabs */}
            <div className="profile-tabs">
              <button 
                className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-user"></i> Overview
              </button>
              <button 
                className={`profile-tab ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                <i className="fas fa-edit"></i> Edit Profile
              </button>
              <button 
                className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <i className="fas fa-lock"></i> Change Password
              </button>
              {user.role === 'teacher' && (
                <>
                  <button 
                    className={`profile-tab ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                  >
                    <i className="fas fa-book"></i> My Courses ({teacherCourses.length})
                  </button>
                  <button 
                    className={`profile-tab ${activeTab === 'edit-course' ? 'active' : ''}`}
                    onClick={() => setActiveTab('edit-course')}
                    style={{ display: editingCourse ? 'block' : 'none' }}
                  >
                    <i className="fas fa-edit"></i> Edit Course
                  </button>
                </>
              )}
            </div>

            {/* Overview Tab */}
            <div className={`profile-section ${activeTab === 'overview' ? 'active' : ''}`}>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Username</div>
                  <div className="info-value">
                    <i className="fas fa-user"></i>
                    {formData.username}
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Email Address</div>
                  <div className="info-value">
                    <i className="fas fa-envelope"></i>
                    {formData.email}
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Account Type</div>
                  <div className="info-value">
                    <i className="fas fa-id-badge"></i>
                    {formData.role === 'teacher' ? 'Teacher Account' : 'Student Account'}
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Member Since</div>
                  <div className="info-value">
                    <i className="fas fa-calendar"></i>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>

              {user.role === 'teacher' && (
                <div className="teacher-stats">
                  <div className="teacher-stat-card">
                    <i className="fas fa-book"></i>
                    <div className="stat-number">{teacherCourses.length}</div>
                    <div className="stat-label">Courses Created</div>
                  </div>
                  <div className="teacher-stat-card">
                    <i className="fas fa-users"></i>
                    <div className="stat-number">{totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                  <div className="teacher-stat-card">
                    <i className="fas fa-dollar-sign"></i>
                    <div className="stat-number">${totalEarnings.toFixed(2)}</div>
                    <div className="stat-label">Total Earnings</div>
                  </div>
                </div>
              )}

              <div className="action-buttons">
                <button className="btn-primary" onClick={() => setActiveTab('edit')}>
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                  <i className="fas fa-home"></i> Go to Dashboard
                </button>
              </div>
            </div>

            {/* Edit Profile Tab */}
            <div className={`profile-section ${activeTab === 'edit' ? 'active' : ''}`}>
              <form onSubmit={handleUpdateProfile} className="edit-form">
                <div className="form-section">
                  <h4><i className="fas fa-user-edit"></i> Update Information</h4>
                  
                  <div className="form-group">
                    <label>
                      <i className="fas fa-user"></i> Username
                    </label>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                      required
                      minLength="3"
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                      Your username must be at least 3 characters
                    </small>
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-envelope"></i> Email Address
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                      required
                    />
                  </div>

                  {user.role === 'teacher' && (
                    <div className="form-group">
                      <label>
                        <i className="fas fa-id-badge"></i> Account Type
                      </label>
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                      >
                        <option value="teacher">👨‍🏫 Teacher</option>
                        <option value="student">🎓 Student</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  {!isEditing ? (
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={() => setIsEditing(true)}
                      disabled={isLoading}
                    >
                      <i className="fas fa-edit"></i> Start Editing
                    </button>
                  ) : (
                    <>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isLoading}
                        style={{ 
                          opacity: isLoading ? 0.7 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-circle-notch fa-spin"></i> Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i> Save Changes
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            {/* Change Password Tab */}
            <div className={`profile-section ${activeTab === 'password' ? 'active' : ''}`}>
              <form onSubmit={handleUpdatePassword} className="edit-form">
                <div className="form-section">
                  <h4><i className="fas fa-lock"></i> Change Password</h4>
                  
                  <div className="form-group">
                    <label>
                      <i className="fas fa-key"></i> Current Password
                    </label>
                    <input 
                      type="password" 
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-lock"></i> New Password
                    </label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength="6"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="fas fa-lock"></i> Confirm New Password
                    </label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    type="submit" 
                    className="btn-danger"
                    disabled={isLoading}
                    style={{ 
                      opacity: isLoading ? 0.7 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shield-alt"></i> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* My Courses Tab (Teachers Only) */}
            {user.role === 'teacher' && (
              <div className={`profile-section ${activeTab === 'courses' ? 'active' : ''}`}>
                <div className="form-section">
                  <h4><i className="fas fa-book"></i> Your Courses</h4>
                  
                  {teacherCourses.length === 0 ? (
                    <div className="empty-state" style={{ background: '#f9fafb', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                      <i className="fas fa-book-open" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                      <h5 style={{ color: '#1f2937', marginBottom: '8px' }}>No courses yet</h5>
                      <p style={{ color: '#6b7280', marginBottom: '16px' }}>Create your first course to start teaching!</p>
                      <Link to="/create-course" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                        <i className="fas fa-plus"></i> Create Course
                      </Link>
                    </div>
                  ) : (
                    <div className="course-list">
                      {teacherCourses.map(course => (
                        <div key={course._id} className="course-item">
                          <div className="course-item-info">
                            <h5>{course.title}</h5>
                            <p>
                              <i className="fas fa-dollar-sign"></i> {course.price} | 
                              <i className="fas fa-users" style={{ marginLeft: '12px' }}></i> {course.students?.length || 0} students |
                              <i className="fas fa-calendar" style={{ marginLeft: '12px' }}></i> {new Date(course.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="course-item-actions">
                            <button 
                              className="btn-small btn-small-edit"
                              onClick={() => handleEditCourse(course)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="btn-small btn-small-delete"
                              onClick={() => handleDeleteCourse(course._id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  <Link to="/create-course" className="btn-primary" style={{ textDecoration: 'none' }}>
                    <i className="fas fa-plus"></i> Create New Course
                  </Link>
                </div>
              </div>
            )}

            {/* Edit Course Tab (Teachers Only) */}
            {user.role === 'teacher' && editingCourse && (
              <div className={`profile-section ${activeTab === 'edit-course' ? 'active' : ''}`}>
                <div className="form-section">
                  <h4><i className="fas fa-edit"></i> Edit Course</h4>
                  
                  <form onSubmit={handleSaveEditedCourse} className="edit-form">
                    <div className="form-group">
                      <label>
                        <i className="fas fa-book"></i> Course Title
                      </label>
                      <input 
                        type="text" 
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="fas fa-align-left"></i> Description
                      </label>
                      <textarea 
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        required
                        disabled={isLoading}
                        style={{ minHeight: '100px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="fas fa-dollar-sign"></i> Price
                      </label>
                      <input 
                        type="number" 
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                        required
                        min="0"
                        step="0.01"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="fas fa-image"></i> Thumbnail URL
                      </label>
                      <input 
                        type="url" 
                        value={editFormData.thumbnailUrl}
                        onChange={(e) => setEditFormData({...editFormData, thumbnailUrl: e.target.value})}
                        disabled={isLoading}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="fas fa-video"></i> Video URL
                      </label>
                      <input 
                        type="url" 
                        value={editFormData.videoUrl}
                        onChange={(e) => setEditFormData({...editFormData, videoUrl: e.target.value})}
                        disabled={isLoading}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>

                    <div className="action-buttons">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isLoading}
                        style={{ 
                          opacity: isLoading ? 0.7 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-circle-notch fa-spin"></i> Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i> Save Changes
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={handleCancelEditCourse}
                        disabled={isLoading}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;