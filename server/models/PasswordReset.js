const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index to auto-delete expired codes
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);