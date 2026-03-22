// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { getVerificationEmailTemplate } = require('../utils/emailTemplates');

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
    const { department, year, college, role, page = 1, limit = 20 } = req.query;
    const filter = {}; // Allow seeing all users
    if (department && department !== 'all') filter.department = department;
    if (year && year !== 'all') filter.year = year;
    if (college && college !== 'all') filter.collegeName = college;
    if (role && role !== 'all') filter.role = role;

    const students = await User.find(filter)
      .select('-password')
      .sort({ role: 1, averageScore: -1 })
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

// POST /api/admin/students (also supports creating staff/admins)
router.post('/students', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, rollNumber, registerNumber, collegeName, department, year, phone, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const newRole = role === 'admin' ? 'admin' : 'student';

    const user = await User.create({
      name, email, rollNumber, registerNumber, collegeName, department, year, phone, password, role: newRole, isVerified: false
    });
    
    // Generate Verification Token
    const verifyToken = user.getSignedVerifyToken();
    await user.save({ validateBeforeSave: false });

    // Send Verification Email
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:3000';
    const frontendVerifyUrl = `${clientUrl}/verify/${verifyToken}`;
    const message = `Welcome to VisionHire! An admin has created an account for you. Please confirm your account by clicking the link below: \n\n ${frontendVerifyUrl}`;

    sendEmail({
      email: user.email,
      subject: 'VisionHire Account Verification',
      message,
      html: getVerificationEmailTemplate(frontendVerifyUrl, true)
    }).catch(err => console.error("Background auth email failed on admin create:", err));

    res.status(201).json({ ...user.toJSON(), message: 'User created and verification email is being sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/students/:id
router.put('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, rollNumber, registerNumber, collegeName, department, year, phone, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (rollNumber) user.rollNumber = rollNumber;
    if (registerNumber) user.registerNumber = registerNumber;
    if (collegeName) user.collegeName = collegeName;
    if (department) user.department = department;
    if (year) user.year = year;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    await user.save();
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/students/:id
router.delete('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
