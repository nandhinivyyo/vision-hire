import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <motion.button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
        borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card)',
        cursor: 'pointer', transition: 'all .3s', flexShrink: 0,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span animate={{ opacity: isDark ? 0.35 : 1, scale: isDark ? 0.8 : 1 }} transition={{ duration: 0.3 }} style={{ fontSize: 14, lineHeight: 1 }}>☀️</motion.span>
      <div style={{ width: 36, height: 20, background: isDark ? 'rgba(255,106,0,0.15)' : 'rgba(255,106,0,0.2)', borderRadius: 10, position: 'relative', border: '1px solid var(--border)', transition: 'background .3s' }}>
        <motion.div animate={{ x: isDark ? 2 : 18 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: 'var(--o)' }} />
      </div>
      <motion.span animate={{ opacity: isDark ? 1 : 0.35, scale: isDark ? 1 : 0.8 }} transition={{ duration: 0.3 }} style={{ fontSize: 14, lineHeight: 1 }}>🌙</motion.span>
    </motion.button>
  );
}

export default function Navbar({ onMenuClick }) {
  const { user, setUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', collegeName: '', department: '', year: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [profileModal, setProfileModal] = useState({ isOpen: false });

  const parts = location.pathname.split('/');
  const rawTitle = parts[1] || 'Home';
  const displayTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  const openProfileModal = () => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        collegeName: user.collegeName || '',
        department: user.department || '',
        year: user.year || ''
      });
    }
    setProfileModal({ isOpen: true });
    setDeleteConfirm(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await axios.patch('/api/users/profile', profileForm);
      setUser(res.data);
      setProfileModal({ isOpen: false });
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSavingProfile(false);
    }
  };
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await axios.post('/api/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('/api/users/profile');
      logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-8 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border2)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="hidden sm:block text-xl font-display font-semibold text-white tracking-wide">{displayTitle}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-4 pl-4 border-l border-[var(--border2)]">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white tracking-tight">{user.name}</p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#FF6A00]">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-[0_4px_15px_rgba(255,106,0,0.3)] bg-[var(--od)] text-[var(--o)] border border-[var(--border)] overflow-hidden">
              {user.avatar ? <img src={`${process.env.REACT_APP_API_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" /> : user.name?.[0]?.toUpperCase()}
            </div>
            {user.role === 'student' && (
              <button onClick={openProfileModal} className="ml-3 text-[11px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest bg-[var(--card)] hover:bg-[var(--card2)] px-3 py-1.5 rounded-lg border border-[var(--border2)]">
                Edit
              </button>
            )}
            <button onClick={logout} className="ml-2 text-[11px] font-bold text-white/40 hover:text-[#FF6A00] transition-colors uppercase tracking-widest bg-[var(--card)] hover:bg-[var(--card2)] px-3 py-1.5 rounded-lg border border-[var(--border2)]">
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>

      {/* Profile Modification Modal */}
      {createPortal(
        <AnimatePresence>
          {profileModal.isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'auto' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--card)] border border-[var(--border2)] rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={() => setProfileModal({ isOpen: false })} className="absolute top-6 right-6 text-[var(--t4)] hover:text-white transition-colors">✕</button>
                <h2 className="text-2xl font-display font-bold text-white mb-6">Edit Profile</h2>

                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-[var(--od)] border border-[var(--border)] flex items-center justify-center font-bold text-3xl text-[var(--o)] overflow-hidden relative group">
                      {user?.avatar ? <img src={`${process.env.REACT_APP_API_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
                      <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{uploadingAvatar ? '...' : 'Upload'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-[var(--t)] font-display text-lg font-bold">{user?.name}</h3>
                      <p className="text-[var(--t4)] text-xs font-mono uppercase tracking-widest">{user?.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[['name', 'Full Name'], ['phone', 'Phone Number'], ['collegeName', 'College Name'], ['department', 'Department'], ['year', 'Year / Grade']].map(([k, l]) => (
                      <div key={k}>
                        <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">{l}</label>
                        <input type="text" value={profileForm[k]} onChange={e => setProfileForm(f => ({ ...f, [k]: e.target.value }))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[#FF6A00] transition-colors focus:shadow-[0_0_0_2px_rgba(255,106,0,0.2)]" required />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end pt-6 mt-6 border-t border-[var(--border2)] gap-6 sm:gap-0">
                    {!deleteConfirm ? (
                      <button type="button" onClick={() => setDeleteConfirm(true)} className="text-rose-400 hover:text-rose-300 text-sm font-semibold transition-colors">
                        Delete Account
                      </button>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3 w-full sm:w-auto">
                        <p className="text-rose-400 text-xs font-medium flex-1">Permanently delete?</p>
                        <button type="button" onClick={() => setDeleteConfirm(false)} className="text-[var(--t4)] text-xs hover:text-[var(--t)] transition-colors">Cancel</button>
                        <button type="button" onClick={handleDeleteAccount} className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-600 transition-colors">Confirm</button>
                      </div>
                    )}

                    <div className="flex gap-4 w-full sm:w-auto">
                      <button type="button" onClick={() => setProfileModal({ isOpen: false })} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[var(--t3)] hover:text-white font-medium transition-colors">Cancel</button>
                      <button type="submit" disabled={savingProfile} className="flex-1 sm:flex-none btn-primary px-8 py-2.5 rounded-xl font-bold font-display shadow-[0_4px_15px_rgba(255,106,0,0.3)] disabled:opacity-50 transition-colors">
                        {savingProfile ? 'Saving...' : 'Save Updates'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
