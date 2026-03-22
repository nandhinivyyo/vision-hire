import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const TYPES = [
  { id: 'technical', label: 'Technical', icon: '💻', desc: 'Data structures, algorithms, system design, frameworks' },
  { id: 'hr', label: 'HR / Behavioral', icon: '🤝', desc: 'Leadership, teamwork, situational judgment, culture fit' },
  { id: 'mixed', label: 'Mixed', icon: '⚡', desc: 'Combination of technical and behavioral questions' },
  { id: 'topic', label: 'Topic-Focused', icon: '🎯', desc: 'Exclusive mock on a specific tech skill' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: '#22c55e', desc: 'Fundamentals, definitions, basic concepts' },
  { id: 'medium', label: 'Medium', color: '#eab308', desc: 'Practical scenarios, problem solving' },
  { id: 'hard', label: 'Hard', color: '#ef4444', desc: 'Advanced concepts, system design, edge cases' },
];

const PERSONAS = [
  { id: 'friendly', label: 'Friendly HR', icon: '😊', desc: 'Warm, encouraging, and supportive' },
  { id: 'strict', label: 'Strict Tech Lead', icon: '🧐', desc: 'Professional, direct, expects high accuracy' },
  { id: 'roast', label: 'Gordon Ramsay', icon: '🔥', desc: 'Brutally honest, hilarious, roasts mistakes' }
];

const LANGUAGES = [
  { id: 'en-US', label: 'English (US)', icon: '🇺🇸', desc: 'Standard English' },
  { id: 'hi-IN', label: 'Hinglish', icon: '🇮🇳', desc: 'Hindi & English' },
  { id: 'es-ES', label: 'Spanish', icon: '🇪🇸', desc: 'Español' },
  { id: 'fr-FR', label: 'French', icon: '🇫🇷', desc: 'Français' },
];

