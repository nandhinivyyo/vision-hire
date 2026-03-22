import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get(`/api/auth/verify/${token}`)
      .then((res) => {
        setStatus('success');
        setMsg(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMsg(err.response?.data?.message || 'Verification failed. Link may be invalid or expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Cinematic Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#FF6A00] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 sm:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative z-10 text-center"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center mb-8 shadow-inner" style={{
          background: status === 'verifying' ? 'rgba(255, 255, 255, 0.05)' : status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${status === 'verifying' ? 'var(--border2)' : status === 'success' ? '#10B98150' : '#F43F5E50'}`
        }}>
          {status === 'verifying' && <span className="text-3xl animate-pulse">⏳</span>}
          {status === 'success' && <span className="text-3xl">✅</span>}
          {status === 'error' && <span className="text-3xl">❌</span>}
        </div>

        <h2 className="text-3xl font-display font-bold text-white mb-3">
          {status === 'verifying' ? 'Verifying Account...' : status === 'success' ? 'Verification Complete!' : 'Verification Failed'}
        </h2>
        
        <p className="text-[var(--t3)] text-sm mb-8 leading-relaxed">
          {status === 'verifying' ? 'Please hold on while we securely validate your credentials.' : msg}
        </p>

        {status !== 'verifying' && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth')}
            className={`w-full py-3.5 rounded-xl font-bold tracking-wide shadow-lg transition-all ${status === 'success' ? 'bg-[#10B981] text-white hover:bg-emerald-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {status === 'success' ? 'Proceed to Login' : 'Return to Auth'}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
