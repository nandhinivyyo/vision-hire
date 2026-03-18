import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEPARTMENTS  = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Chemical','Biomedical','MBA','MCA'];
const YEARS        = ['1','2','3','4','PG1','PG2'];
const DESIGNATIONS = ['Placement Officer','HOD','Professor','Associate Professor','Assistant Professor','Dean','Director','Principal','Coordinator','Industry Recruiter','Other'];

/* ─── Field component — defined OUTSIDE to prevent remount bug ─── */
const Field = ({ label, name, type = 'text', options, value, onChange, required = true }) => (
  <div>
    <label style={{ display:'block', color:'var(--t3)', fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:6 }}>
      {label}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(name, e.target.value)}
        style={{ background:'var(--input-bg)', border:'1px solid var(--input-border)', color:'var(--input-text)', fontFamily:'Exo 2', width:'100%', padding:'10px 14px', borderRadius:8, fontSize:14, outline:'none', cursor:'pointer' }}>
        {options.map(o => <option key={o} value={o} style={{ background:'var(--bg3)', color:'var(--t)' }}>{o}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        required={required}
        style={{ background:'var(--input-bg)', border:'1px solid var(--input-border)', color:'var(--input-text)', fontFamily:'Exo 2', width:'100%', padding:'10px 14px', borderRadius:8, fontSize:14, outline:'none', transition:'border-color .2s', WebkitTextFillColor:'var(--input-text)' }}
        onFocus={e  => { e.target.style.borderColor='var(--o)'; e.target.style.boxShadow='0 0 0 2px var(--od)'; }}
        onBlur={e   => { e.target.style.borderColor='var(--input-border)'; e.target.style.boxShadow='none'; }}
      />
    )}
  </div>
);

