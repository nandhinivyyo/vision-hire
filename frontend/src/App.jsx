import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import LandingPage         from './pages/LandingPage';
import AuthPage            from './pages/AuthPage';
import EntryPage           from './pages/EntryPage';
import ResumeUploadPage    from './pages/ResumeUploadPage';
import InterviewSetupPage  from './pages/InterviewSetupPage';
import InterviewRoomPage   from './pages/InterviewRoomPage';
import ResultsPage         from './pages/ResultsPage';
import StudentDashboard    from './pages/StudentDashboard';
import AdminDashboard      from './pages/AdminDashboard';
import LeaderboardPage     from './pages/LeaderboardPage';

import Layout              from './components/common/Layout';
import PageTransition      from './components/common/PageTransition';
import SpotlightBackground from './components/common/SpotlightBackground';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(234,88,12,0.6)', fontFamily: 'JetBrains Mono', fontSize: 12, letterSpacing: 2 }}>LOADING...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/entry" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      <SpotlightBackground />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"             element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/auth"         element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <PageTransition><AuthPage /></PageTransition>} />
          <Route path="/entry"        element={<ProtectedRoute><PageTransition><Layout><EntryPage /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="/resume"       element={<ProtectedRoute><PageTransition><Layout><ResumeUploadPage /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="/setup"        element={<ProtectedRoute><PageTransition><Layout><InterviewSetupPage /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><PageTransition><InterviewRoomPage /></PageTransition></ProtectedRoute>} />
          <Route path="/results/:id"  element={<ProtectedRoute><PageTransition><Layout><ResultsPage /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="/dashboard"    element={<ProtectedRoute><PageTransition><Layout><StudentDashboard /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="/admin"        element={<ProtectedRoute adminOnly><PageTransition><Layout><AdminDashboard /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="/leaderboard"  element={<ProtectedRoute><PageTransition><Layout><LeaderboardPage /></Layout></PageTransition></ProtectedRoute>} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

function ToastWrapper() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#1a1a1a' : '#ffffff',
          color: isDark ? '#e5e5e5' : '#1a1410',
          border: `1px solid ${isDark ? 'rgba(249,115,22,0.3)' : 'rgba(234,88,12,0.25)'}`,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 600,
          fontSize: 14,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)',
        },
        success: { iconTheme: { primary: '#f97316', secondary: isDark ? '#1a1a1a' : '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: isDark ? '#1a1a1a' : '#fff' } },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastWrapper />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
