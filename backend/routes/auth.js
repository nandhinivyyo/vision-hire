const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('collegeName').notEmpty().trim(),
  body('department').notEmpty().trim(),
  body('phone').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, rollNumber, registerNumber, collegeName,
            department, year, phone, role, designation } = req.body;

    const isAdmin = role === 'admin';

    const orConditions = [{ email }];
    if (!isAdmin && rollNumber) orConditions.push({ rollNumber });
    if (!isAdmin && registerNumber) orConditions.push({ registerNumber });

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) {
      return res.status(400).json({
        message: isAdmin ? 'An account with this email already exists' : 'User already exists with that email, roll number or register number'
      });
    }

    const user = await User.create({
      name, email, password, phone,
      collegeName, department,
      rollNumber: isAdmin ? undefined : (rollNumber ? String(rollNumber).trim() : undefined),
      registerNumber: isAdmin ? undefined : (registerNumber ? String(registerNumber).trim() : undefined),
      year: isAdmin ? '' : (year || ''),
      designation: isAdmin ? (designation || '') : '',
      role: isAdmin ? 'admin' : 'student',
      isVerified: false
    });

    // Generate Verification Token
    const verifyToken = user.getSignedVerifyToken();
    await user.save({ validateBeforeSave: false });

    // Send Verification Email
    const frontendVerifyUrl = `http://localhost:3000/verify/${verifyToken}`;
    const message = `Welcome to VisionHire! Please confirm your account by clicking the link below: \n\n ${frontendVerifyUrl}`;

    sendEmail({
      email: user.email,
      subject: 'VisionHire Account Verification',
      message
    }).catch(err => console.error("Background email failed:", err));

    res.status(201).json({
      message: 'Registration successful! Please check your email inbox to verify your account.'
    });

  } catch (err) {
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const verifyEmailToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ verifyEmailToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verifyEmailToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Account verified successfully! You may now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Email not verified. Please check your inbox for the verification link.' });
    }

    user.lastLogin = new Date();
    user.save({ validateBeforeSave: false }).catch(err => console.error("Background login save failed:", err));

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      collegeName: user.collegeName,
      year: user.year,
      designation: user.designation,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgotpassword
router.post('/forgotpassword', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // 200 OK prevents user enumeration
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`;
    const message = `You requested a password reset. Click the link below to securely set a new password: \n\n ${resetUrl}`;

    sendEmail({
      email: user.email,
      subject: 'VisionHire Password Reset',
      message
    }).catch(err => console.error("Background PR email failed:", err));
    
    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/resetpassword/:token
router.put('/resetpassword/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save(); 

    res.json({ message: 'Password reset successful. You may now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

module.exports = router;
