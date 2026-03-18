import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const TYPES = [
  { id: 'technical', label: 'Technical', icon: '💻', desc: 'Data structures, algorithms, system design, frameworks' },
  { id: 'hr', label: 'HR / Behavioral', icon: '🤝', desc: 'Leadership, teamwork, situational judgment, culture fit' },
  { id: 'mixed', label: 'Mixed', icon: '⚡', desc: 'Combination of technical and behavioral questions' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: '#22c55e', desc: 'Fundamentals, definitions, basic concepts' },
  { id: 'medium', label: 'Medium', color: '#eab308', desc: 'Practical scenarios, problem solving' },
  { id: 'hard', label: 'Hard', color: '#ef4444', desc: 'Advanced concepts, system design, edge cases' },
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sessionId,
    mode = 'practice',
    type: preType,
    difficulty: preDiff,
    sessionDefaults
  } = location.state || {};

  const isSessionLocked = mode === 'admin_controlled';

  const [type, setType] = useState(preType || sessionDefaults?.type || 'technical');
  const [difficulty, setDifficulty] = useState(preDiff || sessionDefaults?.difficulty || 'medium');
  const [useVoice, setUseVoice] = useState(false);
  const [useVideo, setUseVideo] = useState(false);
  const [starting, setStarting] = useState(false);

  const startInterview = async () => {
    setStarting(true);
    try {
      const res = await axios.post('/api/interview/start', { type, difficulty, mode, sessionId, useResume: true });
      navigate(`/interview/${res.data.interviewId}`, {
        state: { questions: res.data.questions, useVoice, useVideo, type, difficulty, totalTimeSeconds: res.data.totalTimeSeconds }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-16" style={{ fontFamily: 'Exo 2, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-orange-500/60 font-mono text-xs tracking-[4px] mb-2">CONFIGURE</p>
          <h1 className="font-display font-bold text-4xl text-white mb-2">Interview <span className="text-orange-400">Setup</span></h1>
          <p className="text-white/40">Customize your AI interview session</p>
        </motion.div>

        {mode === 'admin_controlled' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 mb-6 flex items-start gap-3">
            <span className="text-orange-500">ℹ</span>
            <div>
              <p className="text-white/60 text-sm">
                This is an admin/staff session. Type and difficulty are <span className="text-orange-400 font-mono">{type}</span> ·{' '}
                <span className="text-orange-400 font-mono">{difficulty}</span> and are locked by the session.
              </p>
              <p className="text-white/25 text-xs mt-1">You can still toggle voice/video features below.</p>
            </div>
          </motion.div>
        )}

        {/* Interview Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <p className="text-white/60 font-mono text-xs tracking-wider mb-4">INTERVIEW TYPE</p>
          <div className="grid grid-cols-3 gap-4">
            {TYPES.map(t => (
              <motion.div
                key={t.id}
                onClick={() => { if (!isSessionLocked) setType(t.id); }}
                whileHover={isSessionLocked ? undefined : { scale: 1.02 }}
                whileTap={isSessionLocked ? undefined : { scale: 0.98 }}
                className={`glass-card p-5 transition-all duration-200 relative overflow-hidden ${isSessionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                style={{ border: type === t.id ? '1px solid #f97316' : undefined, boxShadow: type === t.id ? '0 0 25px rgba(249,115,22,0.2)' : undefined }}>
                <div className="text-2xl mb-2">{t.icon}</div>
                <p className="font-display font-bold text-white text-base mb-1">{t.label}</p>
                <p className="text-white/35 text-xs leading-relaxed">{t.desc}</p>
                {type === t.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3"><path d="M5 13l4 4L19 7" /></svg>
                </div>}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Difficulty */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <p className="text-white/60 font-mono text-xs tracking-wider mb-4">DIFFICULTY LEVEL</p>
          <div className="grid grid-cols-3 gap-4">
            {DIFFICULTIES.map(d => (
              <motion.div
                key={d.id}
                onClick={() => { if (!isSessionLocked) setDifficulty(d.id); }}
                whileHover={isSessionLocked ? undefined : { scale: 1.02 }}
                whileTap={isSessionLocked ? undefined : { scale: 0.98 }}
                className={`glass-card p-5 transition-all duration-200 ${isSessionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                style={{ border: difficulty === d.id ? `1px solid ${d.color}` : undefined, boxShadow: difficulty === d.id ? `0 0 25px ${d.color}25` : undefined }}>
                <div className="w-3 h-3 rounded-full mb-3" style={{ background: d.color }} />
                <p className="font-display font-bold text-white text-base mb-1">{d.label}</p>
                <p className="text-white/35 text-xs">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 mb-8">
          <p className="text-white/60 font-mono text-xs tracking-wider mb-4">INTERVIEW FEATURES</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'voice', label: 'Voice Input', desc: 'Answer using your microphone (Speech-to-Text)', icon: '🎙️', val: useVoice, set: setUseVoice },
              { key: 'video', label: 'Video Monitoring', desc: 'Eye contact and posture analysis via webcam', icon: '📹', val: useVideo, set: setUseVideo },
            ].map(f => (
              <div key={f.key} onClick={() => f.set(!f.val)}
                className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                style={{ background: f.val ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${f.val ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                <span className="text-2xl">{f.icon}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{f.label}</p>
                  <p className="text-white/35 text-xs">{f.desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${f.val ? 'bg-orange-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${f.val ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Start */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="glass-card p-4 mb-4 flex items-center gap-3">
            <span className="text-orange-500">ℹ</span>
            <p className="text-white/40 text-sm">You'll get <span className="text-orange-400">8–10 AI-generated questions</span> tailored to your resume, type, and difficulty. Each answer is evaluated in real-time.</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startInterview} disabled={starting}
            className="btn-orange w-full py-4 rounded-xl font-display text-lg tracking-widest flex items-center justify-center gap-3">
            {starting ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Questions...</>
            ) : '🚀  BEGIN INTERVIEW'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
