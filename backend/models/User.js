const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNumber: { type: String, trim: true },
  registerNumber: { type: String, trim: true },
  collegeName: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  year: { type: String, default: '', trim: true },
  designation: { type: String, default: '', trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  resumeData: {
    skills: [String],
    projects: [String],
    technologies: [String],
    experience: [String],
    rawText: String
  },
  totalInterviews: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  
  // Email Auth
  isVerified: { type: Boolean, default: false }, // Existing users have 'true' saved in DB so they are safe.
  verifyEmailToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  lastLogin: { type: Date }
}, { timestamps: true });

userSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ registerNumber: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate Verification Token
userSchema.methods.getSignedVerifyToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.verifyEmailToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

// Generate Password Reset Token
userSchema.methods.getResetPasswordToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verifyEmailToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
