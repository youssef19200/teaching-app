import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './CreateCourseStyles.css';

const CreateCourse = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    thumbnailUrl: '',
    videoUrl: ''
  });
  
  // File states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file (JPG, PNG, GIF)');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image must be less than 5MB');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }
      
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setErrorMessage('Please select a video file (MP4, WebM, AVI)');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Video must be less than 10MB');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file, type) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    const response = await axios.post('/api/upload', formDataUpload, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }
    });
    
    return response.data.fileUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadProgress(0);
    setShowError(false);
    setShowSuccess(false);

    try {
      let thumbnailUrl = formData.thumbnailUrl;
      let videoUrl = formData.videoUrl;

      // Upload thumbnail if file selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'image');
      }

      // Upload video if file selected
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'video');
      }

      // Create course
      await axios.post('/api/courses', {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        thumbnailUrl,
        videoUrl,
        teacherId: user.id
      });

      // Show success screen
      setShowSuccess(true);
      
      // Clear form
      setFormData({ title: '', description: '', price: '', thumbnailUrl: '', videoUrl: '' });
      setThumbnailFile(null);
      setVideoFile(null);
      setThumbnailPreview('');
      setVideoPreview('');

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/profile', { state: { tab: 'courses' } });
      }, 3000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create course. Please try again.';
      setErrorMessage(errorMsg);
      setShowError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="create-course-page">
        <div className="create-course-container">
          <div className="form-card">
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div className="icon-wrapper" style={{ 
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                width: '100px',
                height: '100px'
              }}>
                <i className="fas fa-check" style={{ fontSize: '48px' }}></i>
              </div>
              <h2 style={{ color: '#10b981', marginBottom: '12px', fontSize: '32px' }}>Course Published!</h2>
              <p style={{ color: '#059669', fontSize: '18px', marginBottom: '24px' }}>
                🎉 Your course has been successfully created
              </p>
              <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                Redirecting to your courses...
              </p>
              <div style={{ 
                height: '6px', 
                background: '#e5e7eb',
                borderRadius: '3px',
                overflow: 'hidden',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  animation: 'progressBar 3s linear',
                  borderRadius: '3px'
                }}></div>
              </div>
              <Link to="/profile" className="btn-primary" style={{ 
                marginTop: '32px', 
                display: 'inline-flex',
                textDecoration: 'none'
              }}>
                <i className="fas fa-arrow-right"></i> Go to My Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is teacher
  if (user.role !== 'teacher') {
    return (
      <div className="create-course-page">
        <div className="create-course-container">
          <div className="form-card">
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div className="icon-wrapper" style={{ 
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: '100px',
                height: '100px'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px' }}></i>
              </div>
              <h2 style={{ color: '#dc2626', marginBottom: '12px', fontSize: '32px' }}>Access Denied</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Only teachers can create courses
              </p>
              <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                <i className="fas fa-home"></i> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        <Link to="/profile" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Profile
        </Link>

        <div className="create-course-header">
          <h2>Create New Course</h2>
          <p>Fill in the details and upload media to publish your course</p>
        </div>

        <div className="form-card">
          {/* Error Message */}
          {showError && (
            <div className="error-message-box" style={{ marginBottom: '24px' }}>
              <i className="fas fa-exclamation-circle"></i>
              <span>{errorMessage}</span>
              <button onClick={() => setShowError(false)} className="close-error-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div style={{ 
              background: '#f0f9ff', 
              padding: '16px', 
              borderRadius: '10px', 
              marginBottom: '24px',
              border: '1px solid #bae6fd'
            }}>
              <p style={{ color: '#0369a1', marginBottom: '8px', fontSize: '14px' }}>
                <i className="fas fa-upload"></i> Uploading files... {uploadProgress}%
              </p>
              <div style={{ 
                height: '6px', 
                background: '#e5e7eb',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-info-circle"></i> Course Information
              </h3>
              
              <div className="form-group">
                <label>
                  <i className="fas fa-book"></i> Course Title *
                </label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="e.g., Complete Web Development Bootcamp"
                  value={formData.title}
                  onChange={handleInputChange}
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-align-left"></i> Description *
                </label>
                <textarea 
                  name="description"
                  placeholder="Describe what students will learn in this course..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required 
                  disabled={isLoading}
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-dollar-sign"></i> Pricing
              </h3>
              
              <div className="form-group">
                <label>
                  <i className="fas fa-tag"></i> Price (USD) *
                </label>
                <input 
                  type="number" 
                  name="price"
                  placeholder="0.00" 
                  min="0"
                  max="999.99"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required 
                  disabled={isLoading}
                />
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Set your course price. Use 0 for free courses.
                </small>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-image"></i> Course Cover Image
              </h3>
              
              <div className="form-group">
                <label>
                  <i className="fas fa-upload"></i> Upload Cover Image
                </label>
                
                <div style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '10px', 
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <input 
                    type="file" 
                    name="thumbnail"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" style={{ cursor: 'pointer' }}>
                    {thumbnailPreview ? (
                      <div>
                        <img 
                          src={thumbnailPreview} 
                          alt="Preview" 
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', marginBottom: '12px' }}
                        />
                        <p style={{ color: '#10b981' }}>
                          <i className="fas fa-check-circle"></i> Image selected
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '48px', color: '#667eea', marginBottom: '12px' }}></i>
                        <p style={{ color: '#374151', fontWeight: '600' }}>Click to upload cover image</p>
                        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
                          JPG, PNG, GIF (Max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  This image will be displayed as the course cover
                </small>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-video"></i> Course Video (Optional)
              </h3>
              
              <div className="form-group">
                <label>
                  <i className="fas fa-upload"></i> Upload Video
                </label>
                
                <div style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '10px', 
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <input 
                    type="file" 
                    name="video"
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" style={{ cursor: 'pointer' }}>
                    {videoPreview ? (
                      <div>
                        <video 
                          src={videoPreview} 
                          controls 
                          style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px', marginBottom: '12px' }}
                        />
                        <p style={{ color: '#10b981' }}>
                          <i className="fas fa-check-circle"></i> Video selected
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-video" style={{ fontSize: '48px', color: '#667eea', marginBottom: '12px' }}></i>
                        <p style={{ color: '#374151', fontWeight: '600' }}>Click to upload video</p>
                        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
                          MP4, WebM, AVI (Max 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  Or paste a YouTube/Vimeo URL below instead
                </small>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>
                  <i className="fas fa-link"></i> Video URL (Alternative)
                </label>
                <input 
                  type="url" 
                  name="videoUrl"
                  placeholder="https://youtube.com/watch?v=..." 
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  disabled={isLoading || videoFile !== null}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
              style={{ 
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '32px'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Publishing Course...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Publish Course
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;