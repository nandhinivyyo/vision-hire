const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/results', require('./routes/results'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'VisionHire AI is running', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Ensure DB indexes match current schemas (drops stale unique indexes)
    const User = require('./models/User');
    // Clean up old data that used empty strings (breaks unique indexes)
    await User.updateMany({ rollNumber: '' }, { $unset: { rollNumber: 1 } });
    await User.updateMany({ registerNumber: '' }, { $unset: { registerNumber: 1 } });
    await User.syncIndexes();

    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 VisionHire AI server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
})();

module.exports = app;
