import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDark) return; // particles only in dark mode
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.4, a: Math.random() * 0.25 + 0.07,
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
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(249,115,22,${0.06 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [isDark]);

  const T = {
    // Dynamic inline style helpers using CSS vars
    page: { minHeight:'100vh', background:'var(--bg)', overflowX:'hidden', transition:'background .3s' },
    nav: { position:'fixed', top:0, left:0, right:0, zIndex:50, borderBottom:'1px solid var(--border2)', background:'var(--nav-bg)', backdropFilter:'blur(20px)', transition:'background .3s' },
    heroSection: {
      position:'relative', zIndex:10, minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center', paddingTop:64,
      backgroundImage:'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
      backgroundSize:'40px 40px',
    },
    featCard: {
      background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:24,
      cursor:'default', transition:'all .3s',
      boxShadow: isDark ? 'none' : 'var(--shadow-card)',
    },
    cta: {
      background:'var(--card)', border:'1px solid var(--border)', borderRadius:18,
      padding:'56px 48px', transition:'all .3s',
      boxShadow: isDark ? '0 0 60px rgba(234,88,12,0.1)' : '0 8px 40px rgba(234,88,12,0.12)',
    }
  };

  return (
    <div style={T.page}>
      {isDark && <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />}

      {/* NAV */}
      <nav style={T.nav}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'Rajdhani', fontWeight:700, color:'var(--t)', letterSpacing:3, fontSize:20 }}>
            VISION<span style={{ color:'var(--o)' }}>HIRE</span>
            <span style={{ color:'rgba(234,88,12,0.45)', fontSize:11, marginLeft:6, fontFamily:'JetBrains Mono' }}>AI</span>
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Inline toggle for landing page */}
            <motion.button onClick={toggleTheme} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--card)', cursor:'pointer' }}>
              <motion.span animate={{ opacity: isDark ? 0.4:1 }} style={{ fontSize:14 }}>☀️</motion.span>
              <div style={{ width:34, height:18, background: isDark ? 'rgba(249,115,22,0.15)':'rgba(234,88,12,0.2)', borderRadius:9, position:'relative', border:'1px solid var(--border)' }}>
                <motion.div animate={{ x: isDark ? 1:16 }} transition={{ type:'spring', stiffness:400, damping:25 }}
                  style={{ position:'absolute', top:1, width:14, height:14, borderRadius:'50%', background:'var(--o)' }} />
              </div>
              <motion.span animate={{ opacity: isDark ? 1:0.4 }} style={{ fontSize:14 }}>🌙</motion.span>
            </motion.button>

            <Link to="/auth" style={{ color:'var(--t3)', fontFamily:'Rajdhani', fontSize:14, letterSpacing:1, textDecoration:'none', padding:'6px 12px', transition:'color .2s' }}
              onMouseEnter={e => e.target.style.color='var(--t)'} onMouseLeave={e => e.target.style.color='var(--t3)'}>
              Login
            </Link>
            <Link to="/auth?mode=register" className="btn-primary" style={{ padding:'10px 22px', fontSize:13 }}>
              Register Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={T.heroSection}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px', textAlign:'center', position:'relative', zIndex:1 }}>
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:9999, border:'1px solid var(--border)', background:'var(--od)', marginBottom:28 }}>
            <span className="record-dot" />
            <span style={{ color:'var(--o)', fontSize:11, fontFamily:'JetBrains Mono', letterSpacing:4, opacity:0.8 }}>POWERED BY GOOGLE GEMINI AI</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.1 }}
            style={{ fontFamily:'Rajdhani', fontWeight:700, lineHeight:1.05, marginBottom:22, fontSize:'clamp(2.5rem, 7vw, 5rem)' }}>
            <span style={{ color:'var(--t)' }}>ACE YOUR</span><br />
            <span className="gradient-text">INTERVIEW</span><br />
            <span style={{ color:'var(--t4)', fontSize:'0.48em', letterSpacing:'0.18em' }}>WITH AI PRECISION</span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
            style={{ color:'var(--t3)', fontSize:17, maxWidth:560, margin:'0 auto 32px', lineHeight:1.75 }}>
            Resume analysis, voice-based mock interviews, webcam body language monitoring,
            and deep skill gap reporting — all in one AI-powered platform.
          </motion.p>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/auth?mode=register" className="btn-primary" style={{ padding:'14px 32px', fontSize:15 }}>
              Start Free Interview →
            </Link>
            <Link to="/auth" className="btn-ghost" style={{ padding:'14px 32px', fontSize:15 }}>
              Sign In
            </Link>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
            style={{ marginTop:56, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, maxWidth:560, margin:'56px auto 0' }}>
            {[['50K+','Mock Interviews'],['98%','Accuracy Rate'],['200+','Colleges'],['15+','AI Models']].map(([v,l],i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:26, color:'var(--o)' }}>{v}</div>
                <div style={{ color:'var(--t4)', fontSize:10, letterSpacing:2, marginTop:4, fontFamily:'JetBrains Mono', textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position:'relative', zIndex:10, padding:'72px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ color:'rgba(234,88,12,0.55)', fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:5, marginBottom:10 }}>CAPABILITIES</div>
            <h2 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:34, color:'var(--t)' }}>
              Everything to <span className="gradient-text">Get Hired</span>
            </h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
            {features.map((f,i) => (
              <motion.div key={i} initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay:i*0.08 }} viewport={{ once:true }}
                whileHover={{ y:-4, borderColor:'rgba(234,88,12,0.5)' }}
                style={T.featCard}>
                <div style={{ fontSize:30, marginBottom:12 }}>{f.icon}</div>
                <h3 style={{ fontFamily:'Rajdhani', fontWeight:700, color:'var(--t)', fontSize:19, marginBottom:7, letterSpacing:1 }}>{f.title}</h3>
                <p style={{ color:'var(--t3)', fontSize:14, lineHeight:1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative', zIndex:10, padding:'48px 24px 80px' }}>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <motion.div initial={{ opacity:0, scale:0.96 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} style={T.cta}>
            <h2 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:38, color:'var(--t)', marginBottom:14 }}>
              Ready to <span className="gradient-text">Crush</span> Your Interview?
            </h2>
            <p style={{ color:'var(--t3)', marginBottom:28, fontSize:16 }}>Join thousands of students leveling up with VisionHire AI.</p>
            <Link to="/auth?mode=register" className="btn-primary" style={{ padding:'14px 40px', fontSize:15 }}>
              Create Free Account →
            </Link>
          </motion.div>
        </div>
      </section>

      <footer style={{ position:'relative', zIndex:10, borderTop:'1px solid var(--border2)', padding:'20px 24px', textAlign:'center', color:'var(--t4)', fontSize:12, fontFamily:'JetBrains Mono', transition:'all .3s' }}>
        © 2025 VisionHire AI — Powered by Google Gemini
      </footer>
    </div>
  );
}
