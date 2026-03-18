const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { analyzeResume, generateInterviewQuestions } = require('../utils/gemini');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `resume_${req.user._id}_${Date.now()}.pdf`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// POST /api/resume/upload - Upload and analyze resume
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Parse PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ message: 'Could not extract meaningful text from PDF' });
    }

    // Analyze with Gemini
    const analysisResult = await analyzeResume(rawText);

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      resumeUrl: `/uploads/resumes/${req.file.filename}`,
      resumeData: {
        skills: analysisResult.skills || [],
        projects: analysisResult.projects || [],
        technologies: analysisResult.technologies || [],
        experience: analysisResult.experience || [],
        rawText: rawText.substring(0, 5000)
      }
    });

    res.json({
      message: 'Resume uploaded and analyzed successfully',
      analysis: analysisResult,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/resume/my-resume - Get current user's resume data
router.get('/my-resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resumeData resumeUrl');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/resume/generate-questions - Generate questions from resume
router.post('/generate-questions', protect, async (req, res) => {
  try {
    const { type = 'technical', difficulty = 'medium', count = 10 } = req.body;
    const user = await User.findById(req.user._id).select('resumeData');

    const questions = await generateInterviewQuestions({
      type,
      difficulty,
      resumeData: user.resumeData,
      count: Math.min(count, 20)
    });

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
