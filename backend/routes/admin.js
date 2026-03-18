// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInterviews = await Interview.countDocuments({ status: 'completed' });
    const interviews = await Interview.find({ status: 'completed' }).select('scores');
    const avgScore = interviews.length
      ? Math.round(interviews.reduce((s, i) => s + (i.scores?.overall || 0), 0) / interviews.length)
      : 0;

    const deptStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ totalStudents, totalInterviews, avgScore, deptStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const { department, year, college, page = 1, limit = 20 } = req.query;
    const filter = { role: 'student' };
    if (department && department !== 'all') filter.department = department;
    if (year && year !== 'all') filter.year = year;
    if (college && college !== 'all') filter.collegeName = college;

    const students = await User.find(filter)
      .select('-password')
      .sort({ averageScore: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ students, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/student/:id/interviews
router.get('/student/:id/interviews', protect, adminOnly, async (req, res) => {
  try {
    const interviews = await Interview.find({ student: req.params.id, status: 'completed' })
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/top-performers
router.get('/top-performers', protect, adminOnly, async (req, res) => {
  try {
    const top = await User.find({ role: 'student', totalInterviews: { $gt: 0 } })
      .sort({ averageScore: -1, bestScore: -1 })
      .limit(10)
      .select('name email department year collegeName averageScore bestScore totalInterviews');
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
