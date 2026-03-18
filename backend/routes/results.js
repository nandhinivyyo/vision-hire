const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');

router.get('/my-results', protect, async (req, res) => {
  try {
    const results = await Interview.find({ student: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .populate('student', 'name email');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:interviewId', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('student', 'name email department year');
    if (!interview) return res.status(404).json({ message: 'Result not found' });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
