const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnailUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  totalEarnings: { 
    type: Number, 
    default: 0 
  },
  enrollmentsCount: { 
    type: Number, 
    default: 0 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);