const TOPICS = [
  'Computer Networks', 'DBMS', 'Operating Systems', 'OOPS', 
  'Data Structures', 'Algorithms', 'System Design', 'HTML', 'CSS', 'JavaScript',
  'TypeScript', 'React.js', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C++', 'C#', '.NET',
  'Go', 'Rust', 'Ruby on Rails', 'PHP', 'Laravel', 'SQL', 'MySQL', 'PostgreSQL',
  'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'Docker', 'Kubernetes', 'AWS',
  'Google Cloud', 'Microsoft Azure', 'Machine Learning', 'Data Science', 'Cybersecurity'
].sort();

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sessionId, mode = 'practice', type: preType, difficulty: preDiff, sessionDefaults
  } = location.state || {};

  const isSessionLocked = mode === 'admin_controlled';

  const [type, setType] = useState(preType || sessionDefaults?.type || 'technical');
  const [difficulty, setDifficulty] = useState(preDiff || sessionDefaults?.difficulty || 'medium');
  const [persona, setPersona] = useState('friendly');
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [useVoice, setUseVoice] = useState(sessionDefaults?.requireVoice || false);
  const [useVideo, setUseVideo] = useState(sessionDefaults?.requireVideo || false);
  const [useCodeEditor, setUseCodeEditor] = useState(sessionDefaults?.requireCodeEditor || false);
  const [selectedTopic, setSelectedTopic] = useState(sessionDefaults?.topic || '');
  const [topicSearch, setTopicSearch] = useState('');
  const [starting, setStarting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const startInterview = async () => {
    if (useVideo || useVoice) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: useVideo, audio: useVoice });
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        return toast.error("Camera/Mic permission is required to start the interview.");
      }
    }
    setStarting(true);
    try {
      const res = await axios.post('/api/interview/start', { type, topic: type === 'topic' ? selectedTopic : null, difficulty, persona, language: voiceLang, mode, sessionId, useResume: true });
      navigate(`/interview/${res.data.interviewId}`, {
        state: { questions: res.data.questions, useVoice, useVideo, useCodeEditor, voiceLang, type, difficulty, totalTimeSeconds: res.data.totalTimeSeconds }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
      setStarting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 text-[var(--t)] relative z-10 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <p className="text-[var(--o)] font-mono text-xs tracking-[5px] font-bold mb-3 uppercase opacity-90">Simulation Configuration</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight mb-4">Interview <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] to-[#FF8C42]">Setup</span></h1>
          <p className="text-[var(--t3)] text-lg font-light max-w-xl mx-auto">Calibrate the AI parameters to mirror your exact target interview environment.</p>
        </motion.div>

        {mode === 'admin_controlled' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] rounded-2xl p-5 mb-10 flex items-start gap-4 shadow-inner">
            <span className="text-[var(--o)] text-2xl animate-pulse">🔒</span>
            <div>
              <p className="text-[var(--t)] font-medium text-sm leading-relaxed mb-1">
                This session is managed by a recruiter. Vector and Difficulty are locked to <span className="text-[var(--o)] font-mono uppercase font-bold tracking-wider">{type === 'topic' ? selectedTopic || 'TOPIC' : type}</span> · <span className="text-[var(--score-yellow)] font-mono uppercase font-bold tracking-wider">{difficulty}</span>
              </p>
              <p className="text-[var(--t4)] text-xs">Environment and topics are strictly locked to the admin's specifications.</p>
            </div>
          </motion.div>
        )}

        {/* Sections Wrapper */}
        <div className="space-y-12">
          
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest mb-5 flex items-center gap-2 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[var(--t4)]" /> 1. Interview Vector</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TYPES.map(t => (
                <motion.div key={t.id} variants={itemVariants}
                  onClick={() => { if (!isSessionLocked) setType(t.id); }}
                  whileHover={!isSessionLocked ? { scale: 1.03, y: -4 } : {}}
                  whileTap={!isSessionLocked ? { scale: 0.97 } : {}}
                  className={`bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-6 transition-all duration-300 relative group overflow-hidden ${isSessionLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ 
                    borderColor: type === t.id ? 'var(--input-border)' : 'var(--border2)', 
                    boxShadow: type === t.id ? '0 10px 30px var(--od), inset 0 0 0 1px var(--o)' : '0 4px 20px rgba(0,0,0,0.1)' 
                  }}>
                  {type === t.id && <div className="absolute inset-0 bg-[var(--od)] opacity-50 pointer-events-none" />}
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-bottom-left">{t.icon}</div>
                  <p className="font-display font-bold text-[var(--t)] text-lg mb-2 relative z-10">{t.label}</p>
                  <p className="text-[var(--t4)] text-xs leading-relaxed relative z-10">{t.desc}</p>
                  {type === t.id && (
                    <motion.div layoutId="typeCheck" className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[var(--o)] flex items-center justify-center shadow-[0_0_15px_var(--o)]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5"><path d="M5 13l4 4L19 7" /></svg>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Topic Selector */}
          <AnimatePresence>
            {type === 'topic' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-2">
                  <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest mb-5 flex items-center gap-2 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[var(--o)] animate-pulse" /> Targeted Subject Context</p>
                  <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                    <input type="text" placeholder="Search 45+ specific topics (e.g. React.js, System Design, GraphQL)..." value={topicSearch} onChange={e => setTopicSearch(e.target.value)}
                      disabled={isSessionLocked}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl px-5 py-4 mb-6 outline-none focus:border-[var(--o)] focus:shadow-[0_0_0_2px_var(--od)] transition-all placeholder:text-[var(--placeholder)] text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
                    <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto pr-3 custom-scrollbar">
                      {TOPICS.filter(t => t.toLowerCase().includes(topicSearch.toLowerCase())).map(t => (
                        <button key={t} onClick={() => { if (!isSessionLocked) setSelectedTopic(t); }}
                          disabled={isSessionLocked}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all border ${selectedTopic === t ? 'bg-[var(--t)] text-[var(--bg)] border-[var(--t)] shadow-[0_4px_15px_rgba(255,255,255,0.2)]' : 'bg-transparent text-[var(--t3)] border-[var(--border)] hover:bg-[var(--card2)] hover:text-[var(--t)] hover:border-[var(--border2)]'} ${isSessionLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Difficulty */}
            <div>
              <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest mb-5 flex items-center gap-2 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[var(--t4)]" /> 2. Assessment Caliber</p>
              <div className="flex flex-col gap-3">
                {DIFFICULTIES.map(d => (
                  <motion.div key={d.id} variants={itemVariants} onClick={() => { if (!isSessionLocked) setDifficulty(d.id); }}
                    whileHover={!isSessionLocked ? { scale: 1.01, x: 4 } : {}} whileTap={!isSessionLocked ? { scale: 0.99 } : {}}
                    className={`bg-[var(--card)] backdrop-blur-xl border rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 ${isSessionLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ borderColor: difficulty === d.id ? d.color : 'var(--border2)', boxShadow: difficulty === d.id ? `0 8px 24px ${d.color}15, inset 0 0 0 1px ${d.color}40` : '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 relative flex items-center justify-center transition-colors" style={{ borderColor: difficulty === d.id ? d.color : 'var(--border)', background: difficulty === d.id ? d.color : 'transparent' }}>
                      {difficulty === d.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                      <p className="font-display font-bold text-[var(--t)] text-base mb-0.5">{d.label}</p>
                      <p className="text-[var(--t4)] text-xs">{d.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Persona */}
            <div>
              <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest mb-5 flex items-center gap-2 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[var(--t4)]" /> 3. Interrogator Persona</p>
              <div className="flex flex-col gap-3">
                {PERSONAS.map(p => (
                  <motion.div key={p.id} variants={itemVariants} onClick={() => setPersona(p.id)}
                    whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.99 }}
                    className={`bg-[var(--card)] backdrop-blur-xl border rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 cursor-pointer`}
                    style={{ borderColor: persona === p.id ? 'var(--input-border)' : 'var(--border2)', boxShadow: persona === p.id ? `0 8px 24px var(--od), inset 0 0 0 1px rgba(255,106,0,0.3)` : '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div className="text-2xl w-10 h-10 bg-[var(--card2)] rounded-full flex items-center justify-center border border-[var(--border2)]">{p.icon}</div>
                    <div className="flex-1">
                      <p className="font-display font-bold text-[var(--t)] text-base mb-0.5">{p.label}</p>
                      <p className="text-[var(--t4)] text-xs">{p.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${persona === p.id ? 'border-[var(--o)] bg-[var(--o)]' : 'border-[var(--border)] bg-transparent'}`} />
                  </motion.div>
                ))}
              </div>
            </div>
            
          </motion.div>

          {/* Environmental Toggles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest mb-5 flex items-center gap-2 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[var(--t4)]" /> 4. Environmental Toggles</p>
            <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { key: 'voice', label: 'Voice Input', desc: 'Speech-to-Text inference', icon: '🎙️', val: useVoice, set: setUseVoice },
                  { key: 'video', label: 'Webcam Optics', desc: 'Eye contact processing', icon: '📹', val: useVideo, set: setUseVideo },
                  { key: 'code', label: 'Code Engine', desc: 'Embedded IDE runtime', icon: '💻', val: useCodeEditor, set: setUseCodeEditor },
                ].map(f => (
                  <motion.div key={f.key} onClick={() => { if (!isSessionLocked) f.set(!f.val); }} whileHover={!isSessionLocked ? { scale: 1.02 } : undefined} whileTap={!isSessionLocked ? { scale: 0.98 } : undefined}
                    className={`flex flex-col items-start gap-4 p-6 rounded-2xl transition-all border ${isSessionLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ background: f.val ? 'var(--od)' : 'var(--bg)', borderColor: f.val ? 'var(--input-border)' : 'var(--border2)' }}>
                    <div className="flex w-full justify-between items-start">
                      <span className="text-2xl opacity-90">{f.icon}</span>
                      <div className={`w-11 h-6 rounded-full transition-all relative shadow-inner ${f.val ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF8C42]' : 'bg-[var(--border)]'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${f.val ? 'left-[22px]' : 'left-0.5'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[var(--t)] font-bold text-sm mb-1">{f.label}</p>
                      <p className="text-[var(--t4)] text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-[var(--border2)]">
                <p className="text-[var(--t)] font-bold text-sm mb-4">Select Dialect Region</p>
                <div className="flex flex-wrap gap-3">
                  {LANGUAGES.map(l => (
                    <button key={l.id} onClick={() => setVoiceLang(l.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all border ${voiceLang === l.id ? 'bg-[var(--o)] border-[var(--o)] text-white shadow-[0_4px_15px_var(--od)]' : 'bg-transparent border-[var(--border)] text-[var(--t3)] hover:text-[var(--t)] hover:bg-[var(--card)]'}`}>
                      <span className="text-lg">{l.icon}</span> <span className="text-sm font-semibold">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Start CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-6 relative">
            <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--border2)] rounded-3xl p-5 mb-8 flex items-center justify-center gap-3 w-fit mx-auto px-8 shadow-sm">
              <span className="text-[var(--o)] text-xl animate-pulse">⚡</span>
              <p className="text-[var(--t3)] text-sm font-medium">The AI engine will construct <strong className="text-[var(--t)]">8-10 targeted questions</strong> based on your selections and current resume.</p>
            </div>
            
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowRules(true)} disabled={starting || (type === 'topic' && !selectedTopic)}
              className="btn-primary w-full max-w-2xl mx-auto py-5 rounded-2xl font-display font-bold text-xl tracking-widest flex items-center justify-center gap-4 shadow-[0_12px_30px_var(--od)] border-none disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <>DEPLOY ENVIRONMENT <span className="group-hover:translate-x-1 transition-transform">→</span></>
            </motion.button>
          </motion.div>

        </div>
        
        {/* Rules Modal */}
        <AnimatePresence>
          {showRules && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[var(--card)] border border-[var(--border2)] rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-[var(--t4)] hover:text-[var(--t)] transition-colors">✕</button>
                
                <h2 className="text-2xl font-display font-bold text-[var(--t)] mb-2 tracking-tight flex items-center gap-3">
                  <span className="text-[var(--o)]">📋</span> Interview Rules & Guidelines
                </h2>
                <p className="text-[var(--t3)] text-sm mb-6">Please read these rules carefully before beginning your session.</p>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-8">
                  <div className="bg-[var(--bg2)] rounded-2xl p-5 border border-[var(--border2)]">
                    <h3 className="font-bold text-[var(--t)] mb-2 flex items-center gap-2">📷 Camera & Environment</h3>
                    <ul className="list-disc pl-5 text-sm text-[var(--t3)] space-y-2">
                      <li>Maintain eye contact with the camera. Looking away frequently is tracked.</li>
                      <li>Ensure your face is clearly visible and well-lit.</li>
                      <li>You must be alone in the room. Multiple faces will result in warnings and auto-submission.</li>
                    </ul>
                  </div>

                  <div className="bg-[var(--bg2)] rounded-2xl p-5 border border-[var(--border2)]">
                    <h3 className="font-bold text-[var(--t)] mb-2 flex items-center gap-2">💻 Browser & Device</h3>
                    <ul className="list-disc pl-5 text-sm text-[var(--t3)] space-y-2">
                      <li>Do not switch tabs or minimize the browser window. Doing so will trigger a warning.</li>
                      <li>Ensure your microphone and camera permissions are granted before starting.</li>
                      <li>Use a stable internet connection for the best experience.</li>
                    </ul>
                  </div>

                  <div className="bg-[var(--bg2)] rounded-2xl p-5 border border-[var(--border2)]">
                    <h3 className="font-bold text-[var(--t)] mb-2 flex items-center gap-2">⏱️ Time & Completion</h3>
                    <ul className="list-disc pl-5 text-sm text-[var(--t3)] space-y-2">
                      <li>The interview timer runs continuously. Manage your time effectively.</li>
                      <li>Do not remain completely silent while answering a question for extended periods. The AI will prompt you to continue or automatically move on.</li>
                      <li>Do not refresh the page during the interview. <strong>Refreshing will restart the interview from the first question.</strong></li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4 border-t border-[var(--border2)] mt-auto">
                  <button onClick={() => setShowRules(false)} className="flex-1 px-4 py-3 rounded-xl bg-[var(--input-bg)] text-[var(--t)] font-bold hover:bg-white/5 transition-colors">Cancel</button>
                   <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startInterview} disabled={starting}
                    className="btn-primary flex-[2] py-3 rounded-xl font-display font-bold tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_15px_var(--od)] border-none disabled:opacity-50 disabled:cursor-not-allowed">
                    {starting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> STARTING...</> : 'I AGREE & START INTERVIEW →'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
