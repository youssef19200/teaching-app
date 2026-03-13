const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  enrolledAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'refunded'], 
    default: 'active' 
  }
});

// Prevent duplicate enrollments
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);