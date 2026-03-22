import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DEPARTMENTS = ['all','Computer Science','Information Technology','Electronics','Mechanical','Civil'];
const YEARS = ['all','1','2','3','4'];

const TOPICS = [
  'Computer Networks', 'DBMS', 'Operating Systems', 'OOPS', 
  'Data Structures', 'Algorithms', 'System Design', 'HTML', 'CSS', 'JavaScript',
  'TypeScript', 'React.js', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C++', 'C#', '.NET',
  'Go', 'Rust', 'Ruby on Rails', 'PHP', 'Laravel', 'SQL', 'MySQL', 'PostgreSQL',
  'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'Docker', 'Kubernetes', 'AWS',
  'Google Cloud', 'Microsoft Azure', 'Machine Learning', 'Data Science', 'Cybersecurity'
].sort();

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [filters, setFilters] = useState({ department: 'all', year: 'all' });
  const [tab, setTab] = useState('overview');
  const [sessionForm, setSessionForm] = useState({
    title: '', type: 'technical', topic: '', difficulty: 'medium', targetDepartment: 'all',
    targetYear: 'all', description: '', scheduledAt: '', durationMinutes: 30,
  });
  const [creating, setCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mySessions, setMySessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  const [studentModal, setStudentModal] = useState({ isOpen: false, mode: 'create', student: null });
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', rollNumber: '', registerNumber: '', collegeName: '', department: DEPARTMENTS[1], year: '1', phone: '', password: '', role: 'student', designation: 'Placement Officer'
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const openStudentModal = (mode, student = null) => {
    if (mode === 'edit' && student) {
      setStudentForm({ ...student, password: '' });
    } else {
      setStudentForm({ name: '', email: '', rollNumber: '', registerNumber: '', collegeName: '', department: DEPARTMENTS[1], year: '1', phone: '', password: '', role: tab === 'staff' ? 'admin' : 'student', designation: 'Placement Officer' });
    }
    setStudentModal({ isOpen: true, mode, student });
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    setSavingStudent(true);
    try {
      if (studentModal.mode === 'create') {
        const res = await axios.post('/api/admin/students', studentForm);
        setStudents(s => [res.data, ...s]);
        toast.success('Student created successfully');
      } else {
        const res = await axios.put(`/api/admin/students/${studentModal.student._id}`, studentForm);
        setStudents(s => s.map(st => st._id === res.data._id ? res.data : st));
        toast.success('Student updated successfully');
      }
      setStudentModal({ isOpen: false, mode: 'create', student: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSavingStudent(false);
    }
  };

  const deleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await axios.delete(`/api/admin/students/${studentToDelete._id}`);
      setStudents(s => s.filter(st => st._id !== studentToDelete._id));
      toast.success('Student deleted successfully');
    } catch (err) {
      toast.error('Failed to delete student');
    } finally {
      setStudentToDelete(null);
    }
  };

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/admin/top-performers'),
    ]).then(([s, t]) => { setStats(s.data); setTopPerformers(t.data); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'students' && tab !== 'staff') return;
    const role = tab === 'students' ? 'student' : 'admin';
    const q = new URLSearchParams({ ...filters, role }).toString();
    axios.get(`/api/admin/students?${q}`).then(r => setStudents(r.data.students || [])).catch(() => {});
  }, [filters, tab]);

  const fetchMySessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await axios.get('/api/sessions/my-sessions');
      setMySessions(res.data);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (tab === 'create session') fetchMySessions();
  }, [tab]);

  const createSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (editingSession) {
        const res = await axios.put(`/api/sessions/${editingSession._id}`, sessionForm);
        setMySessions(s => s.map(st => st._id === res.data._id ? res.data : st));
        toast.success(`Session updated!`);
        setEditingSession(null);
        setSessionForm({
          title: '', type: 'technical', topic: '', difficulty: 'medium', targetDepartment: 'all',
          targetYear: 'all', description: '', scheduledAt: '', durationMinutes: 30,
        });
      } else {
        const res = await axios.post('/api/sessions/create', sessionForm);
        setCreatedSession(res.data);
        setMySessions(s => [res.data, ...s]);
        toast.success(`Session created! Code: ${res.data.sessionCode}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editingSession ? 'update' : 'create'} session`);
    } finally { setCreating(false); }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await axios.delete(`/api/sessions/${sessionToDelete._id}`);
      setMySessions(s => s.filter(st => st._id !== sessionToDelete._id));
      toast.success('Session deleted successfully');
    } catch (err) {
      toast.error('Failed to delete session');
    } finally {
      setSessionToDelete(null);
    }
  };

  const openEditSession = (s) => {
    setCreatedSession(null);
    setEditingSession(s);
    setSessionForm({
      title: s.title || '',
      type: s.type || 'technical',
      topic: s.topic || '',
      difficulty: s.difficulty || 'medium',
      targetDepartment: s.targetDepartment || 'all',
      targetYear: s.targetYear || 'all',
      description: s.description || '',
      scheduledAt: s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 16) : '',
      durationMinutes: s.durationMinutes || 30,
      requireVoice: s.requireVoice || false,
      requireVideo: s.requireVideo || false,
      requireCodeEditor: s.requireCodeEditor || false,
    });
  };

  const deptBarData = {
    labels: stats?.deptStats?.map(d => d._id) || [],
    datasets: [{
      label: 'Students',
      data: stats?.deptStats?.map(d => d.count) || [],
      backgroundColor: 'rgba(255, 106, 0, 0.6)',
      borderColor: '#FF6A00',
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: '#FF8C42'
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(11, 15, 25, 0.9)', titleFont: { family: 'Outfit' }, bodyFont: { family: 'Inter' } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--t4)', font: { family: 'JetBrains Mono' } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--t4)', font: { family: 'JetBrains Mono' } } }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 pb-16 w-full max-w-7xl mx-auto flex flex-col gap-6">
        <div className="h-24 bg-[var(--card)] rounded-2xl skeleton-shimmer border border-[var(--border2)]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[var(--card)] rounded-2xl skeleton-shimmer border border-[var(--border2)]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6 pb-16 text-[var(--t)] relative z-10 w-full font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-[var(--o)] font-mono text-xs tracking-[4px] font-bold mb-2 uppercase opacity-80">Admin Interface</p>
          <h1 className="font-display font-bold text-4xl tracking-tight text-[var(--t)]">Global <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] to-[#FF8C42]">Analytics</span></h1>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { l: 'TOTAL STUDENTS', v: stats?.totalStudents || 0, c: '#FF6A00' },
            { l: 'INTERVIEWS DONE', v: stats?.totalInterviews || 0, c: '#a855f7' },
            { l: 'AVG SCORE', v: `${stats?.avgScore || 0}%`, c: '#22c55e' },
            { l: 'ACTIVE DEPARTMENTS', v: stats?.deptStats?.length || 0, c: '#3B82F6' },
          ].map((s, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle, ${s.c} 0%, transparent 70%)` }} />
              <p className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-3 uppercase">{s.l}</p>
              <p className="font-display font-bold text-4xl drop-shadow-sm" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[var(--card)] border border-[var(--border2)] backdrop-blur-md rounded-xl p-1.5 mb-8 w-fit shadow-sm">
          {['overview', 'students', 'staff', 'create session'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-lg font-display font-bold text-sm tracking-wide capitalize transition-all relative ${tab === t ? 'text-[var(--bg)] shadow-md' : 'text-[var(--t3)] hover:text-[var(--t)]'}`}>
              {tab === t && <motion.div layoutId="admintab" className="absolute inset-0 bg-[var(--t)] rounded-lg -z-10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--o)]" /> Students by Department</p>
                <div className="h-[300px] w-full"><Bar data={deptBarData} options={barOptions} /></div>
              </div>
              <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col">
                <p className="text-[var(--t4)] font-mono text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Top Performers</p>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {topPerformers.slice(0, 8).map((s, i) => (
                    <motion.div key={s._id} whileHover={{ x: 4 }} className="flex items-center gap-4 group cursor-default">
                      <span className="text-[var(--t4)] font-mono text-xs w-4 font-bold opacity-50">{i+1}</span>
                      <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--od)] flex items-center justify-center text-sm font-bold text-[var(--o)] group-hover:shadow-[0_0_15px_var(--od)] transition-shadow overflow-hidden">
                        {s.avatar ? <img src={`http://localhost:5000${s.avatar}`} alt="Avatar" className="w-full h-full object-cover" /> : s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--t)] font-bold text-sm truncate">{s.name}</p>
                        <p className="text-[var(--t4)] text-xs truncate mt-0.5">{s.department}</p>
                      </div>
                      <span className="text-[var(--o)] font-mono text-sm font-bold">{s.averageScore}%</span>
                    </motion.div>
                  ))}
                  {topPerformers.length === 0 && <p className="text-[var(--t4)] text-sm italic">No data yet</p>}
                </div>
              </div>
            </motion.div>
          )}

          {(tab === 'students' || tab === 'staff') && (
            <motion.div key="users-table" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-4">
                  {[['department', DEPARTMENTS], ['year', YEARS]].map(([key, opts]) => (
                    <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                      className="bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-[var(--o)] transition-colors cursor-pointer capitalize shadow-sm">
                      {opts.map(o => <option key={o} value={o} className="bg-[var(--bg)]">{o === 'all' ? `All ${key}s` : o}</option>)}
                    </select>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openStudentModal('create')}
                  className="btn-primary px-6 py-2.5 font-bold font-display tracking-wide shadow-lg rounded-xl text-sm flex items-center justify-center gap-2">
                  <span>+</span> Create {tab === 'staff' ? 'Staff' : 'Student'}
                </motion.button>
              </div>
              <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[var(--border2)] bg-black/5">
                        {[`${tab === 'staff' ? 'Staff' : 'Student'} Name`, 'Roll No', 'Department', 'Year', 'Sessions', 'Avg Score', 'Best', 'Actions'].map(h => (
                          <th key={h} className="p-5 text-[var(--t4)] font-mono text-xs font-bold tracking-wider uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => {
                        const color = s.averageScore >= 70 ? 'var(--score-green)' : s.averageScore >= 40 ? 'var(--score-yellow)' : 'var(--score-red)';
                        return (
                          <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className="border-b border-[var(--border2)] hover:bg-white/[0.03] transition-colors group cursor-default">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--od)] border border-[var(--border2)] flex items-center justify-center text-xs font-bold text-[var(--o)] group-hover:scale-110 transition-transform overflow-hidden">
                                  {s.avatar ? <img src={`http://localhost:5000${s.avatar}`} alt="Avatar" className="w-full h-full object-cover" /> : s.name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[var(--t)] font-semibold flex items-center gap-2">{s.name} {s.role === 'admin' && <span className="text-[8px] bg-[#FF6A00] text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-widest leading-none">Admin</span>}</span>
                                  <span className="text-[var(--t4)] text-xs">{s.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-[var(--t4)] font-mono text-xs">{s.rollNumber}</td>
                            <td className="p-5 text-[var(--t3)]">{s.department}</td>
                            <td className="p-5 text-[var(--t3)]">{s.year}</td>
                            <td className="p-5 text-[var(--t3)]">{s.totalInterviews}</td>
                            <td className="p-5"><span className="font-display font-bold" style={{ color }}>{s.averageScore}%</span></td>
                            <td className="p-5 text-[var(--t4)] font-mono">{s.bestScore}%</td>
                            <td className="p-5">
                              <div className="flex gap-3">
                                <button onClick={(e) => { e.stopPropagation(); openStudentModal('edit', s); }} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">✏️</button>
                                <button onClick={(e) => { e.stopPropagation(); setStudentToDelete(s); }} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">🗑️</button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                      {students.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-[var(--t4)] italic font-medium">No users found for this criteria.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'create session' && (
            <motion.div key="create" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              <div className="max-w-2xl w-full mx-auto xl:mx-0">
              {createdSession ? (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--score-green)]" />
                  <div className="w-20 h-20 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">✅</div>
                  <h2 className="font-display font-bold text-3xl text-[var(--t)] mb-2 tracking-tight">Session Established!</h2>
                  <p className="text-[var(--t3)] mb-8">Share this unique access code with your candidates.</p>
                  
                  <div className="bg-[var(--bg2)] border border-[var(--border2)] p-6 rounded-2xl mb-8 shadow-inner">
                    <p className="font-mono text-5xl font-bold tracking-[0.25em] text-[var(--o)]">{createdSession.sessionCode}</p>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCreatedSession(null)} className="px-6 py-3 rounded-xl font-bold font-display tracking-wide border border-[var(--border)] bg-transparent text-[var(--t)] hover:bg-[var(--card2)] transition-colors">Create Another</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigator.clipboard.writeText(createdSession.sessionCode).then(() => toast.success('Code copied to clipboard!'))} className="btn-primary px-8 py-3 font-bold font-display tracking-wide shadow-lg">Copy Code</motion.button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={createSession} className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 sm:p-10 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--o)] opacity-[0.03] blur-[80px] rounded-full pointer-events-none" />
                  <h2 className="font-display font-bold text-2xl text-[var(--t)] mb-4 tracking-tight">{editingSession ? 'Edit Session' : 'Generate Interview Link'}</h2>
                  
                  {[['title', 'Session Title', 'text', 'e.g. Software Engineer Level II - Tech Screen'], ['description', 'Description / Instructions (optional)', 'text', 'Specific notes for the candidates']].map(([k, l, t, ph]) => (
                    <div key={k}>
                      <label className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-2 block uppercase">{l}</label>
                      <input type={t} value={sessionForm[k]} onChange={e => setSessionForm(f => ({ ...f, [k]: e.target.value }))}
                        placeholder={ph} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-3.5 px-4 text-sm outline-none focus:border-[var(--o)] transition-colors focus:shadow-[0_0_0_2px_var(--od)] placeholder:text-[var(--placeholder)]" required={k === 'title'} />
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[['type', 'Interview Vector', ['technical', 'hr', 'mixed', 'topic']], ['difficulty', 'Puzzles & Logic', ['easy', 'medium', 'hard']], ['targetDepartment', 'Department Scope', DEPARTMENTS], ['targetYear', 'Class Year', YEARS]].map(([k, l, opts]) => (
                      <div key={k}>
                        <label className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-2 block uppercase">{l}</label>
                        <select value={sessionForm[k]} onChange={e => setSessionForm(f => ({ ...f, [k]: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-3.5 px-4 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer capitalize appearance-none">
                          {opts.map(o => <option key={o} value={o} className="bg-[var(--bg)]">{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {sessionForm.type === 'topic' && (
                    <div className="mt-4">
                      <label className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-2 block uppercase">Targeted Subject Context</label>
                      <select value={sessionForm.topic} onChange={e => setSessionForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-3.5 px-4 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer appearance-none" required>
                        <option value="" disabled className="bg-[var(--bg)]">Select a predefined topic</option>
                        {TOPICS.map(t => <option key={t} value={t} className="bg-[var(--bg)]">{t}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[var(--border2)]">
                    <label className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-3 block uppercase">Enforce Environment Rules</label>
                    <div className="flex flex-wrap gap-6">
                      {[
                        { key: 'requireVoice', label: 'Require Voice (Speech)', icon: '🎙️' },
                        { key: 'requireVideo', label: 'Require Webcam Optics', icon: '📹' },
                        { key: 'requireCodeEditor', label: 'Require Code Engine', icon: '💻' }
                      ].map(f => (
                        <label key={f.key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${sessionForm[f.key] ? 'bg-[var(--o)] border-[var(--o)]' : 'border-[var(--border)] bg-[var(--input-bg)] group-hover:border-[var(--o)]'}`}>
                            {sessionForm[f.key] && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3"><path d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <input type="checkbox" className="hidden" checked={sessionForm[f.key]} onChange={e => setSessionForm(s => ({ ...s, [f.key]: e.target.checked }))} />
                          <span className="text-[var(--t)] text-sm font-medium flex items-center gap-2"><span className="opacity-80">{f.icon}</span> {f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--border2)]">
                    <div>
                      <label className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-2 block uppercase">SCHEDULED START (OPTIONAL)</label>
                      <input type="datetime-local" value={sessionForm.scheduledAt} onChange={e => setSessionForm(f => ({ ...f, scheduledAt: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--o)] transition-colors [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-[var(--t4)] text-xs font-mono font-bold tracking-widest mb-2 block uppercase">HARD CUTOFF DURATION</label>
                      <select value={sessionForm.durationMinutes} onChange={e => setSessionForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer appearance-none">
                        {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m} className="bg-[var(--bg)]">{m} minutes total elapsed</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    {editingSession && (
                      <button type="button" onClick={() => {
                        setEditingSession(null);
                        setSessionForm({ title: '', type: 'technical', topic: '', difficulty: 'medium', targetDepartment: 'all', targetYear: 'all', description: '', scheduledAt: '', durationMinutes: 30 });
                      }} className="px-6 py-4 rounded-xl text-[var(--t3)] hover:text-[var(--t)] font-medium transition-colors border border-[var(--border2)]">
                        Cancel
                      </button>
                    )}
                    <motion.button type="submit" disabled={creating} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary flex-1 py-4 rounded-xl font-display font-bold text-lg tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_var(--od)]">
                      {creating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{editingSession ? 'UPDATING...' : 'GENERATING SECURE LINK...'}</> : (editingSession ? 'UPDATE SESSION' : 'DEPLOY SESSION →')}
                    </motion.button>
                  </div>
                </form>
              )}
            </div>

            {/* My Sessions List */}
            <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border2)] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-w-2xl w-full mx-auto xl:mx-0">
              <h2 className="font-display font-bold text-2xl text-[var(--t)] mb-6 tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--od)] flex items-center justify-center text-[var(--o)] text-sm">📋</span>
                Your Created Sessions
              </h2>
              
              {loadingSessions ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--border2)] rounded-2xl"></div>)}
                </div>
              ) : mySessions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--border2)] rounded-2xl">
                  <p className="text-[var(--t3)]">You haven't created any sessions yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {mySessions.map(s => (
                    <div key={s._id} className={`p-5 rounded-2xl border ${editingSession?._id === s._id ? 'border-[var(--o)] bg-[var(--od)]' : 'border-[var(--border2)] bg-[var(--bg2)]'} transition-colors relative group`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-[var(--t)] truncate pr-4">{s.title}</h3>
                          <p className="font-mono text-xs text-[var(--o)] tracking-widest bg-[var(--od)] px-2 py-1 rounded w-fit mt-1">{s.sessionCode}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditSession(s)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">✏️</button>
                          <button onClick={() => setSessionToDelete(s)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">🗑️</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 mt-4 text-xs font-mono text-[var(--t4)]">
                        <p>Type: <span className="text-[var(--t3)] uppercase">{s.type}</span></p>
                        <p>Diff: <span className="text-[var(--t3)] uppercase">{s.difficulty}</span></p>
                        <p>Dept: <span className="text-[var(--t3)]">{s.targetDepartment}</span></p>
                        <p>Year: <span className="text-[var(--t3)]">{s.targetYear}</span></p>
                        <p className="col-span-2 mt-1">Status: <span className={`px-2 py-0.5 rounded ${s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Student CRUD Modal */}
        <AnimatePresence>
          {studentModal.isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[var(--card)] border border-[var(--border2)] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                <button onClick={() => setStudentModal({ isOpen: false })} className="absolute top-6 right-6 text-[var(--t4)] hover:text-[var(--t)] transition-colors">✕</button>
                <h2 className="text-2xl font-display font-bold text-[var(--t)] mb-6 tracking-tight capitalize">{studentModal.mode} {studentForm.role === 'admin' ? 'Staff' : 'Student'}</h2>
                
                <form onSubmit={saveStudent} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      ['name', 'Full Name', 'text'],
                      ['email', 'Email Address', 'email'],
                      studentForm.role === 'student' && ['rollNumber', 'Roll Number', 'text'],
                      studentForm.role === 'student' && ['registerNumber', 'Register Number (optional)', 'text'],
                      ['collegeName', 'Institution / College Name', 'text'],
                      ['phone', 'Phone Context', 'tel']
                    ].filter(Boolean).map(([k, l, t]) => (
                      <div key={k}>
                        <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">{l}</label>
                        <input type={t} value={studentForm[k]} onChange={e => setStudentForm(f => ({ ...f, [k]: e.target.value }))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[var(--o)] transition-colors focus:shadow-[0_0_0_2px_var(--od)]" required={k !== 'registerNumber'} />
                      </div>
                    ))}
                    
                    {studentForm.role === 'admin' && (
                      <div>
                        <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">Designation</label>
                        <select value={studentForm.designation} onChange={e => setStudentForm(f => ({ ...f, designation: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer appearance-none">
                          {['Placement Officer','HOD','Professor','Associate Professor','Assistant Professor','Dean','Director','Principal','Coordinator','Industry Recruiter','Other'].map(d => <option key={d} value={d} className="bg-[var(--bg)]">{d}</option>)}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">Department</label>
                      <select value={studentForm.department} onChange={e => setStudentForm(f => ({ ...f, department: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer appearance-none">
                        {DEPARTMENTS.filter(d => d !== 'all').map(d => <option key={d} value={d} className="bg-[var(--bg)]">{d}</option>)}
                      </select>
                    </div>
                    {studentForm.role === 'student' && (
                      <div>
                        <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">Year</label>
                        <select value={studentForm.year} onChange={e => setStudentForm(f => ({ ...f, year: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer appearance-none">
                          {YEARS.filter(y => y !== 'all').map(y => <option key={y} value={y} className="bg-[var(--bg)]">{y}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">Role</label>
                      <select value={studentForm.role} onChange={e => setStudentForm(f => ({ ...f, role: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[var(--o)] transition-colors cursor-pointer appearance-none">
                        <option value="student" className="bg-[var(--bg)]">Student</option>
                        <option value="admin" className="bg-[var(--bg)]">Admin/Staff</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[var(--t4)] text-[10px] font-mono font-bold tracking-widest mb-1.5 block uppercase">Password {studentModal.mode === 'edit' && '(Leave blank to keep same)'}</label>
                      <input type="password" value={studentForm.password} onChange={e => setStudentForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-[var(--o)] transition-colors focus:shadow-[0_0_0_2px_var(--od)]" required={studentModal.mode === 'create'} minLength={6} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 mt-6 border-t border-[var(--border2)]">
                    <button type="button" onClick={() => setStudentModal({ isOpen: false })} className="px-6 py-2.5 rounded-xl text-[var(--t3)] hover:text-[var(--t)] font-medium transition-colors mr-4">Cancel</button>
                    <button type="submit" disabled={savingStudent} className="btn-primary px-8 py-2.5 rounded-xl font-bold font-display shadow-lg disabled:opacity-50">
                      {savingStudent ? 'Saving...' : `Save ${studentForm.role === 'admin' ? 'Staff' : 'Student'}`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {studentToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[var(--card)] border border-[var(--border2)] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
                <div className="w-16 h-16 mx-auto bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 text-2xl mb-6">⚠️</div>
                <h2 className="text-xl font-display font-bold text-[var(--t)] mb-2 tracking-tight">Delete Student?</h2>
                <p className="text-[var(--t3)] text-sm mb-8">This will permanently remove <span className="text-[var(--t)] font-semibold">{studentToDelete.name}</span> and all their associated data. This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStudentToDelete(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--t)] font-medium hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="button" onClick={deleteStudent} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-[0_4px_15px_rgba(244,63,94,0.3)] transition-colors">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Session Confirmation Modal */}
        <AnimatePresence>
          {sessionToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[var(--card)] border border-[var(--border2)] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
                <div className="w-16 h-16 mx-auto bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 text-2xl mb-6">⚠️</div>
                <h2 className="text-xl font-display font-bold text-[var(--t)] mb-2 tracking-tight">Delete Session?</h2>
                <p className="text-[var(--t3)] text-sm mb-8">This will permanently remove <span className="text-[var(--t)] font-semibold">{sessionToDelete.title}</span> ({sessionToDelete.sessionCode}). This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setSessionToDelete(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--t)] font-medium hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="button" onClick={handleDeleteSession} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-[0_4px_15px_rgba(244,63,94,0.3)] transition-colors">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
