import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: '🤖', title: 'AI-Powered Questions',  desc: 'Gemini AI generates dynamic questions tailored to your resume and real-time answers.' },
  { icon: '🎙️', title: 'Voice Interview',        desc: 'Speak your answers naturally. Speech-to-text captures and evaluates every response.' },
  { icon: '📹', title: 'Video Monitoring',       desc: 'Webcam tracks eye contact, posture, and confidence in real time.' },
  { icon: '📊', title: 'Deep Analytics',         desc: 'Skill gap reports with scores across technical, communication, and problem-solving.' },
  { icon: '🏆', title: 'Leaderboard',            desc: 'Compete with peers filtered by department, year, and college.' },
  { icon: '📄', title: 'Resume Intelligence',    desc: 'Upload PDF — AI extracts skills and tailors every question to your background.' },
];

export default function LandingPage() {
  const canvasRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 1000], [0, 250]); // Parallax scroll for hero

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDark) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.4, a: Math.random() * 0.25 + 0.05,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${p.a})`; ctx.fill();
      });
      // Connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(249,115,22,${0.05 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [isDark]);

  const smoothCurve = [0.16, 1, 0.3, 1];

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-x-hidden transition-colors duration-300 font-sans text-[var(--t)] relative">
      {isDark && <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />}
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />

      {/* NAV */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: smoothCurve }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border2)] bg-[var(--nav-bg)] backdrop-blur-2xl transition-colors duration-300"
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <motion.span whileHover={{ scale: 1.02 }} className="font-display font-bold text-[var(--t)] tracking-[0.2em] text-xl cursor-default">
            VISION<span className="text-[var(--o)]">HIRE</span>
            <span className="text-[rgba(234,88,12,0.45)] text-[11px] ml-1.5 font-mono">AI</span>
          </motion.span>
          
          <div className="flex items-center gap-4">
            <motion.button 
              onClick={toggleTheme} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] cursor-pointer shadow-sm transition-colors"
            >
              <motion.span animate={{ opacity: isDark ? 0.4 : 1 }} className="text-sm shadow-none">☀️</motion.span>
              <div className="w-8 h-4 bg-[var(--od)] rounded-full relative border border-[var(--border)]">
                <motion.div 
                  animate={{ x: isDark ? 1 : 14 }} 
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-[1px] w-3 h-3 rounded-full bg-[var(--o)]" 
                />
              </div>
              <motion.span animate={{ opacity: isDark ? 1 : 0.4 }} className="text-sm shadow-none">🌙</motion.span>
            </motion.button>

            <Link to="/auth" className="text-[var(--t3)] font-display text-sm tracking-wide px-3 py-1.5 transition-colors hover:text-[var(--t)] relative group">
              Login
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--t)] origin-right scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-hover:origin-left" />
            </Link>
            
            <Link to="/auth?mode=register">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-5 py-2 text-sm ml-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
                Register Free
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-[64px]">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center overflow-hidden">
          <motion.div style={{ y: yHero }} className="max-w-[1000px] mx-auto px-6 text-center w-full z-10">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: smoothCurve }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--od)] mb-8 shadow-[0_0_20px_var(--od)] backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--o)] animate-pulse" />
              <span className="text-[var(--o)] text-[11px] font-mono tracking-[0.25em] font-semibold opacity-90 uppercase">Powered by Google Gemini AI</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: smoothCurve }}
              className="font-display font-bold leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            >
              <span className="text-[var(--t)]">ACE YOUR</span><br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] drop-shadow-[0_0_15px_rgba(255,106,0,0.4)]">INTERVIEW</span><br />
              <span className="text-[var(--t4)] text-[0.45em] tracking-[0.15em] font-medium leading-none block mt-2">WITH AI PRECISION</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-[var(--t3)] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light"
            >
              Resume analysis, voice-based mock interviews, webcam body language monitoring, and deep skill gap reports. The ultimate practice platform.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: smoothCurve }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/auth?mode=register">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,106,0,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] text-white border-none rounded-2xl px-8 py-4 font-display font-bold text-lg tracking-wide shadow-[0_8px_30px_rgba(255,106,0,0.3)] transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  Start Free Interview <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </motion.button>
              </Link>
              <Link to="/auth">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-transparent border border-[var(--border)] text-[var(--t)] rounded-2xl px-8 py-4 font-display font-semibold text-lg hover:bg-[var(--card)] transition-colors shadow-sm"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
            
          </motion.div>
        </section>

        {/* STATISTICS */}
        <section className="relative z-10 w-full bg-[var(--bg2)] border-y border-[var(--border2)] py-12 backdrop-blur-xl">
          <div className="max-w-[1000px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { val: '50K+', label: 'Mock Sessions' },
               { val: '98%', label: 'Accuracy Rate' },
               { val: '200+', label: 'Organizations' },
               { val: '15+', label: 'AI Endpoints' }
             ].map((stat, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: '-50px' }}
                 transition={{ delay: i * 0.1, duration: 0.6, ease: smoothCurve }}
                 className="text-center"
               >
                 <div className="font-display font-bold text-4xl sm:text-5xl text-[var(--o)] mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(255,106,0,0.2)]">{stat.val}</div>
                 <div className="text-[var(--t4)] text-xs tracking-widest font-mono uppercase font-semibold">{stat.label}</div>
               </motion.div>
             ))}
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: smoothCurve }}
              className="text-center mb-20"
            >
              <div className="text-[var(--o)] font-mono text-sm tracking-[0.3em] font-bold mb-4 uppercase">Capabilities</div>
              <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-[var(--t)] tracking-tight">
                Everything to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] to-[#FF8C42]">Get Hired</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: Math.min(i * 0.1, 0.5), duration: 0.6, ease: smoothCurve }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    borderColor: 'rgba(255,106,0,0.4)',
                    boxShadow: '0 20px 40px -10px rgba(255,106,0,0.15)'
                  }}
                  className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 flex flex-col items-start transition-all cursor-default will-change-transform"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--od)] border border-[var(--border)] flex items-center justify-center text-3xl mb-6 shadow-inner">
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold text-xl text-[var(--t)] mb-3">{f.title}</h3>
                  <p className="text-[var(--t3)] text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="relative z-10 py-24 px-6 overflow-hidden">
          {isDark && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--o)] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />}
          
          <div className="max-w-[800px] mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: smoothCurve }}
              className="bg-[var(--bg2)] backdrop-blur-2xl border border-[var(--border)] rounded-[40px] p-12 md:p-20 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--o)] to-transparent opacity-50" />
              
              <h2 className="font-display font-bold text-4xl md:text-5xl text-[var(--t)] tracking-tight mb-6">
                Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] to-[#FF8C42]">Crush</span> It?
              </h2>
              <p className="text-[var(--t3)] text-lg mb-10 max-w-lg mx-auto">Join the ranks of thousands of students mastering their engineering interviews with true AI precision.</p>
              
              <Link to="/auth?mode=register">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,106,0,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[var(--t)] text-[var(--bg)] border-none rounded-2xl px-10 py-4 font-display font-bold text-lg tracking-wide shadow-lg transition-all"
                >
                  Launch Simulator Now
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-[var(--border2)] py-8 px-6 text-center text-[var(--t4)] font-mono text-xs tracking-widest uppercase">
        © 2025 VisionHire AI Studio — Engineered with Google Gemini
      </footer>
    </div>
  );
}
