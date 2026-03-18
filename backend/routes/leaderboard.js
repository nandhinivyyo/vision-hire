// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/', protect, async (req, res) => {
  try {
    const { department, year, college, limit = 50 } = req.query;
    const filter = { role: 'student', totalInterviews: { $gt: 0 } };
    if (department && department !== 'all') filter.department = department;
    if (year && year !== 'all') filter.year = year;
    if (college && college !== 'all') filter.collegeName = college;

    const students = await User.find(filter)
      .sort({ averageScore: -1, bestScore: -1, totalInterviews: -1 })
      .limit(parseInt(limit))
      .select('name email department year collegeName averageScore bestScore totalInterviews createdAt');

    const ranked = students.map((s, idx) => ({ ...s.toObject(), rank: idx + 1 }));
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
