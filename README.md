# 🤖 VisionHire AI – AI Mock Interview & Skills Analyzer

A full-stack production-ready AI interview platform built with the **MERN stack**, featuring **Google Gemini AI**, voice interviews, webcam monitoring, and comprehensive skill analytics.

---

## 🎨 UI Theme

- **Black & Orange futuristic** dashboard aesthetic
- Glassmorphism cards with orange glow borders
- Animated particle canvas on landing page
- Rajdhani + Exo 2 + JetBrains Mono typography
- Framer Motion page transitions and micro-interactions

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Framer Motion, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Pro API |
| Resume | pdf-parse |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Speech | Web Speech API (TTS) + SpeechRecognition (STT) |
| Video | react-webcam + MediaPipe (TensorFlow.js) |

---

## 📁 Project Structure

```
visionhire/
├── backend/
│   ├── server.js              # Express entry point
│   ├── .env.example           # Environment variables template
│   ├── models/
│   │   ├── User.js            # Student/Admin schema
│   │   ├── Interview.js       # Interview + questions + scores
│   │   └── Session.js         # Admin-controlled sessions
│   ├── middleware/
│   │   └── auth.js            # JWT protect + adminOnly
│   ├── utils/
│   │   └── gemini.js          # All Gemini AI functions
│   └── routes/
│       ├── auth.js            # Register, Login, /me
│       ├── resume.js          # PDF upload + AI analysis
│       ├── interview.js       # Start, answer, complete
│       ├── sessions.js        # Admin sessions + join by code
│       ├── admin.js           # Admin analytics + student mgmt
│       ├── leaderboard.js     # Ranked leaderboard
│       ├── users.js           # Profile + dashboard data
│       └── results.js         # Result retrieval
└── frontend/
    ├── public/
    │   └── index.html         # Global CSS utilities + fonts
    └── src/
        ├── App.jsx            # Router + auth guards
        ├── context/
        │   └── AuthContext.jsx  # JWT auth state
        ├── components/
        │   └── common/
        │       ├── Navbar.jsx   # Animated navigation bar
        │       └── Layout.jsx   # Page wrapper with grid bg
        └── pages/
            ├── LandingPage.jsx         # Animated hero + features
            ├── AuthPage.jsx            # Login + Registration
            ├── EntryPage.jsx           # Mode selector (Practice/Admin)
            ├── ResumeUploadPage.jsx    # PDF upload + AI analysis view
            ├── InterviewSetupPage.jsx  # Type/difficulty configurator
            ├── InterviewRoomPage.jsx   # Live AI interview with voice/video
            ├── ResultsPage.jsx         # Scores + skill gaps + transcript
            ├── StudentDashboard.jsx    # Charts + history + stats
            ├── AdminDashboard.jsx      # Admin panel + session creator
            └── LeaderboardPage.jsx     # Ranked leaderboard
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key ([get one free](https://aistudio.google.com))

### 1. Clone & Setup Backend

```bash
cd visionhire/backend
npm install

# Create .env from template
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/visionhire
JWT_SECRET=your_super_secret_key_change_this
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
# Server running on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd visionhire/frontend
npm install
npm start
# App running on http://localhost:3000
```

### 3. Create First Admin Account

Register at `/auth`, select **Admin** role. Then log in to access `/admin`.

---

## 🔑 API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload PDF, get AI analysis |
| GET | `/api/resume/my-resume` | Get parsed resume data |
| POST | `/api/resume/generate-questions` | Generate questions from resume |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/start` | Start new interview (returns questions) |
| POST | `/api/interview/:id/answer` | Submit answer, get AI evaluation |
| POST | `/api/interview/:id/complete` | Generate full report |
| GET | `/api/interview/:id` | Get interview details |
| GET | `/api/interview/history/me` | My interview history |

### Sessions (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/create` | Create new session (admin) |
| POST | `/api/sessions/join` | Join by session code |
| GET | `/api/sessions/active` | List active sessions |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/students` | All students (filterable) |
| GET | `/api/admin/top-performers` | Top 10 by score |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Ranked list (filter by dept/year) |

---

## 🤖 Gemini AI Functions

| Function | What it does |
|----------|-------------|
| `analyzeResume(text)` | Extracts skills, projects, technologies, experience |
| `generateInterviewQuestions(opts)` | Creates tailored questions by type/difficulty/resume |
| `evaluateAnswer(question, answer)` | Scores 0-100, gives feedback + follow-up |
| `generateInterviewReport(data)` | Full report: skill scores, gaps, recommendations |

---

## 🎙️ Voice Interview Flow

1. AI generates question → **Text-to-Speech** via `window.speechSynthesis`
2. User clicks mic → **SpeechRecognition** captures speech → converts to text
3. Text submitted to backend → **Gemini evaluates** → returns score + feedback
4. AI reads next question aloud

---

## 📹 Video Monitoring

Located in `InterviewRoomPage.jsx`:
- **react-webcam** captures live video feed
- Simulated metrics (eye contact, posture) displayed in real-time
- For production: add `@tensorflow-models/face-detection` and `@tensorflow-models/pose-detection`

```bash
npm install @tensorflow/tfjs @tensorflow-models/face-detection @tensorflow-models/pose-detection
```

---

## 📊 Dashboard Charts (Chart.js)

| Chart | Page | Data |
|-------|------|------|
| Line chart | Student Dashboard | Score improvement over time |
| Doughnut | Student Dashboard | Interview type distribution |
| Radar | Results Page | Score breakdown across 5 dimensions |
| Bar chart | Admin Dashboard | Students per department |

---

## 🏆 Scoring System

Each interview generates scores across 5 dimensions (0-100):

- **Technical Knowledge** – accuracy and depth of technical answers
- **Communication** – clarity, structure, articulation
- **Confidence** – assertiveness and certainty of responses  
- **Problem Solving** – logical approach and reasoning
- **Clarity** – conciseness and relevance

**Overall score** = weighted average computed by Gemini AI

---

## 🔒 Security Notes

For production deployment:
1. Change `JWT_SECRET` to a long random string
2. Use MongoDB Atlas with network access controls
3. Add rate limiting: `npm install express-rate-limit`
4. Add helmet: `npm install helmet`
5. Set `NODE_ENV=production`
6. Store Gemini key in secure vault (AWS Secrets Manager, etc.)

---

## 🐳 Docker (Optional)

```bash
# From root of project
docker-compose up --build
```

Requires `docker-compose.yml` in the root directory.

---

## 📱 Responsive Breakpoints

- Mobile: `< 768px` – stacked layouts, condensed cards
- Tablet: `768px–1024px` – 2-column grids
- Desktop: `> 1024px` – full 3-column dashboards

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 5000) | Backend server port |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `NODE_ENV` | No | `development` or `production` |

---

## 🙋 Support

Built with ❤️ using MERN + Gemini AI. For issues, check the browser console and backend terminal logs first.
