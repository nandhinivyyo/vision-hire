import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const DEPARTMENTS  = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Chemical','Biomedical','MBA','MCA'];
const YEARS        = ['1','2','3','4','PG1','PG2'];
const DESIGNATIONS = ['Placement Officer','HOD','Professor','Associate Professor','Assistant Professor','Dean','Director','Principal','Coordinator','Industry Recruiter','Other'];

const Field = ({ label, name, type = 'text', options, value, onChange, required = true, error, helperText }) => (
  <div style={{ position: 'relative' }}>
    <label style={{ display:'block', color:'var(--t3)', fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:6 }}>
      {label}{required && <span style={{ color: 'var(--score-red)', marginLeft: 4 }}>*</span>}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(name, e.target.value)}
        style={{ background:'var(--input-bg)', border:'1px solid var(--input-border)', color:'var(--input-text)', fontFamily:'Inter', width:'100%', padding:'10px 14px', borderRadius:8, fontSize:14, outline:'none', cursor:'pointer' }}>
        {options.map(o => <option key={o} value={o} style={{ background:'var(--bg3)', color:'var(--t)' }}>{o}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        required={required}
        style={{ background:'var(--input-bg)', border:`1px solid ${error ? 'var(--score-red)' : 'var(--input-border)'}`, color:'var(--input-text)', fontFamily:'Inter', width:'100%', padding:'10px 14px', borderRadius:8, fontSize:14, outline:'none', transition:'border-color .2s', WebkitTextFillColor:'var(--input-text)' }}
        onFocus={e  => { e.target.style.borderColor=error ? 'var(--score-red)' : 'var(--o)'; e.target.style.boxShadow=error ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : '0 0 0 2px var(--od)'; }}
        onBlur={e   => { e.target.style.borderColor=error ? 'var(--score-red)' : 'var(--input-border)'; e.target.style.boxShadow='none'; }}
      />
    )}
    {error ? (
      <p style={{ color:'var(--score-red)', fontSize:11, fontFamily:'Inter', marginTop:4 }}>{error}</p>
    ) : helperText ? (
      <p style={{ color:'var(--t4)', fontSize:11, fontFamily:'Inter', marginTop:4 }}>{helperText}</p>
    ) : null}
  </div>
);

