const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, req.user._id + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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

router.post('/profile/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Construct public URL
    // the server is using Express static on '/uploads' -> we return `/uploads/avatars/filename`
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    
    res.json({ avatar: user.avatar, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ message: 'User account deleted successfully' });
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
