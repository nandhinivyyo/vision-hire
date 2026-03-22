const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');

// Generate random session code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/sessions/create (admin)
router.post('/create', protect, adminOnly, async (req, res) => {
  try {
    const {
      title, description, type, topic, difficulty,
      targetDepartment, targetYear, maxParticipants,
      scheduledAt, endsAt, durationMinutes,
      customQuestions, requireVoice, requireVideo, requireCodeEditor
    } = req.body;

    const start = scheduledAt ? new Date(scheduledAt) : null;
    const durMin = durationMinutes ? Number(durationMinutes) : null;
    const computedEndsAt = (!endsAt && start && durMin && durMin > 0)
      ? new Date(start.getTime() + durMin * 60 * 1000)
      : (endsAt ? new Date(endsAt) : null);

    const session = await Session.create({
      title, description, type, topic, difficulty,
      targetDepartment, targetYear, maxParticipants,
      scheduledAt: start,
      endsAt: computedEndsAt,
      durationMinutes: durMin || 30,
      customQuestions,
      requireVoice, requireVideo, requireCodeEditor,
      createdBy: req.user._id,
      sessionCode: generateCode()
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sessions/join
router.post('/join', protect, async (req, res) => {
  try {
    const { sessionCode } = req.body;
    const session = await Session.findOne({ sessionCode, isActive: true });
    if (!session) return res.status(404).json({ message: 'Session not found or inactive' });

    // Enforce scheduled window if configured
    const now = new Date();
    if (session.scheduledAt && now < session.scheduledAt) {
      return res.status(400).json({ message: `Session starts at ${session.scheduledAt.toLocaleString()}` });
    }
    if (session.endsAt && now > session.endsAt) {
      return res.status(400).json({ message: 'Session has ended' });
    }

    if (!session.participants.includes(req.user._id)) {
      session.participants.push(req.user._id);
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/my-sessions (admin)
router.get('/my-sessions', protect, adminOnly, async (req, res) => {
  try {
    const sessions = await Session.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/active
router.get('/active', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true }).populate('createdBy', 'name');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('createdBy', 'name').populate('participants', 'name email department year');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/sessions/:id/toggle (admin)
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    session.isActive = !session.isActive;
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/sessions/:id (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const {
      title, description, type, topic, difficulty,
      targetDepartment, targetYear, maxParticipants,
      scheduledAt, endsAt, durationMinutes,
      customQuestions, requireVoice, requireVideo, requireCodeEditor
    } = req.body;

    const start = scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : session.scheduledAt;
    const durMin = durationMinutes !== undefined ? Number(durationMinutes) : session.durationMinutes;
    const computedEndsAt = (!endsAt && start && durMin && durMin > 0)
      ? new Date(start.getTime() + durMin * 60 * 1000)
      : (endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : session.endsAt);

    session.title = title || session.title;
    session.description = description !== undefined ? description : session.description;
    session.type = type || session.type;
    session.topic = session.type === 'topic' ? (topic !== undefined ? topic : session.topic) : null;
    session.difficulty = difficulty || session.difficulty;
    session.targetDepartment = targetDepartment || session.targetDepartment;
    session.targetYear = targetYear || session.targetYear;
    session.maxParticipants = maxParticipants || session.maxParticipants;
    session.scheduledAt = start;
    session.endsAt = computedEndsAt;
    session.durationMinutes = durMin;
    if (customQuestions) session.customQuestions = customQuestions;
    if (requireVoice !== undefined) session.requireVoice = requireVoice;
    if (requireVideo !== undefined) session.requireVideo = requireVideo;
    if (requireCodeEditor !== undefined) session.requireCodeEditor = requireCodeEditor;

    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/sessions/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