export default function AuthPage() {
  const [params]      = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get('mode') === 'register');
  const [isForgot, setIsForgot]     = useState(false);
  const [successReg, setSuccessReg] = useState(false);
  const [loading, setLoading]       = useState(false);
  
  const [form, setForm] = useState({
    name:'', rollNumber:'', registerNumber:'', collegeName:'',
    department:'Computer Science', year:'1', designation:'Placement Officer',
    email:'', phone:'', password:'', role:'student'
  });
  
  const [formErrors, setFormErrors] = useState({});
  const { login, register } = useAuth();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFormErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    if (isForgot) {
      setLoading(true);
      try {
        await axios.post('/api/auth/forgotpassword', { email: form.email });
        toast.success('If an account exists, a reset link was sent to that email.');
        setIsForgot(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send reset link.');
      } finally { setLoading(false); }
      return;
    }

    const errors = {};
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (isRegister) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(form.phone)) errors.phone = 'Phone number must be exactly 10 digits.';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        setSuccessReg(true);
      } else {
        const data = await login(form.email, form.password);
        toast.success(`Welcome back, ${data.name}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };
  const cardStyle = {
    background:'var(--card)', border:'1px solid var(--border)', borderRadius:12,
    padding:28, display:'flex', flexDirection:'column', gap:14,
    boxShadow:'var(--shadow-card)', transition:'background .3s, border-color .3s',
  };

  const toggleBtnStyle = (active) => ({
    flex:1, padding:'10px', borderRadius:8, border:'none', cursor:'pointer',
    fontFamily:'Outfit', fontWeight:700, fontSize:13, letterSpacing:1,
    textTransform:'uppercase', transition:'all .2s',
    background: active ? 'var(--o)' : 'transparent',
    color:       active ? '#fff'    : 'var(--t3)',
  });

  const roleCardStyle = (active) => ({
    flex:1, padding:'12px 10px', borderRadius:10, cursor:'pointer', transition:'all .2s', textAlign:'left',
    border:      `1px solid ${active ? 'var(--o)' : 'var(--border2)'}`,
    background:  active ? 'var(--od)' : 'transparent',
  });

  if (successReg) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 16px' }}>
         <motion.div style={{...cardStyle, width:'100%', maxWidth:440, alignItems:'center', textAlign:'center'}} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>
           <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--od)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
             <span style={{ fontSize:40 }}>✉️</span>
           </div>
           <h2 style={{ fontFamily:'Outfit', fontWeight:700, fontSize:28, color:'var(--t)', marginBottom:8 }}>Verify your Email</h2>
           <p style={{ color:'var(--t3)', fontSize:15, lineHeight:1.5, marginBottom:24 }}>
             We've sent a verification link to <strong style={{ color:'var(--t)' }}>{form.email}</strong>.<br/>
             Please check your inbox to activate your account.
           </p>
           <button onClick={() => { setSuccessReg(false); setIsRegister(false); }} style={{ width:'100%', background:'var(--card)', border:'1px solid var(--border)', color:'var(--t)', padding:14, borderRadius:8, cursor:'pointer', fontFamily:'Outfit', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
             Back to Login
           </button>
         </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', backgroundImage:'linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)', backgroundSize:'40px 40px', display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 16px', transition:'background .3s' }}>
      <motion.div style={{ width:'100%', maxWidth:540 }} initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>

        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--t3)', textDecoration:'none', fontFamily:'JetBrains Mono', fontSize:12, marginBottom:16, padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', transition:'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--o)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}>
          ← Back to Home
        </Link>

        <Link to="/" style={{ fontFamily:'Outfit', fontWeight:700, fontSize:22, color:'var(--t)', letterSpacing:3, textDecoration:'none', display:'block', textAlign:'center', marginBottom:20 }}>
          VISION<span style={{ color:'var(--o)' }}>HIRE</span>
          <span style={{ color:'var(--t4)', fontSize:11, marginLeft:6, fontFamily:'JetBrains Mono' }}>AI</span>
        </Link>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h1 style={{ fontFamily:'Outfit', fontWeight:700, fontSize:28, color:'var(--t)', marginBottom:4 }}>
            {isForgot ? 'Reset Password' : isRegister ? 'Student Registration' : 'Welcome Back'}
          </h1>
          <p style={{ color:'var(--t3)', fontSize:14 }}>
            {isForgot ? 'Enter your email to receive a reset link' : isRegister ? 'Join the AI interview revolution' : 'Sign in to continue your journey'}
          </p>
        </div>

        {!isForgot && (
          <div style={{ display:'flex', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:4, marginBottom:18, transition:'background .3s' }}>
            <button type="button" style={toggleBtnStyle(!isRegister)} onClick={() => setIsRegister(false)}>Login</button>
            <button type="button" style={toggleBtnStyle(isRegister)}  onClick={() => setIsRegister(true)}>Register</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={cardStyle}>
          <AnimatePresence>
            {!isForgot && isRegister && (
              <motion.div key="reg-fields" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:14 }}>
                <div style={grid2}>
                  <Field label="Full Name" name="name"  value={form.name}  onChange={set} />
                  <Field label="Phone"     name="phone" value={form.phone} onChange={set} type="tel" error={formErrors.phone} />
                </div>

                <motion.div key="student-fields" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:14 }}>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Always-visible email field */}
          <Field label="Email Address" name="email" value={form.email} onChange={set} type="email" error={formErrors.email} />

          {/* Password field hidden ONLY if Forgot Password is active */}
          {!isForgot && (
            <div>
              <Field label="Password" name="password" value={form.password} onChange={set} type="password" error={formErrors.password} helperText="Must be at least 6 characters long." />
              {!isRegister && (
                <div style={{ textAlign:'right', marginTop:6 }}>
                  <button type="button" onClick={() => setIsForgot(true)} style={{ color:'var(--t3)', background:'none', border:'none', fontSize:12, cursor:'pointer' }}>
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          <motion.button type="submit" disabled={loading}
            style={{ background:'linear-gradient(135deg,var(--o),var(--o2))', color:'var(--t)', border:'none', borderRadius:8, padding:'14px', fontFamily:'Outfit', fontWeight:700, fontSize:15, letterSpacing:2, textTransform:'uppercase', cursor: loading ? 'not-allowed':'pointer', boxShadow:'0 0 24px var(--og)', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, opacity: loading ? 0.7 : 1 }}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}>
            {loading
              ? <><div style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite' }} />Processing...</>
              : (isForgot ? 'Send Reset Link' : isRegister ? 'Create Account →' : 'Sign In →')
            }
          </motion.button>

          <p style={{ textAlign:'center', color:'var(--t4)', fontSize:13, marginTop:4 }}>
            {isForgot ? (
              <button type="button" onClick={() => setIsForgot(false)} style={{ color:'var(--o)', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:13, textDecoration:'underline' }}>Return to Login</button>
            ) : isRegister ? (
              <>Already have an account? <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ color:'var(--o)', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:13, textDecoration:'underline' }}>Sign In</button></>
            ) : (
              <>Don't have an account? <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ color:'var(--o)', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:13, textDecoration:'underline' }}>Register Free</button></>
            )}
          </p>
        </form>

      </motion.div>
    </div>
  );
}
