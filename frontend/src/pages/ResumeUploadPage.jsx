import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [existingResume, setExistingResume] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    axios.get('/api/resume/my-resume').then(r => {
      if (r.data?.resumeData?.skills?.length) setExistingResume(r.data.resumeData);
    }).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') return toast.error('Please upload a PDF file');
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB)');
    setUploading(true);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const res = await axios.post('/api/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnalysis(res.data.analysis);
      toast.success('Resume analyzed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const Section = ({ title, items, color = '#f97316' }) => items?.length > 0 ? (
    <div>
      <p className="text-xs font-mono tracking-wider mb-2" style={{ color }}>{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => <span key={i} className="skill-tag">{item}</span>)}
      </div>
    </div>
  ) : null;

  const data = analysis || existingResume;

  return (
    <div className="min-h-screen pt-20 px-6 pb-16" style={{ fontFamily: 'Exo 2, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-orange-500/60 font-mono text-xs tracking-[4px] mb-2">RESUME INTELLIGENCE</p>
          <h1 className="font-display font-bold text-4xl text-white mb-2">Upload Your <span className="text-orange-400">Resume</span></h1>
          <p className="text-white/40">AI extracts your skills and tailors every interview question to your background</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload zone */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="relative flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer transition-all duration-300"
              style={{
                border: `2px dashed ${dragging ? '#f97316' : 'rgba(249,115,22,0.25)'}`,
                background: dragging ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.02)',
                boxShadow: dragging ? '0 0 40px rgba(249,115,22,0.15)' : 'none',
                minHeight: 280,
              }}>
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <AnimatePresence mode="wait">
                {uploading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <div className="w-16 h-16 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-orange-400 font-display font-bold text-lg">Analyzing with Gemini AI...</p>
                    <p className="text-white/30 text-sm mt-1">Extracting skills, projects, technologies</p>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
                      style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                      📄
                    </div>
                    <p className="font-display font-bold text-xl text-white mb-1">Drop your PDF here</p>
                    <p className="text-white/40 text-sm mb-4">or click to browse</p>
                    <p className="text-white/20 text-xs font-mono">PDF only · Max 10MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/setup', { state: { mode: 'practice' } })}
              className="w-full mt-4 py-3.5 rounded-xl font-display text-sm tracking-wide transition-all"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
              Skip Resume → Start Interview
            </motion.button>
          </motion.div>

          {/* Analysis result */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <AnimatePresence mode="wait">
              {data ? (
                <motion.div key="analysis" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-6 h-full space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl text-white">AI Analysis</h3>
                    <span className="text-green-400 text-xs font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      PARSED
                    </span>
                  </div>
                  {data.summary && <p className="text-white/50 text-sm leading-relaxed">{data.summary}</p>}
                  <Section title="SKILLS" items={data.skills} />
                  <Section title="TECHNOLOGIES" items={data.technologies} />
                  <Section title="EXPERIENCE" items={data.experience} />
                  {data.projects?.length > 0 && (
                    <div>
                      <p className="text-xs font-mono tracking-wider mb-2 text-orange-400/60">PROJECTS</p>
                      <ul className="space-y-1.5">
                        {data.projects.map((p, i) => (
                          <li key={i} className="text-white/50 text-xs flex items-start gap-2 leading-relaxed">
                            <span className="text-orange-500 mt-0.5">›</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/setup', { state: { mode: 'practice', resumeLoaded: true } })}
                    className="btn-orange w-full py-3.5 rounded-xl font-display text-sm tracking-wide">
                    Start AI Interview with My Resume →
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card p-8 h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="text-5xl opacity-30">🤖</div>
                  <p className="font-display text-xl text-white/40">AI Analysis Awaits</p>
                  <p className="text-white/25 text-sm">Upload your resume to see extracted skills, technologies, and personalized interview questions</p>
                  <div className="space-y-2 w-full mt-4">
                    {['Skill extraction', 'Project analysis', 'Technology mapping', 'Custom questions'].map(f => (
                      <div key={f} className="flex items-center gap-3 text-white/20 text-sm">
                        <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
