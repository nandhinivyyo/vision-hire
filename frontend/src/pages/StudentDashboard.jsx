import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler);

const StatCard = ({ label, value, sub, color = '#f97316', delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="glass-card p-5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20" style={{ background: color, transform: 'translate(30%,-30%)' }} />
    <p className="text-white/35 text-xs font-mono tracking-wider mb-2">{label}</p>
    <p className="font-display font-bold text-3xl" style={{ color }}>{value}</p>
    {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
  </motion.div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/dashboard').then(r => setDashboard(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"/>
    </div>
  );

  const { scoreHistory = [], recentInterviews = [] } = dashboard || {};
  const u = dashboard?.user || user;

  const lineData = {
    labels: scoreHistory.map((_, i) => `#${i + 1}`),
    datasets: [{
      label: 'Score',
      data: scoreHistory.map(s => s.score),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249,115,22,0.08)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#f97316',
      pointRadius: 4,
    }]
  };

  const typeCount = recentInterviews.reduce((acc, iv) => { acc[iv.type] = (acc[iv.type] || 0) + 1; return acc; }, {});
  const donutData = {
    labels: Object.keys(typeCount),
    datasets: [{ data: Object.values(typeCount), backgroundColor: ['#f97316', '#8b5cf6', '#06b6d4'], borderWidth: 0 }]
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: 'var(--t4)', font: { family: 'JetBrains Mono' } } },
      y: { grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: 'var(--t4)', font: { family: 'JetBrains Mono' } }, min: 0, max: 100 }
    }
  };

  const donutOptions = { plugins: { legend: { labels: { color: 'var(--t3)', font: { family: 'Exo 2' } } } }, cutout: '70%' };

  return (
    <div className="min-h-screen pt-20 px-6 pb-16" style={{ fontFamily: 'Exo 2, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-orange-500/60 font-mono text-xs tracking-[4px] mb-1">DASHBOARD</p>
          <h1 className="font-display font-bold text-4xl text-white">
            Welcome, <span className="text-orange-400">{u?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-white/30 text-sm mt-1">{u?.department} · Year {u?.year} · {u?.collegeName}</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="TOTAL INTERVIEWS" value={u?.totalInterviews || 0} delay={0.1} />
          <StatCard label="AVERAGE SCORE" value={`${u?.averageScore || 0}%`} color="#22c55e" delay={0.15} />
          <StatCard label="BEST SCORE" value={`${u?.bestScore || 0}%`} color="#a855f7" delay={0.2} />
          <StatCard label="RANK" value={`#--`} sub="Coming soon" color="#06b6d4" delay={0.25} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Score history chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex justify-between items-center mb-5">
              <p className="text-orange-500/60 font-mono text-xs tracking-wider">SCORE HISTORY</p>
              <span className="text-white/20 text-xs font-mono">{scoreHistory.length} interviews</span>
            </div>
            {scoreHistory.length > 1 ? (
              <div className="h-48"><Line data={lineData} options={lineOptions} /></div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-white/20 text-sm font-mono">Complete more interviews to see trends</p>
              </div>
            )}
          </div>

          {/* Type breakdown */}
          <div className="glass-card p-6">
            <p className="text-orange-500/60 font-mono text-xs tracking-wider mb-4">INTERVIEW TYPES</p>
            {Object.keys(typeCount).length > 0 ? (
              <div className="h-40"><Doughnut data={donutData} options={donutOptions} /></div>
            ) : (
              <div className="h-40 flex items-center justify-center"><p className="text-white/20 text-sm">No data yet</p></div>
            )}
          </div>
        </div>

        {/* Recent interviews */}
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <p className="text-orange-500/60 font-mono text-xs tracking-wider">RECENT INTERVIEWS</p>
            <button onClick={() => navigate('/entry')} className="text-orange-400/60 hover:text-orange-400 text-xs font-mono transition-colors">+ New Interview</button>
          </div>
          {recentInterviews.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3 opacity-40">🎯</div>
              <p className="text-white/30 font-display text-lg mb-3">No interviews yet</p>
              <button onClick={() => navigate('/entry')} className="btn-orange px-6 py-3 rounded-xl text-sm font-display tracking-wide">Start Your First Interview</button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInterviews.map((iv, i) => {
                const color = iv.scores?.overall >= 70 ? '#22c55e' : iv.scores?.overall >= 40 ? '#eab308' : '#ef4444';
                return (
                  <motion.div key={iv._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/results/${iv._id}`)}
                    className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03]"
                    style={{ border: '1px solid var(--border2)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        {iv.type === 'technical' ? '💻' : iv.type === 'hr' ? '🤝' : '⚡'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium capitalize">{iv.type} Interview</p>
                        <p className="text-white/30 text-xs">{new Date(iv.createdAt).toLocaleDateString()} · {iv.difficulty}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-xl" style={{ color }}>{iv.scores?.overall || 0}</p>
                      <p className="text-white/20 text-xs font-mono">/ 100</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New Interview', icon: '🚀', to: '/entry', primary: true },
            { label: 'Upload Resume', icon: '📄', to: '/resume' },
            { label: 'Leaderboard', icon: '🏆', to: '/leaderboard' },
            { label: 'Practice Again', icon: '🔁', to: '/setup' },
          ].map(a => (
            <motion.button key={a.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.to)}
              className="glass-card p-4 text-center transition-all"
              style={a.primary ? { border: '1px solid rgba(249,115,22,0.5)', background: 'rgba(249,115,22,0.08)' } : {}}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <p className="font-display text-sm text-white/70">{a.label}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
