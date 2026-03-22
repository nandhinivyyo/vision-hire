import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionCode, setSessionCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    axios.get('/api/sessions/active').then(r => setSessions(r.data)).catch(() => {});
  }, []);

  const joinSession = async () => {
    if (!sessionCode.trim()) return toast.error('Enter a session code');
    setJoining(true);
    try {
      const res = await axios.post('/api/sessions/join', { sessionCode: sessionCode.trim().toUpperCase() });
      toast.success(`Joined: ${res.data.title}`);
      // Admin/staff sessions are locked to the session's criteria
      navigate('/setup', { state: { sessionId: res.data._id, mode: 'admin_controlled', type: res.data.type, difficulty: res.data.difficulty, sessionDefaults: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Session not found');
    } finally { setJoining(false); }
  };

  const modes = [
    {
      id: 'practice',
      icon: '🎯',
      title: 'Practice Mode',
      subtitle: 'Solo Interview Training',
      desc: 'Train at your own pace. Choose your topic, difficulty, and get real-time AI feedback on every answer.',
      features: ['Resume-based questions', 'Voice & video support', 'Instant AI scoring', 'Skill gap report'],
      color: '#f97316',
    },
    {
      id: 'topic',
      icon: '📚',
      title: 'Topic-Wise Mock',
      subtitle: 'Targeted Skill Practice',
      desc: 'Focus entirely on a single technology or subject. Select from 45+ specific tech skills to master quickly.',
      features: ['45+ Curated Topics', 'Deep-dive questions', 'Live code evaluation', 'Domain mastery scoring'],
      color: '#3b82f6',
    },
    {
      id: 'admin',
      icon: '🏛️',
      title: 'Admin Session',
      subtitle: 'Scheduled Interview',
      desc: 'Join an interview session created by your placement officer or admin with specific criteria.',
      features: ['Enter session code', 'Standardized questions', 'Live monitoring', 'Comparative ranking'],
      color: '#a855f7',
    },
  ];

  return (
    <div className="min-h-screen pt-20 px-6 pb-16" style={{ fontFamily: 'Exo 2, sans-serif' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <p className="text-orange-500/60 font-mono text-xs tracking-[4px] mb-3">INTERVIEW PORTAL</p>
          <h1 className="font-display font-bold text-5xl text-white mb-3">
            Ready to <span className="text-orange-400">Begin?</span>
          </h1>
          <p className="text-white/40 text-lg">Choose your interview mode to get started</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {modes.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              onClick={() => setMode(mode === m.id ? null : m.id)}
              className="glass-card p-8 cursor-pointer transition-all duration-300 relative overflow-hidden"
              style={{ border: mode === m.id ? `1px solid ${m.color}` : undefined, boxShadow: mode === m.id ? `0 0 40px ${m.color}25` : undefined }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ background: m.color, transform: 'translate(30%, -30%)' }} />
              <div className="text-4xl mb-4">{m.icon}</div>
              <h2 className="font-display font-bold text-2xl text-white mb-1">{m.title}</h2>
              <p className="text-xs font-mono mb-3" style={{ color: m.color }}>{m.subtitle}</p>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{m.desc}</p>
              <ul className="space-y-2">
                {m.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-white/60 text-sm">
                    <span style={{ color: m.color }}>›</span> {f}
                  </li>
                ))}
              </ul>
              <motion.div animate={{ scale: mode === m.id ? 1 : 0 }} className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: m.color }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3"><path d="M5 13l4 4L19 7" /></svg>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {mode === 'practice' && (
            <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 mb-6">
              <h3 className="font-display font-bold text-xl text-white mb-4">Quick Resume Check</h3>
              <p className="text-white/40 text-sm mb-5">For personalized questions based on your skills, upload your resume first.</p>
              <div className="flex gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/resume')}
                  className="px-6 py-3 rounded-xl font-display text-sm tracking-wide transition-all"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
                  📄 Upload Resume First
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/setup', { state: { mode: 'practice' } })}
                  className="btn-orange px-8 py-3 rounded-xl font-display text-sm tracking-wide">
                  Skip & Start Interview →
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === 'topic' && (
            <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 mb-6 text-center">
              <h3 className="font-display font-bold text-xl text-white mb-2">Topic-Focused Mock</h3>
              <p className="text-white/40 text-sm mb-5">Jump straight into the targeted topic selection portal to choose your technical focus.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/setup', { state: { mode: 'practice', type: 'topic' } })}
                className="btn-orange px-10 py-4 rounded-xl font-display text-sm tracking-widest inline-flex items-center gap-2">
                Select Your Topic <span>→</span>
              </motion.button>
            </motion.div>
          )}

          {mode === 'admin' && (
            <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 mb-6">
              <h3 className="font-display font-bold text-xl text-white mb-4">Join a Session</h3>
              <div className="flex gap-4 mb-6">
                <input value={sessionCode} onChange={e => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit session code (e.g. AB12CD)"
                  className="input-dark flex-1 font-mono text-lg tracking-widest text-center" maxLength={6} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={joinSession} disabled={joining}
                  className="btn-orange px-8 py-3 rounded-xl font-display text-sm tracking-wide">
                  {joining ? '...' : 'Join →'}
                </motion.button>
              </div>
              {sessions.length > 0 && (
                <>
                  <p className="text-white/30 text-xs font-mono tracking-wider mb-3">ACTIVE SESSIONS</p>
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <div key={s._id} onClick={() => setSessionCode(s.sessionCode)}
                        className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                        style={{ background: 'var(--card)', border: '1px solid var(--border2)' }}>
                        <div>
                          <p className="text-white text-sm font-medium">{s.title}</p>
                          <p className="text-white/30 text-xs">{s.type} · {s.difficulty} · by {s.createdBy?.name}</p>
                        </div>
                        <span className="font-mono text-orange-400 text-sm tracking-widest">{s.sessionCode}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {user?.role === 'admin' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-center">
            <button onClick={() => navigate('/admin')}
              className="text-orange-500/50 hover:text-orange-400 text-sm font-mono tracking-wider transition-colors">
              ⚙ Admin Dashboard →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
