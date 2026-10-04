const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Middleware
app.use(compression());
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
  res.json({
    status: 'VisionHire AI is running',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Middleware to verify DB connection
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api/health' && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database connection in progress or unavailable. Please check MONGO_URI configuration.'
    });
  }
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Start Express HTTP Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 VisionHire AI server running on port ${PORT}`);
});

// Connect to MongoDB asynchronously
(async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visionhire';
  try {
    try {
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ MongoDB connected');
    } catch (primaryErr) {
      if (primaryUri !== 'mongodb://127.0.0.1:27017/visionhire') {
        console.warn('⚠️ Primary MongoDB connection failed. Falling back to local MongoDB (127.0.0.1:27017)...');
        await mongoose.connect('mongodb://127.0.0.1:27017/visionhire', { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected to local MongoDB fallback');
      } else {
        throw primaryErr;
      }
    }

    const User = require('./models/User');
    await User.updateMany({ rollNumber: '' }, { $unset: { rollNumber: 1 } }).catch(() => {});
    await User.updateMany({ registerNumber: '' }, { $unset: { registerNumber: 1 } }).catch(() => {});
    await User.syncIndexes().catch(() => {});
  } catch (err) {
    console.error('⚠️ MongoDB connection warning:', err.message);
    console.warn('Backend server is active, but MongoDB is disconnected. Please check MONGO_URI string or network access.');
  }
})();

module.exports = app;
