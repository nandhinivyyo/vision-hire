const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  aiFeedback: { type: String, default: '' },
  score: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // seconds
  correctAnswer: { type: String, default: '' },
  followUpQuestions: [String]
});

const interviewSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
  mode: { type: String, enum: ['practice', 'admin_controlled'], default: 'practice' },
  type: { type: String, enum: ['technical', 'hr', 'mixed', 'topic'], required: true },
  topic: { type: String, default: null },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  persona: { type: String, enum: ['friendly', 'strict', 'roast'], default: 'friendly' },
  language: { type: String, default: 'en-US' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'abandoned'], default: 'pending' },
  questions: [questionSchema],
  resumeUsed: { type: Boolean, default: false },
  resumeSkills: [String],
  scores: {
    technicalKnowledge: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  videoMetrics: {
    eyeContactScore: { type: Number, default: 0 },
    postureScore: { type: Number, default: 0 },
    facePresencePercent: { type: Number, default: 0 },
    gazeWarnings: { type: Number, default: 0 },
    emotionData: { type: Object, default: {} },
    warnings: [String]
  },
  skillGaps: [{
    topic: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    suggestions: [String]
  }],
  transcript: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // seconds
  allowedDurationSeconds: { type: Number, default: 0 }, // 0 = unlimited (practice)
  startedAt: { type: Date },
  completedAt: { type: Date },
  aiFeedbackSummary: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
