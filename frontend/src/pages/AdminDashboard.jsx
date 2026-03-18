import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

const DEPARTMENTS = ['all','Computer Science','Information Technology','Electronics','Mechanical','Civil'];
const YEARS = ['all','1','2','3','4'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [filters, setFilters] = useState({ department: 'all', year: 'all' });
  const [tab, setTab] = useState('overview');
  const [sessionForm, setSessionForm] = useState({
    title: '',
    type: 'technical',
    difficulty: 'medium',
    targetDepartment: 'all',
    targetYear: 'all',
    description: '',
    scheduledAt: '',
    durationMinutes: 30,
  });
  const [creating, setCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/admin/top-performers'),
    ]).then(([s, t]) => { setStats(s.data); setTopPerformers(t.data); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(filters).toString();
    axios.get(`/api/admin/students?${q}`).then(r => setStudents(r.data.students || [])).catch(() => {});
  }, [filters]);

  const createSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axios.post('/api/sessions/create', sessionForm);
      setCreatedSession(res.data);
      toast.success(`Session created! Code: ${res.data.sessionCode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally { setCreating(false); }
  };

  const deptBarData = {
    labels: stats?.deptStats?.map(d => d._id) || [],
    datasets: [{ label: 'Students', data: stats?.deptStats?.map(d => d.count) || [], backgroundColor: 'rgba(249,115,22,0.6)', borderColor: '#f97316', borderWidth: 1, borderRadius: 6 }]
  };
  const barOptions = {
    plugins: { legend: { display: false } },
    scales: { x: { grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: 'var(--t4)' } }, y: { grid: { color: 'rgba(128,128,128,0.15)' }, ticks: { color: 'var(--t4)' } } }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen pt-20 px-6 pb-16" style={{ fontFamily: 'Exo 2, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-orange-500/60 font-mono text-xs tracking-[4px] mb-1">ADMIN PANEL</p>
          <h1 className="font-display font-bold text-4xl text-white">Admin <span className="text-orange-400">Dashboard</span></h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { l: 'TOTAL STUDENTS', v: stats?.totalStudents || 0, c: '#f97316' },
            { l: 'INTERVIEWS DONE', v: stats?.totalInterviews || 0, c: '#a855f7' },
            { l: 'AVG SCORE', v: `${stats?.avgScore || 0}%`, c: '#22c55e' },
            { l: 'DEPARTMENTS', v: stats?.deptStats?.length || 0, c: '#06b6d4' },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card p-5">
              <p className="text-white/30 text-xs font-mono mb-2">{s.l}</p>
              <p className="font-display font-bold text-3xl" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass-card p-1 mb-6 w-fit">
          {['overview', 'students', 'create session'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-display text-sm tracking-wide capitalize transition-all ${tab === t ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white/60'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6">
              <p className="text-orange-500/60 font-mono text-xs tracking-wider mb-4">STUDENTS BY DEPARTMENT</p>
              <div className="h-56"><Bar data={deptBarData} options={barOptions} /></div>
            </div>
            <div className="glass-card p-6">
              <p className="text-orange-500/60 font-mono text-xs tracking-wider mb-4">TOP PERFORMERS</p>
              <div className="space-y-3">
                {topPerformers.slice(0, 8).map((s, i) => (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className="text-white/20 font-mono text-xs w-4">{i+1}</span>
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400">{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{s.name}</p>
                      <p className="text-white/30 text-xs">{s.department}</p>
                    </div>
                    <span className="text-orange-400 font-mono text-sm font-bold">{s.averageScore}%</span>
                  </div>
                ))}
                {topPerformers.length === 0 && <p className="text-white/20 text-sm">No data yet</p>}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'students' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex gap-4 mb-5">
              {[['department', DEPARTMENTS], ['year', YEARS]].map(([key, opts]) => (
                <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  className="input-dark w-40 capitalize">{opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${key}s` : o}</option>)}</select>
              ))}
            </div>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b" style={{ borderColor: 'rgba(249,115,22,0.1)' }}>
                  {['Name', 'Roll No', 'Department', 'Year', 'Interviews', 'Avg Score', 'Best'].map(h => (
                    <th key={h} className="text-left p-4 text-white/30 font-mono text-xs tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {students.map((s, i) => {
                    const color = s.averageScore >= 70 ? '#22c55e' : s.averageScore >= 40 ? '#eab308' : '#ef4444';
                    return (
                      <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="p-4"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center text-xs font-bold text-orange-400">{s.name[0]}</div><span className="text-white">{s.name}</span></div></td>
                        <td className="p-4 text-white/40 font-mono text-xs">{s.rollNumber}</td>
                        <td className="p-4 text-white/60">{s.department}</td>
                        <td className="p-4 text-white/60">{s.year}</td>
                        <td className="p-4 text-white/60">{s.totalInterviews}</td>
                        <td className="p-4"><span className="font-bold font-display" style={{ color }}>{s.averageScore}%</span></td>
                        <td className="p-4 text-white/60 font-mono">{s.bestScore}%</td>
                      </motion.tr>
                    );
                  })}
                  {students.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-white/20">No students found</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === 'create session' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            {createdSession ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-card p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="font-display font-bold text-2xl text-white mb-2">Session Created!</h2>
                <p className="text-white/40 mb-5">Share this code with students:</p>
                <div className="glass-card p-4 mb-5">
                  <p className="font-mono text-4xl font-bold tracking-[10px] text-orange-400">{createdSession.sessionCode}</p>
                </div>
                <p className="text-white/30 text-sm mb-5"><strong className="text-white/60">{createdSession.title}</strong> · {createdSession.type} · {createdSession.difficulty}</p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setCreatedSession(null)} className="btn-orange px-6 py-3 rounded-xl font-display text-sm tracking-wide">Create Another</button>
                  <button onClick={() => navigator.clipboard.writeText(createdSession.sessionCode).then(() => toast.success('Code copied!'))} className="px-6 py-3 rounded-xl font-display text-sm tracking-wide" style={{ border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>Copy Code</button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={createSession} className="glass-card p-8 space-y-5">
                <h2 className="font-display font-bold text-xl text-white mb-2">Create Interview Session</h2>
                {[['title', 'Session Title', 'text', 'e.g. Campus Recruitment Round 1'], ['description', 'Description (optional)', 'text', 'What this session is about']].map(([k, l, t, ph]) => (
                  <div key={k}>
                    <label className="text-white/40 text-xs font-mono tracking-wider mb-1.5 block">{l.toUpperCase()}</label>
                    <input type={t} value={sessionForm[k]} onChange={e => setSessionForm(f => ({ ...f, [k]: e.target.value }))}
                      placeholder={ph} className="input-dark" required={k === 'title'} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  {[['type', 'Type', ['technical', 'hr', 'mixed']], ['difficulty', 'Difficulty', ['easy', 'medium', 'hard']], ['targetDepartment', 'Department', DEPARTMENTS], ['targetYear', 'Year', YEARS]].map(([k, l, opts]) => (
                    <div key={k}>
                      <label className="text-white/40 text-xs font-mono tracking-wider mb-1.5 block">{l.toUpperCase()}</label>
                      <select value={sessionForm[k]} onChange={e => setSessionForm(f => ({ ...f, [k]: e.target.value }))} className="input-dark capitalize">
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs font-mono tracking-wider mb-1.5 block">SCHEDULED START (OPTIONAL)</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.scheduledAt}
                      onChange={e => setSessionForm(f => ({ ...f, scheduledAt: e.target.value }))}
                      className="input-dark"
                    />
                    <p className="text-white/20 text-xs mt-1">Students can join/start only after this time.</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs font-mono tracking-wider mb-1.5 block">DURATION</label>
                    <select
                      value={sessionForm.durationMinutes}
                      onChange={e => setSessionForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                      className="input-dark"
                    >
                      {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} minutes</option>)}
                    </select>
                    <p className="text-white/20 text-xs mt-1">Session ends automatically after duration.</p>
                  </div>
                </div>
                <motion.button type="submit" disabled={creating} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="btn-orange w-full py-3.5 rounded-xl font-display tracking-wide flex items-center justify-center gap-2">
                  {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</> : '🎯 Create Session'}
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
