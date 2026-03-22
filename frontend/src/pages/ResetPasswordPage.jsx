import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return setError('Password must be at least 6 characters.');
    if (pw !== confirmPw) return setError('Passwords do not match.');
    
    setLoading(true);
    setError(null);
    try {
      await axios.put(`/api/auth/resetpassword/${token}`, { password: pw });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#FF6A00] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 sm:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Reset Password</h2>
          <p className="text-[var(--t3)] text-sm">Create a secure new password for your account.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-[var(--t2)] mb-8">Password reset successfully.</p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/auth')}
              className="w-full py-3.5 rounded-xl bg-[#FF6A00] text-white font-bold tracking-wide shadow-[0_4px_15px_rgba(255,106,0,0.3)] transition-all hover:shadow-[0_4px_25px_rgba(255,106,0,0.5)]"
            >
              Back to Login
            </motion.button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[var(--t3)] font-mono text-[11px] uppercase tracking-widest mb-2 font-bold">New Password</label>
              <input 
                type="password" required 
                value={pw} onChange={e => setPw(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:border-[#FF6A00] transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-[var(--t3)] font-mono text-[11px] uppercase tracking-widest mb-2 font-bold">Confirm Password</label>
              <input 
                type="password" required 
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:border-[#FF6A00] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <motion.button 
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              className={`w-full py-3.5 rounded-xl text-white font-bold tracking-wide transition-all mt-4 ${loading ? 'bg-white/10 cursor-not-allowed' : 'bg-[#FF6A00] hover:bg-[#FF8C42] shadow-[0_4px_15px_rgba(255,106,0,0.3)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.5)]'}`}
            >
              {loading ? 'Processing...' : 'Secure Account'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
