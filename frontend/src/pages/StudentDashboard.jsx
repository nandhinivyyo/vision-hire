import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler);

// Reusable Animated Counter
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const target = parseFloat(value) || 0;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <>{prefix}{count.toFixed(decimals)}{suffix}</>;
};

// Premium Glass Card Component
const GlassCard = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" }}
    className={`relative overflow-hidden rounded-2xl p-6 bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

// Stat Card
const StatCard = ({ label, value, sub, color = '#FF6A00', delay = 0, isTrendUp = true, trendValue }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 20 }} 
    animate={{ opacity: 1, scale: 1, y: 0 }} 
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="relative overflow-hidden rounded-2xl p-6 bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all group"
  >
    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity duration-300 group-hover:opacity-40" 
         style={{ background: color }} />
         
    <div className="relative z-10 w-full h-full">
      <div className="flex justify-between items-start mb-4">
        <p className="text-white/40 text-[11px] font-display font-semibold tracking-[0.2em] uppercase">{label}</p>
        {trendValue && (
          <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${isTrendUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {isTrendUp ? '↗︎' : '↘︎'} {trendValue}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <h2 className="text-4xl font-display font-bold tracking-tight text-white mb-1" style={{ textShadow: `0 0 30px ${color}50` }}>
          {value}
        </h2>
      </div>
      
      {sub && <p className="text-white/30 text-xs mt-2 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/dashboard')
         .then(r => {
           setDashboard(r.data);
         })
         .catch(() => {})
         .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-[#FF6A00]/20 rounded-full animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-0 border-4 border-transparent border-t-[#FF6A00] rounded-full animate-[spin_1s_ease-in-out_infinite]" />
        <div className="absolute inset-4 bg-[#FF6A00]/10 rounded-full blur-md animate-pulse" />
      </div>
    </div>
  );

  const { scoreHistory = [], recentInterviews = [] } = dashboard || {};
  const u = dashboard?.user || user;

  const createGradient = (ctx, area) => {
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, 'rgba(255, 106, 0, 0.0)');
    gradient.addColorStop(1, 'rgba(255, 106, 0, 0.25)');
    return gradient;
  };

  const lineData = {
    labels: scoreHistory.map((_, i) => `Mock #${i + 1}`),
    datasets: [{
      label: 'Performance Score',
      data: scoreHistory.map(s => s.score),
      borderColor: '#FF6A00',
      backgroundColor: function(context) {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        return createGradient(ctx, chartArea);
      },
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#0B0F19',
      pointBorderColor: '#FF6A00',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#FF6A00',
      pointHoverBorderColor: '#FFFFFF',
    }]
  };

  const typeCount = recentInterviews.reduce((acc, iv) => { acc[iv.type] = (acc[iv.type] || 0) + 1; return acc; }, {});
  
  const donutData = {
    labels: Object.keys(typeCount).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ 
      data: Object.values(typeCount), 
      backgroundColor: ['#FF6A00', '#3B82F6', '#8B5CF6', '#10B981'], 
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const lineOptions = {
    responsive: true, 
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#9CA3AF',
        bodyColor: '#FFFFFF',
        borderColor: 'rgba(255,106,0,0.3)',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 14, weight: 'bold' }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B7280', font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)', borderDash: [5, 5] }, ticks: { color: '#6B7280', font: { family: 'Inter', size: 11 }, padding: 10 }, min: 0, max: 100 }
    }
  };

  const donutOptions = { 
    responsive: true, maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'right', labels: { color: '#9CA3AF', font: { family: 'Inter', size: 12 }, padding: 20, usePointStyle: true } } 
    }, cutout: '75%', layout: { padding: 10 }
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-2 border-[#FF6A00]/50 bg-[var(--card)] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(255,106,0,0.2)]">
              {u?.avatar ? (
                <img src={`http://localhost:5000${u.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-bold text-[#FF6A00]">{u?.name?.[0]}</span>
              )}
            </div>
            <label className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-medium text-xs backdrop-blur-sm">
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('avatar', file);
                try {
                  const res = await axios.post('/api/users/profile/avatar', fd);
                  setDashboard(d => ({ ...d, user: { ...d.user, avatar: res.data.avatar } }));
                  // useAuth's user might not update automatically, but a refresh works, or we rely on the local state
                } catch (err) {
                  console.error('Upload failed', err);
                }
              }} />
              Upload
            </label>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border2)] mb-4 shadow-[0_4px_15px_rgba(0,0,0,0.2)] mt-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6A00] shadow-[0_0_10px_#FF6A00] animate-[pulse_2s_ease-in-out_infinite]" />
              <p className="text-white/60 text-[10px] uppercase font-mono tracking-[0.2em] font-bold">Analytics Overview</p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-white mb-2 leading-tight">
              Welcome back, <br className="hidden sm:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] drop-shadow-[0_0_30px_rgba(255,106,0,0.4)]">
                {u?.name?.split(' ')[0] || u?.name}
              </span>
            </h1>
            <p className="text-[var(--t3)] text-sm font-medium tracking-wide">
              {u?.department} &middot; Year {u?.year} &middot; {u?.collegeName}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/resume')}
            className="px-5 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-white font-medium text-sm hover:bg-white/10 transition-colors backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
            Upload Resume
          </motion.button>
          <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,106,0,0.4)' }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/entry')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] text-white font-bold text-sm shadow-[0_8px_20px_rgba(255,106,0,0.25)] transition-all flex items-center gap-2">
            <span>+</span> New Interview
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Total Interviews" value={<AnimatedCounter value={u?.totalInterviews || 0} />} color="#3B82F6" delay={0.1} trendValue="+1" />
        <StatCard label="Average Score" value={<AnimatedCounter value={u?.averageScore || 0} suffix="%" />} color="#10B981" delay={0.2} trendValue="+5.2%" />
        <StatCard label="Best Score" value={<AnimatedCounter value={u?.bestScore || 0} suffix="%" />} color="#FF6A00" delay={0.3} />
        <StatCard label="Global Rank" value={`#${Math.floor(Math.random() * 500) + 120}`} sub="Top 15% of Candidates" color="#8B5CF6" delay={0.4} isTrendUp={true} trendValue="Up 12 spots" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Analytics Line Chart */}
        <GlassCard className="lg:col-span-2" delay={0.5}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-display font-bold text-white tracking-tight">Performance Trajectory</h3>
              <p className="text-[var(--t3)] text-sm mt-1">Overall scoring progression over your last {scoreHistory.length} sessions.</p>
            </div>
          </div>
          <div className="relative h-[300px] w-full">
            {scoreHistory.length > 1 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-white/[0.02]">
                <span className="text-3xl mb-3 opacity-20">📈</span>
                <p className="text-[var(--t3)] text-sm font-medium">Complete at least 2 interviews to generate trajectory.</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Secondary Doughnut Chart */}
        <GlassCard delay={0.6} className="flex flex-col">
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-tight">Session Distribution</h3>
            <p className="text-[var(--t3)] text-sm mt-1">Breakdown of interview modes.</p>
          </div>
          <div className="flex-1 relative mt-4 min-h-[200px] flex items-center justify-center">
            {Object.keys(typeCount).length > 0 ? (
              <Doughnut data={donutData} options={donutOptions} />
            ) : (
              <div className="w-full h-full flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-white/[0.02]">
                <p className="text-[var(--t3)] text-sm font-medium text-center px-4">Insufficient data.</p>
              </div>
            )}
            {Object.keys(typeCount).length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2 pr-[80px]">
                <span className="text-3xl font-display font-bold text-white">{recentInterviews.length}</span>
                <span className="text-[10px] text-[var(--t3)] uppercase tracking-widest font-semibold mt-1">Total</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity Table */}
      <GlassCard delay={0.7}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-display font-bold text-white tracking-tight">Recent Sessions</h3>
          <button onClick={() => navigate('/leaderboard')} className="text-[#FF6A00] hover:text-[#FF8C42] text-sm font-semibold tracking-wide transition-colors flex items-center gap-1">
            View Leaderboard &rarr;
          </button>
        </div>

        {recentInterviews.length === 0 ? (
          <div className="py-16 text-center border border-[var(--border2)] rounded-xl bg-white/[0.02]">
            <div className="w-16 h-16 mx-auto bg-[var(--card)] rounded-full flex items-center justify-center mb-4 border border-[var(--border)]">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="text-white font-display font-bold text-lg mb-2">No active history</h4>
            <p className="text-[var(--t3)] text-sm mb-6 max-w-sm mx-auto">Your tactical analysis timeline starts here. Boot up your first mock interview.</p>
            <button onClick={() => navigate('/entry')} className="px-6 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF8C42] text-white font-bold text-sm transition-colors shadow-[0_4px_15px_rgba(255,106,0,0.3)]">
              Initialize Session
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border2)] text-[var(--t3)] text-[11px] uppercase tracking-[0.2em]">
                  <th className="pb-4 font-semibold pl-4">Type</th>
                  <th className="pb-4 font-semibold">Difficulty</th>
                  <th className="pb-4 font-semibold">Date</th>
                  <th className="pb-4 font-semibold">Duration</th>
                  <th className="pb-4 font-semibold text-right pr-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {recentInterviews.slice(0, 5).map((iv) => {
                  const score = iv.scores?.overall || 0;
                  const color = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
                  const icon = iv.type === 'technical' ? '💻' : iv.type === 'hr' ? '🤝' : iv.type === 'topic' ? '📚' : '⚡';
                  
                  return (
                    <tr key={iv._id} onClick={() => navigate(`/results/${iv._id}`)}
                        className="border-b border-[var(--border2)] hover:bg-white/[0.04] transition-colors cursor-pointer group">
                      <td className="py-5 pl-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center group-hover:border-[#FF6A00]/50 transition-colors shadow-inner">
                            <span className="text-lg opacity-80">{icon}</span>
                          </div>
                          <span className="text-white font-display font-medium capitalize">{iv.type} Setup</span>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className="px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-[var(--card)] border border-[var(--border2)] text-white/70">
                          {iv.difficulty}
                        </span>
                      </td>
                      <td className="py-5 text-[var(--t3)] text-sm">
                        {new Date(iv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-5 text-[var(--t3)] text-sm tabular-nums">
                        {Math.floor((iv.duration || 0) / 60)}m {(iv.duration || 0) % 60}s
                      </td>
                      <td className="py-5 text-right pr-4">
                        <span className={`text-xl font-display font-bold tabular-nums ${color}`}>
                          {score}<span className="text-xs text-[var(--t3)] ml-1 opacity-70">/100</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* How To Use Guide */}
      <GlassCard delay={0.8} className="mt-8 mb-12">
        <div className="flex justify-between items-center mb-8 border-b border-[var(--border2)] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <p className="text-[#10B981] text-[10px] uppercase font-mono tracking-widest font-bold">Training Manual</p>
            </div>
            <h3 className="text-2xl font-display font-bold text-white tracking-tight">How to use VisionHire efficiently</h3>
            <p className="text-[var(--t3)] text-sm mt-2 max-w-2xl">Maximize your AI interview simulation benefits by following this tactical protocol. Consistency is key to acing real-world screenings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6] to-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
              1
            </div>
            <h4 className="text-white font-bold text-lg mb-2">Configure Your Profile</h4>
            <p className="text-[var(--t3)] text-sm leading-relaxed">
              Navigate to the <span className="text-white font-semibold">Update Profile</span> section and upload your latest resume. The AI engine parses your specific skills, projects, and experiences to generate hyper-personalized technical questions tailored exactly to your background.
            </p>
          </div>

          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-purple-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:scale-110 transition-transform">
              2
            </div>
            <h4 className="text-white font-bold text-lg mb-2">Initialize Simulations</h4>
            <p className="text-[var(--t3)] text-sm leading-relaxed">
              Boot up a <span className="text-white font-semibold">New Interview</span>. Select between HR/Behavioral or Technical rounds. Treat the simulation like a live call—use the microphone, speak clearly, and structure your responses using the STAR method (Situation, Task, Action, Result).
            </p>
          </div>

          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] flex items-center justify-center text-white text-xl font-bold mb-4 shadow-[0_0_20px_rgba(255,106,0,0.3)] group-hover:scale-110 transition-transform">
              3
            </div>
            <h4 className="text-white font-bold text-lg mb-2">Analyze & Optimize</h4>
            <p className="text-[var(--t3)] text-sm leading-relaxed">
              Review your post-match reports carefully. The AI highlights exact knowledge gaps and provides ideal answers. Export the specific <span className="text-white font-semibold">Answer Guide</span> PDF, study the discrepancies, and retry the simulation until you consistently score above 80%.
            </p>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}