export default function AuthPage() {
  const [params]      = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get('mode') === 'register');
  const [loading, setLoading]       = useState(false);
  const [form, setForm] = useState({
    name:'', rollNumber:'', registerNumber:'', collegeName:'',
    department:'Computer Science', year:'1', designation:'Placement Officer',
    email:'', phone:'', password:'', role:'student'
  });
  const { login, register } = useAuth();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const isAdmin = form.role === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success('Account created! Welcome to VisionHire AI');
      } else {
        const data = await login(form.email, form.password);
        toast.success(`Welcome back, ${data.name}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };

  /* ── Reusable style objects using CSS vars ── */
  const cardStyle = {
    background:'var(--card)',
    border:'1px solid var(--border)',
    borderRadius:12,
    padding:28,
    display:'flex', flexDirection:'column', gap:14,
    boxShadow:'var(--shadow-card)',
    transition:'background .3s, border-color .3s',
  };

  const toggleBtnStyle = (active) => ({
    flex:1, padding:'10px', borderRadius:8, border:'none', cursor:'pointer',
    fontFamily:'Rajdhani', fontWeight:700, fontSize:13, letterSpacing:1,
    textTransform:'uppercase', transition:'all .2s',
    background: active ? 'var(--o)' : 'transparent',
    color:       active ? '#fff'    : 'var(--t3)',
  });

  const roleCardStyle = (active) => ({
    flex:1, padding:'12px 10px', borderRadius:10, cursor:'pointer', transition:'all .2s', textAlign:'left',
    border:      `1px solid ${active ? 'var(--o)' : 'var(--border2)'}`,
    background:  active ? 'var(--od)' : 'transparent',
  });

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', backgroundImage:'linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)', backgroundSize:'40px 40px', display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 16px', transition:'background .3s' }}>
      <motion.div style={{ width:'100%', maxWidth:540 }} initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>

        {/* Back to home button */}
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--t3)', textDecoration:'none', fontFamily:'JetBrains Mono', fontSize:12, marginBottom:16, padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', transition:'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--o)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}>
          ← Back to Home
        </Link>

        {/* Logo */}
        <Link to="/" style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:22, color:'var(--t)', letterSpacing:3, textDecoration:'none', display:'block', textAlign:'center', marginBottom:20 }}>
          VISION<span style={{ color:'var(--o)' }}>HIRE</span>
          <span style={{ color:'var(--t4)', fontSize:11, marginLeft:6, fontFamily:'JetBrains Mono' }}>AI</span>
        </Link>

        {/* Heading */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:28, color:'var(--t)', marginBottom:4 }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ color:'var(--t3)', fontSize:14 }}>
            {isRegister ? 'Join the AI interview revolution' : 'Sign in to continue your journey'}
          </p>
        </div>

        {/* Login / Register toggle */}
        <div style={{ display:'flex', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:18, transition:'background .3s' }}>
          <button type="button" style={toggleBtnStyle(!isRegister)} onClick={() => setIsRegister(false)}>Login</button>
          <button type="button" style={toggleBtnStyle(isRegister)}  onClick={() => setIsRegister(true)}>Register</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={cardStyle}>

          <AnimatePresence>
            {isRegister && (
              <motion.div key="reg-fields"
                initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:14 }}>

                {/* Role selector */}
                <div>
                  <label style={{ display:'block', color:'var(--t3)', fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 }}>
                    I am a
                  </label>
                  <div style={{ display:'flex', gap:10 }}>
                    {[
                      { val:'student', label:'Student',       icon:'🎓', desc:'Looking to practice & improve' },
                      { val:'admin',   label:'Admin / Faculty',icon:'⚙️', desc:'Managing interview sessions'   }
                    ].map(r => (
                      <button key={r.val} type="button" onClick={() => set('role', r.val)} style={roleCardStyle(form.role === r.val)}>
                        <div style={{ fontSize:18, marginBottom:4 }}>{r.icon}</div>
                        <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:14, color: form.role === r.val ? 'var(--o)' : 'var(--t)', letterSpacing:1 }}>{r.label}</div>
                        <div style={{ color:'var(--t4)', fontSize:11, marginTop:2 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common fields */}
                <div style={grid2}>
                  <Field label="Full Name" name="name"  value={form.name}  onChange={set} />
                  <Field label="Phone"     name="phone" value={form.phone} onChange={set} type="tel" />
                </div>

                {/* Student-only */}
                <AnimatePresence>
                  {!isAdmin && (
                    <motion.div key="student-fields"
                      initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:14 }}>
                      <div style={grid2}>
                        <Field label="Roll Number"     name="rollNumber"     value={form.rollNumber}     onChange={set} />
                        <Field label="Register Number" name="registerNumber" value={form.registerNumber} onChange={set} />
                      </div>
                      <div style={grid2}>
                        <Field label="Year"       name="year"       value={form.year}       onChange={set} options={YEARS} />
                        <Field label="Department" name="department" value={form.department} onChange={set} options={DEPARTMENTS} />
                      </div>
                      <Field label="College Name" name="collegeName" value={form.collegeName} onChange={set} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admin-only */}
                <AnimatePresence>
                  {isAdmin && (
                    <motion.div key="admin-fields"
                      initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:14 }}>
                      <div style={grid2}>
                        <Field label="Designation" name="designation" value={form.designation} onChange={set} options={DESIGNATIONS} />
                        <Field label="Department"  name="department"  value={form.department}  onChange={set} options={DEPARTMENTS} />
                      </div>
                      <Field label="Institution / College Name" name="collegeName" value={form.collegeName} onChange={set} />
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Always-visible fields */}
          <Field label="Email Address" name="email"    value={form.email}    onChange={set} type="email" />
          <Field label="Password"      name="password" value={form.password} onChange={set} type="password" />

          {/* Submit */}
          <motion.button type="submit" disabled={loading}
            style={{ background:'linear-gradient(135deg,var(--o),var(--o2))', color:'var(--t)', border:'none', borderRadius:8, padding:'14px', fontFamily:'Rajdhani', fontWeight:700, fontSize:15, letterSpacing:2, textTransform:'uppercase', cursor: loading ? 'not-allowed':'pointer', boxShadow:'0 0 24px var(--og)', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, opacity: loading ? 0.7 : 1 }}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}>
            {loading
              ? <><div style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }} />Processing...</>
              : (isRegister ? 'Create Account →' : 'Sign In →')
            }
          </motion.button>

          {/* Footer link */}
          <p style={{ textAlign:'center', color:'var(--t4)', fontSize:13, marginTop:4 }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={() => setIsRegister(!isRegister)}
              style={{ color:'var(--o)', background:'none', border:'none', cursor:'pointer', fontFamily:'Exo 2', fontSize:13, textDecoration:'underline' }}>
              {isRegister ? 'Sign In' : 'Register Free'}
            </button>
          </p>
        </form>

      </motion.div>
    </div>
  );
}
