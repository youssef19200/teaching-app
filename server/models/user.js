const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 3 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher'], 
    default: 'student' 
  },
  balance: { 
    type: Number, 
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  enrolledCourses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook: Give $100 only to new students
UserSchema.pre('save', function(next) {
  if (this.isNew && this.role === 'student' && this.balance === 0) {
    this.balance = 100.00;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);