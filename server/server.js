require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Models
const User = require('./models/User');
const Course = require('./models/Course');
const PasswordReset = require('./models/PasswordReset');
const Enrollment = require('./models/Enrollment');

const app = express();
app.use(express.json());
app.use(cors());

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and videos are allowed'));
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// EMAIL CONFIGURATION
// ============================================

const sendResetEmail = async (email, code) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email credentials not configured');
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    await transporter.verify();
    console.log('✅ Email server connection verified');
    
    const mailOptions = {
      from: `"TeachingApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset Code - TeachingApp',
      text: `Your reset code is: ${code}`,
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto;">
          <h1 style="color: #667eea;">🎓 TeachingApp</h1>
          <p>Your password reset code:</p>
          <h2 style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; color: #667eea;">${code}</h2>
          <p style="color: #6b7280;">⏰ Expires in 10 minutes</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    return false;
  }
};

// ============================================
// DATABASE CONNECTION
// ============================================

console.log('🔄 Connecting to MongoDB...');
console.log('📡 Connection String:', process.env.MONGO_URI?.startsWith('mongodb') ? 'Present ✓' : 'Missing ✗');

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.name);
  })
  .catch((err) => {
    console.log('❌ MongoDB Connection FAILED!');
    console.log('🔍 Error:', err.message);
  });

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// 1. Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    console.log('📝 Registration attempt:', { username, email, role });
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role: role || 'student',
      balance: role === 'student' ? 100.00 : 0.00
    });
    
    await newUser.save();
    
    console.log('✅ User saved to database:', newUser._id);
    
    res.json({ 
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: err.message 
    });
  }
});

// 2. Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Login failed', 
      error: err.message 
    });
  }
});

// ============================================
// PASSWORD RESET ROUTES
// ============================================

// 3. REQUEST Password Reset Code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📧 Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('⚠️ User not found:', email);
      return res.json({ 
        message: 'If this email is registered, a reset code has been sent',
        emailSent: false,
        userExists: false,
        debugCode: process.env.NODE_ENV === 'development' ? 'DEMO-CODE' : undefined
      });
    }
    
    await PasswordReset.deleteMany({ email, isUsed: false });
    
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log(`🔐 Generated reset code for ${email}: ${code}`);
    
    const resetRequest = new PasswordReset({ email, code, expiresAt });
    await resetRequest.save();
    
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      emailSent = await sendResetEmail(email, code);
    }
    
    res.json({ 
      message: 'If this email is registered, a reset code has been sent',
      emailSent: emailSent,
      userExists: true,
      debugCode: process.env.NODE_ENV === 'development' || !emailSent ? code : undefined
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ 
      message: 'Failed to process request',
      error: err.message 
    });
  }
});

// 4. VERIFY Reset Code
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    console.log('🔍 Verifying reset code for:', email);
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }
    
    const resetRequest = await PasswordReset.findOne({ 
      email, 
      code, 
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetRequest) {
      console.log('❌ Invalid or expired code for:', email);
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    
    console.log('✅ Code verified successfully for:', email);
    res.json({ message: 'Code verified successfully', email });
  } catch (err) {
    console.error('❌ Verify code error:', err);
    res.status(500).json({ message: 'Failed to verify code' });
  }
});

// 5. RESET Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    console.log('🔑 Reset password request for:', email);
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const resetRequest = await PasswordReset.findOne({ 
      email, 
      code, 
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetRequest) {
      console.log('❌ Invalid or expired code for password reset:', email);
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found for password reset:', email);
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully for:', email);
    
    resetRequest.isUsed = true;
    await resetRequest.save();
    
    res.json({ 
      message: 'Password reset successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// ============================================
// PROFILE ROUTES
// ============================================

// 6. GET User Profile
app.get('/api/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. UPDATE User Profile
app.put('/api/profile/:id', async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: err.message 
    });
  }
});

// 8. UPDATE Password
app.put('/api/profile/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ 
      message: 'Failed to update password', 
      error: err.message 
    });
  }
});

// ============================================
// FILE UPLOAD ROUTE
// ============================================

// 9. FILE UPLOAD Route
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
    
    res.json({ 
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      message: 'File upload failed', 
      error: err.message 
    });
  }
});

// ============================================
// COURSE ROUTES
// ============================================

// 10. CREATE Course
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, price, thumbnailUrl, videoUrl, teacherId } = req.body;
    
    if (!title || !description || price === undefined || !teacherId) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }
    
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }
    
    const newCourse = new Course({ 
      title, 
      description, 
      price: parseFloat(price),
      thumbnailUrl: thumbnailUrl || '', 
      videoUrl: videoUrl || '', 
      teacher: teacherId 
    });
    
    await newCourse.save();
    
    res.json({ 
      message: 'Course created successfully', 
      course: newCourse 
    });
  } catch (err) {
    console.error('Course creation error:', err);
    res.status(500).json({ 
      message: 'Failed to create course', 
      error: err.message 
    });
  }
});

// 11. GET All Courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'username email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch courses', 
      error: err.message 
    });
  }
});

// 12. GET Teacher's Courses
app.get('/api/courses/teacher/:teacherId', async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.params.teacherId })
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error('Get teacher courses error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch teacher courses', 
      error: err.message 
    });
  }
});

// 13. GET Single Course
app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'username email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch course', 
      error: err.message 
    });
  }
});

// 14. UPDATE Course
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { title, description, price, thumbnailUrl, videoUrl } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (title) course.title = title;
    if (description) course.description = description;
    if (price !== undefined) course.price = parseFloat(price);
    if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl;
    if (videoUrl !== undefined) course.videoUrl = videoUrl;
    
    await course.save();
    
    res.json({ 
      message: 'Course updated successfully', 
      course 
    });
  } catch (err) {
    console.error('Course update error:', err);
    res.status(500).json({ 
      message: 'Failed to update course', 
      error: err.message 
    });
  }
});

// 15. DELETE Course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.thumbnailUrl && course.thumbnailUrl.includes('/uploads/')) {
      const fileName = course.thumbnailUrl.split('/uploads/')[1];
      const filePath = path.join(__dirname, 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Course delete error:', err);
    res.status(500).json({ 
      message: 'Failed to delete course', 
      error: err.message 
    });
  }
});

// ============================================
// ENROLLMENT & PAYMENT ROUTES
// ============================================

// 16. ENROLL in Course (with Payment & Teacher Transfer)
app.post('/api/courses/:id/enroll', async (req, res) => {
  try {
    const { userId } = req.body;
    const courseId = req.params.id;
    
    console.log('📝 Enrollment request:', { userId, courseId });
    
    const student = await User.findById(userId);
    if (!student) {
      console.log('❌ Student not found:', userId);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const course = await Course.findById(courseId).populate('teacher');
    if (!course) {
      console.log('❌ Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log('📊 Course details:', {
      title: course.title,
      price: course.price,
      teacherId: course.teacher?._id,
      teacherName: course.teacher?.username
    });
    
    if (!course.teacher) {
      console.log('❌ Course teacher not found');
      return res.status(404).json({ message: 'Course teacher not found' });
    }
    
    if (student.enrolledCourses && student.enrolledCourses.includes(courseId)) {
      console.log('⚠️ Already enrolled:', userId, courseId);
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    if (student.balance < course.price) {
      console.log('❌ Insufficient balance:', {
        studentBalance: student.balance,
        coursePrice: course.price,
        deficit: course.price - student.balance
      });
      return res.status(400).json({ 
        message: 'Insufficient balance',
        currentBalance: student.balance,
        requiredAmount: course.price,
        deficit: course.price - student.balance
      });
    }
    
    const enrollment = new Enrollment({
      student: userId,
      course: courseId,
      amount: course.price
    });
    await enrollment.save();
    console.log('✅ Enrollment record created:', enrollment._id);
    
    // Deduct from student balance
    const oldStudentBalance = student.balance;
    student.balance -= course.price;
    student.enrolledCourses = student.enrolledCourses || [];
    student.enrolledCourses.push(courseId);
    await student.save();
    
    console.log('💸 Student balance updated:', {
      oldBalance: oldStudentBalance,
      amountDeducted: course.price,
      newBalance: student.balance
    });
    
    // Add to teacher balance
    const teacher = await User.findById(course.teacher._id);
    if (!teacher) {
      console.log('❌ Teacher not found for balance update:', course.teacher._id);
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const oldTeacherBalance = teacher.balance || 0;
    teacher.balance = (teacher.balance || 0) + course.price;
    teacher.totalEarnings = (teacher.totalEarnings || 0) + course.price;
    await teacher.save();
    
    console.log('💰 Teacher balance updated:', {
      teacherId: teacher._id,
      teacherName: teacher.username,
      oldBalance: oldTeacherBalance,
      amountAdded: course.price,
      newBalance: teacher.balance,
      totalEarnings: teacher.totalEarnings
    });
    
    // Update course stats
    course.students = course.students || [];
    course.students.push(userId);
    course.enrollmentsCount = (course.enrollmentsCount || 0) + 1;
    course.totalEarnings = (course.totalEarnings || 0) + course.price;
    await course.save();
    
    console.log('📊 Course stats updated:', {
      totalStudents: course.students.length,
      totalEarnings: course.totalEarnings
    });
    
    console.log('✅ Enrollment complete! Money transferred successfully.');
    
    res.json({
      message: 'Successfully enrolled in course',
      enrollment: {
        id: enrollment._id,
        courseId: course._id,
        courseTitle: course.title,
        amount: course.price,
        remainingBalance: student.balance,
        teacherReceived: course.price,
        teacherBalance: teacher.balance
      }
    });
    
  } catch (err) {
    console.error('❌ Enrollment error:', err);
    res.status(500).json({ 
      message: 'Failed to enroll in course', 
      error: err.message 
    });
  }
});

// 17. GET Student's Enrolled Courses
app.get('/api/enrollments/student/:studentId', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.params.studentId,
      status: 'active'
    })
    .populate('course', 'title description price thumbnailUrl teacher')
    .populate('course.teacher', 'username')
    .sort({ enrolledAt: -1 });
    
    res.json(enrollments);
  } catch (err) {
    console.error('Get enrollments error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch enrollments', 
      error: err.message 
    });
  }
});

// 18. GET Teacher's Course Earnings
app.get('/api/enrollments/teacher/:teacherId', async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.params.teacherId })
      .populate('students', 'username email')
      .sort({ createdAt: -1 });
    
    const totalEarnings = courses.reduce((sum, course) => 
      sum + (course.totalEarnings || 0), 0
    );
    
    const totalStudents = courses.reduce((sum, course) => 
      sum + (course.enrollmentsCount || 0), 0
    );
    
    res.json({
      courses,
      totalEarnings,
      totalStudents,
      coursesCount: courses.length
    });
  } catch (err) {
    console.error('Get teacher earnings error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch earnings', 
      error: err.message 
    });
  }
});

// 19. GET User Balance
app.get('/api/user/:id/balance', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('balance username email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      balance: user.balance,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch balance', 
      error: err.message 
    });
  }
});

// 20. ADD Funds (For testing)
app.post('/api/user/:id/add-funds', async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    user.balance += parseFloat(amount);
    await user.save();
    
    res.json({
      message: 'Funds added successfully',
      newBalance: user.balance,
      addedAmount: amount
    });
  } catch (err) {
    console.error('Add funds error:', err);
    res.status(500).json({ 
      message: 'Failed to add funds', 
      error: err.message 
    });
  }
});

// ============================================
// DEBUG ROUTES
// ============================================

// DEBUG: Check all users
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEBUG: Check all balances
app.get('/api/debug/balances', async (req, res) => {
  try {
    const users = await User.find().select('username email role balance totalEarnings');
    
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    
    res.json({
      students: students.map(s => ({
        username: s.username,
        email: s.email,
        balance: s.balance
      })),
      teachers: teachers.map(t => ({
        username: t.username,
        email: t.email,
        balance: t.balance,
        totalEarnings: t.totalEarnings || 0
      })),
      totalMoneyInSystem: users.reduce((sum, u) => sum + (u.balance || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`📁 Uploads available at http://localhost:${PORT}/uploads`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log('💡 Try: Change PORT in .env to 5001');
    process.exit(1);
  }
});