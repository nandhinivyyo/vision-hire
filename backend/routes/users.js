// routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, phone, collegeName, department, year } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, collegeName, department, year },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const recentInterviews = await Interview.find({ student: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type difficulty scores createdAt duration');

    const scoreHistory = recentInterviews.reverse().map(iv => ({
      date: iv.createdAt,
      score: iv.scores?.overall || 0,
      type: iv.type
    }));

    res.json({ user, recentInterviews, scoreHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
