import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Dashboard',   to: '/dashboard',  icon: '📊', role: 'student' },
  { label: 'Interview',   to: '/entry',      icon: '🎯', role: 'student' },
  { label: 'Leaderboard', to: '/leaderboard',icon: '🏆', role: 'student' },
  { label: 'Admin Panel', to: '/admin',      icon: '⚙️',  role: 'admin'   },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const links = NAV_LINKS.filter(l => !l.role || l.role === user?.role);

  return (
    <>
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-[var(--bg)]/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[var(--nav-bg)] backdrop-blur-2xl border-r border-[var(--border2)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-[var(--border2)]">
            <Link to={user ? '/entry' : '/'} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/10 border border-[#FF6A00]/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,106,0,0.15)]">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#FF6A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-display font-extrabold text-white tracking-widest text-lg">
                VISION<span className="text-[#FF6A00]">HIRE</span>
              </span>
            </Link>
          </div>

          <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            <p className="px-4 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-4">Menu</p>
            {links.map(link => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className="block relative">
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-gradient-to-r from-[#FF6A00]/10 to-transparent border border-[#FF6A00]/20 rounded-xl" />
                  )}
                  <div className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive ? 'text-[color:var(--t)] font-bold' : 'text-[color:var(--t3)] hover:text-[color:var(--t)] hover:bg-[var(--card)]'}`}>
                    <span className="text-xl opacity-80">{link.icon}</span>
                    <span className="font-display font-semibold tracking-wide text-[15px]">{link.label}</span>
                    {isActive && (
                      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#FF6A00] shadow-[0_0_10px_#FF6A00]" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
