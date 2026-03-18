import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
  return (
    <Routes>
      <Route path="/"             element={<LandingPage />} />
      <Route path="/auth"         element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/entry'} replace /> : <AuthPage />} />
      <Route path="/entry"        element={<ProtectedRoute><Layout><EntryPage /></Layout></ProtectedRoute>} />
      <Route path="/resume"       element={<ProtectedRoute><Layout><ResumeUploadPage /></Layout></ProtectedRoute>} />
      <Route path="/setup"        element={<ProtectedRoute><Layout><InterviewSetupPage /></Layout></ProtectedRoute>} />
      <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
      <Route path="/results/:id"  element={<ProtectedRoute><Layout><ResultsPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard"    element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin"        element={<ProtectedRoute adminOnly><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/leaderboard"  element={<ProtectedRoute><Layout><LeaderboardPage /></Layout></ProtectedRoute>} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
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
          fontFamily: 'Exo 2, sans-serif',
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
