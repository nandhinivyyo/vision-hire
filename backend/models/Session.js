const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionCode: { type: String, required: true, unique: true },
  type: { type: String, enum: ['technical', 'hr', 'mixed', 'topic'], required: true },
  topic: { type: String, default: null },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  targetDepartment: { type: String, default: 'all' },
  targetYear: { type: String, default: 'all' },
  maxParticipants: { type: Number, default: 100 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  interviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }],
  isActive: { type: Boolean, default: true },
  scheduledAt: { type: Date },
  endsAt: { type: Date },
  durationMinutes: { type: Number, default: 30 },
  requireVoice: { type: Boolean, default: false },
  requireVideo: { type: Boolean, default: false },
  requireCodeEditor: { type: Boolean, default: false },
  customQuestions: [String]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
