import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_LINKS = [
  { label: 'Dashboard',   to: '/dashboard',  role: 'student' },
  { label: 'Interview',   to: '/entry',      role: 'student' },
  { label: 'Leaderboard', to: '/leaderboard',role: 'student' },
  { label: 'Admin Panel', to: '/admin',       role: 'admin'   },
];

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
      {/* Sun */}
      <motion.span
        animate={{ opacity: isDark ? 0.35 : 1, scale: isDark ? 0.8 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: 14, lineHeight: 1 }}
      >☀️</motion.span>

      {/* Track */}
      <div style={{ width: 36, height: 20, background: isDark ? 'rgba(249,115,22,0.15)' : 'rgba(234,88,12,0.2)', borderRadius: 10, position: 'relative', border: '1px solid var(--border)', transition: 'background .3s' }}>
        <motion.div
          animate={{ x: isDark ? 2 : 18 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: 'var(--o)' }}
        />
      </div>

      {/* Moon */}
      <motion.span
        animate={{ opacity: isDark ? 1 : 0.35, scale: isDark ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: 14, lineHeight: 1 }}
      >🌙</motion.span>
    </motion.button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === 'dark';

  const handleLogout = () => { logout(); navigate('/'); };
  const links = NAV_LINKS.filter(l => !l.role || l.role === user?.role);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid var(--border2)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

        {/* Logo */}
        <Link to={user ? '/entry' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--o)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--t)', letterSpacing: 2, fontSize: 18 }}>
            VISION<span style={{ color: 'var(--o)' }}>HIRE</span>
          </span>
          <span style={{ color: 'rgba(234,88,12,0.5)', fontSize: 10, fontFamily: 'JetBrains Mono' }}>AI</span>
        </Link>

        {/* Desktop nav links */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            {links.map(link => (
              <Link key={link.to} to={link.to} style={{ textDecoration: 'none', position: 'relative' }}>
                <span style={{ fontFamily: 'Rajdhani', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', transition: 'color .2s', color: location.pathname === link.to ? 'var(--o)' : 'var(--t3)' }}>
                  {link.label}
                </span>
                {location.pathname === link.to && (
                  <motion.div layoutId="nav-indicator" style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 2, background: 'var(--o)', borderRadius: 9999 }} />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

          {/* Theme toggle — always visible */}
          <ThemeToggle />

          {user ? (
            <>
              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--t)', fontSize: 13, fontWeight: 500 }}>{user.name}</div>
                  <div style={{ color: 'rgba(234,88,12,0.6)', fontSize: 11, fontFamily: 'JetBrains Mono', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--o)', fontWeight: 700, fontSize: 14 }}>{user.name?.[0]?.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
              Get Started
            </Link>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, display: 'none' }}
              className="md:block">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 20, height: 20 }} strokeWidth="2">
                {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: '1px solid var(--border2)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--nav-bg)' }}
          >
            {links.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                style={{ color: location.pathname === link.to ? 'var(--o)' : 'var(--t3)', fontFamily: 'Rajdhani', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 14, textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
