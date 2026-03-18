import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['all','Computer Science','Information Technology','Electronics','Mechanical','Civil'];
const YEARS = ['all','1','2','3','4'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ department: 'all', year: 'all' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = Object.entries(filters).filter(([, v]) => v !== 'all').map(([k, v]) => `${k}=${v}`).join('&');
    setLoading(true);
    axios.get(`/api/leaderboard?${q}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filters]);

  const myRank = data.find(d => d._id === user?._id);
  const medal = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="min-h-screen pt-20 px-6 pb-16" style={{ fontFamily: 'Exo 2, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-orange-500/60 font-mono text-xs tracking-[4px] mb-2">COMPETITIVE RANKING</p>
          <h1 className="font-display font-bold text-4xl text-white mb-1">Leader<span className="text-orange-400">board</span></h1>
          <p className="text-white/30 text-sm">Top performers ranked by average interview score</p>
        </motion.div>

        {/* My rank callout */}
        {myRank && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-4 mb-6 flex items-center gap-4"
            style={{ border: '1px solid rgba(249,115,22,0.4)', background: 'rgba(249,115,22,0.06)' }}>
            <span className="text-orange-400 font-mono text-sm">YOUR RANK</span>
            <span className="font-display font-bold text-2xl text-orange-400">#{myRank.rank}</span>
            <span className="text-white/30 text-sm">·</span>
            <span className="text-white/60 text-sm">{myRank.averageScore}% avg</span>
            <span className="text-white/30 text-sm">·</span>
            <span className="text-white/60 text-sm">{myRank.totalInterviews} interviews</span>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          {[['department', DEPARTMENTS], ['year', YEARS]].map(([key, opts]) => (
            <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              className="input-dark w-44 capitalize">
              {opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${key}s` : `Year ${o}`}</option>)}
            </select>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && data.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[1, 0, 2].map(idx => {
              const s = data[idx];
              if (!s) return null;
              const isFirst = idx === 0;
              const heights = [0, 'pb-6', 0, 'pb-3'];
              return (
                <motion.div key={s._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  className={`flex-1 max-w-36 glass-card p-4 text-center ${idx === 0 ? 'border-orange-500/40' : ''} ${heights[idx+1] || ''}`}
                  style={isFirst ? { border: '1px solid rgba(249,115,22,0.5)', background: 'rgba(249,115,22,0.06)' } : {}}>
                  <div className="text-2xl mb-1">{medal[s.rank]}</div>
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 mx-auto mb-2">{s.name[0]}</div>
                  <p className="text-white text-xs font-medium truncate">{s.name}</p>
                  <p className="text-white/30 text-xs truncate">{s.department}</p>
                  <p className="font-display font-bold text-lg mt-1" style={{ color: isFirst ? '#f97316' : '#888' }}>{s.averageScore}%</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"/></div>
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-white/30">No rankings yet. Complete interviews to appear here!</div>
          ) : (
            <div>
              {data.map((s, i) => {
                const isMe = s._id === user?._id;
                const color = s.averageScore >= 70 ? '#22c55e' : s.averageScore >= 40 ? '#eab308' : '#ef4444';
                return (
                  <motion.div key={s._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className="flex items-center gap-4 p-4 border-b transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)', background: isMe ? 'rgba(249,115,22,0.05)' : 'transparent' }}>
                    <div className="w-8 text-center">
                      {medal[s.rank] || <span className="text-white/25 font-mono text-sm">#{s.rank}</span>}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-sm">{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-orange-400' : 'text-white'}`}>{s.name} {isMe && '(You)'}</p>
                      <p className="text-white/30 text-xs">{s.department} · Year {s.year}</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="text-white/30 text-xs font-mono">{s.totalInterviews} interviews</p>
                    </div>
                    <div className="text-center w-20">
                      <p className="font-display font-bold text-lg" style={{ color }}>{s.averageScore}%</p>
                      <p className="text-white/20 text-xs font-mono">avg</p>
                    </div>
                    <div className="text-center w-16">
                      <p className="text-white/50 font-mono text-sm">{s.bestScore}%</p>
                      <p className="text-white/20 text-xs">best</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
