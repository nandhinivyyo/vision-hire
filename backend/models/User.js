const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // Optional identifiers (unique only when provided)
  rollNumber: { type: String, trim: true },
  registerNumber: { type: String, trim: true },
  collegeName: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  year: { type: String, default: '', trim: true },
  designation: { type: String, default: '', trim: true }, // admin only
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
  lastLogin: { type: Date }
}, { timestamps: true });

// Enforce uniqueness only when the field exists (missing fields are ignored).
// IMPORTANT: we also ensure we never store empty-string values in these fields.
userSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ registerNumber: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
