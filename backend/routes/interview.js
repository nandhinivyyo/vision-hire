const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');
const User = require('../models/User');
const Session = require('../models/Session');
const { generateInterviewQuestions, evaluateAnswer, generateInterviewReport, generateHrNudge } = require('../utils/gemini');

// POST /api/interview/start
router.post('/start', protect, async (req, res) => {
  try {
    const { type, topic, difficulty, persona = 'friendly', language = 'en-US', mode = 'practice', sessionId, useResume = true } = req.body;

    // If this is a session interview, enforce schedule window + lock criteria to session
    let session = null;
    let lockedType = type;
    let lockedDifficulty = difficulty;
    let allowedDurationSeconds = 0;

    if (sessionId) {
      session = await Session.findById(sessionId);
      if (!session || !session.isActive) return res.status(404).json({ message: 'Session not found or inactive' });

      const now = new Date();
      if (session.scheduledAt && now < session.scheduledAt) {
        return res.status(400).json({ message: `Session starts at ${session.scheduledAt.toLocaleString()}` });
      }
      if (session.endsAt && now > session.endsAt) {
        return res.status(400).json({ message: 'Session has ended' });
      }

      // Lock to session config (students can't change these)
      lockedType = session.type;
      lockedDifficulty = session.difficulty;

      const dm = Number(session.durationMinutes || 0);
      allowedDurationSeconds = dm > 0 ? Math.round(dm * 60) : 0;
    }

    const user = await User.findById(req.user._id).select('resumeData name');

    // Only use resume data if it has meaningful content
    const hasResume = useResume &&
      user.resumeData &&
      (user.resumeData.skills?.length > 0 || user.resumeData.technologies?.length > 0);

    const resumeData = hasResume ? {
      ...user.resumeData,
      name: user.resumeData.name || user.name  // pass candidate name for personalization
    } : null;

    // Unique seed per session so questions are always different
    const sessionSeed = `${req.user._id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const questions = await generateInterviewQuestions({
      type: lockedType,
      topic,
      difficulty: lockedDifficulty,
      persona,
      resumeData,
      count: 10,
      sessionSeed,
      language
    });

    const interview = await Interview.create({
      student: req.user._id,
      session: sessionId || null,
      mode,
      type: lockedType,
      topic: lockedType === 'topic' ? topic : null,
      difficulty: lockedDifficulty,
      persona,
      language,
      status: 'in_progress',
      allowedDurationSeconds,
      resumeUsed: hasResume,
      resumeSkills: resumeData?.skills || [],
      questions: questions.map(q => ({ question: q, answer: '', aiFeedback: '', score: 0 })),
      startedAt: new Date()
    });

    res.status(201).json({
      interviewId: interview._id,
      questions: interview.questions,
      totalQuestions: interview.questions.length,
      totalTimeSeconds: allowedDurationSeconds
    });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interview/:id/answer
router.post('/:id/answer', protect, async (req, res) => {
  try {
    const { questionIndex, answer, videoMetrics } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (interview.status !== 'in_progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    const question = interview.questions[questionIndex];
    if (!question) return res.status(400).json({ message: 'Invalid question index' });

    // Pass resume context to evaluator for better feedback
    const resumeContext = interview.resumeSkills?.length
      ? `Skills: ${interview.resumeSkills.slice(0, 5).join(', ')}`
      : '';

    const evaluation = await evaluateAnswer(question.question, answer, resumeContext, interview.persona, interview.language);

    interview.questions[questionIndex].answer       = answer;
    interview.questions[questionIndex].aiFeedback  = evaluation.feedback;
    interview.questions[questionIndex].score        = evaluation.score;
    interview.questions[questionIndex].correctAnswer = evaluation.correctAnswer || '';
    interview.questions[questionIndex].followUpQuestions = evaluation.followUpQuestion ? [evaluation.followUpQuestion] : [];

    if (videoMetrics) {
      interview.videoMetrics = { ...interview.videoMetrics, ...videoMetrics };
    }

    await interview.save();

    const nextQuestion = questionIndex < interview.questions.length - 1
      ? interview.questions[questionIndex + 1]
      : null;

    res.json({
      evaluation,
      voiceResponse: evaluation.voiceResponse || evaluation.feedback,
      nextQuestion: nextQuestion ? { index: questionIndex + 1, question: nextQuestion.question } : null,
      isComplete: !nextQuestion
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interview/:id/abandon
// Used for auto-ending interviews (e.g., tab switch / leaving screen).
router.post('/:id/abandon', protect, async (req, res) => {
  try {
    const { reason = 'Interview abandoned', videoMetrics } = req.body || {};
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (interview.status === 'completed' || interview.status === 'abandoned') {
      return res.json({ ok: true, interviewId: interview._id });
    }

    interview.status = 'abandoned';
    interview.completedAt = new Date();
    if (interview.startedAt) {
      interview.duration = Math.round((new Date() - interview.startedAt) / 1000);
    }
    interview.aiFeedbackSummary = reason;
    interview.scores = {
      technicalKnowledge: 0,
      communication: 0,
      confidence: 0,
      problemSolving: 0,
      clarity: 0,
      overall: 0
    };
    if (videoMetrics) {
      interview.videoMetrics = { ...interview.videoMetrics, ...videoMetrics };
    }

    await interview.save();
    res.json({ ok: true, interviewId: interview._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interview/:id/nudge
// When candidate is silent/stuck during voice interview.
router.post('/:id/nudge', protect, async (req, res) => {
  try {
    const { questionIndex, partialAnswer = '' } = req.body || {};
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (interview.status !== 'in_progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }
    const qi = Number.isFinite(Number(questionIndex)) ? Number(questionIndex) : null;
    const q = (qi !== null && interview.questions[qi]) ? interview.questions[qi].question : null;
    if (!q) return res.status(400).json({ message: 'Invalid question index' });

    const resumeContext = interview.resumeSkills?.length
      ? `Skills: ${interview.resumeSkills.slice(0, 5).join(', ')}`
      : '';

    const r = await generateHrNudge({
      question: q,
      partialAnswer,
      type: interview.type,
      difficulty: interview.difficulty,
      resumeContext,
      language: interview.language
    });
    res.json({ nudge: r.nudge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interview/:id/complete
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const { videoMetrics } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (interview.status !== 'in_progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    const report = await generateInterviewReport({
      questions: interview.questions,
      type: interview.type,
      difficulty: interview.difficulty,
      resumeSkills: interview.resumeSkills
    });

    const transcript = interview.questions.map((q, i) =>
      `Q${i+1}: ${q.question}\nAnswer: ${q.answer || 'No answer'}\nFeedback: ${q.aiFeedback}`
    ).join('\n\n---\n\n');

    interview.status           = 'completed';
    interview.completedAt      = new Date();
    interview.duration         = Math.round((new Date() - interview.startedAt) / 1000);
    
    // Penalize score if multiple gaze warnings (anti-cheat)
    let finalOverall = report.overall;
    const finalGazeWarnings = videoMetrics?.gazeWarnings || 0;
    
    if (finalGazeWarnings >= 2) {
      finalOverall = Math.max(0, finalOverall - (finalGazeWarnings * 10)); // -10 points per warning
      report.summary = `[INTEGRITY WARNING] Candidate was flagged for continuously looking away from the camera. ${report.summary}`;
      if (!report.skillGaps) report.skillGaps = [];
      report.skillGaps.push({
        topic: 'Interview Integrity',
        severity: 'high',
        suggestions: ['Maintain eye contact with the camera', 'Do not read from notes or second screens during the interview']
      });
    }

    interview.scores           = { ...report.scores, overall: finalOverall };
    interview.skillGaps        = report.skillGaps || [];
    interview.aiFeedbackSummary = report.summary;
    interview.transcript       = transcript;
    if (videoMetrics) interview.videoMetrics = videoMetrics;

    await interview.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    user.totalInterviews += 1;
    const allInterviews = await Interview.find({ student: req.user._id, status: 'completed' });
    const totalScore = allInterviews.reduce((sum, iv) => sum + (iv.scores?.overall || 0), 0);
    user.averageScore = Math.round(totalScore / allInterviews.length);
    user.bestScore    = Math.max(user.bestScore || 0, report.overall);
    await user.save();

    res.json({ report, interviewId: interview._id });
  } catch (err) {
    console.error('Complete interview error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/interview/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('student', 'name email');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json(interview);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/interview/history/me
router.get('/history/me', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ student: req.user._id })
      .sort({ createdAt: -1 }).limit(20).select('-transcript -questions');
    res.json(interviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
