import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/* ─── Score Ring SVG ─── */
const ScoreRing = ({ score, size = 90, label }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'var(--score-green)' : score >= 40 ? 'var(--score-yellow)' : 'var(--score-red)';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth="6"/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%' }}/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fill={color} fontSize="17" fontFamily="Outfit" fontWeight="bold">{score}</text>
      </svg>
      <span style={{ color:'var(--t4)', fontSize:11, fontFamily:'JetBrains Mono', textAlign:'center', lineHeight:1.3 }}>{label}</span>
    </div>
  );
};

/* ─── Answer Guide Component ─── */
const AnswerGuide = ({ data, questions, expandedQ, setExpandedQ }) => {
  // Build guide items from answerGuide (AI-generated) or fallback to raw questions
  const items = React.useMemo(() => {
    if (data?.answerGuide?.length > 0) return data.answerGuide;
    // Build from raw questions
    return (questions || []).map(q => ({
      question:        q.question || '',
      candidateAnswer: q.answer   || 'No answer provided',
      score:           q.score    || 0,
      whatWentWell:    q.score >= 60 ? 'You addressed the main concept.' : 'You attempted the question.',
      whatWasMissing:  q.aiFeedback || 'More depth and specific examples needed.',
      idealAnswer:     q.correctAnswer || 'Study this topic and practice a clear, structured answer with a real-world example.',
      practicePrompt:  q.question || '',
    }));
  }, [data, questions]);

  const exportPDF = () => {
    const studentName = data?.student?.name || 'Candidate';
    const dateStr = data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    const dateForFile = dateStr.replace(/\//g, '-');
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #000; padding: 20px;">
        <h1 style="text-align: center; color: #333;">Interview Answer Guide</h1>
        <p style="text-align: center; color: #666; font-style: italic; margin-bottom: 20px;">Attended by: ${studentName} &nbsp;|&nbsp; Date: ${dateStr}</p>
        <hr/>
        ${items.map((item, i) => `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <h3>Q${i + 1}: ${item.question}</h3>
            <p><strong>Your Answer:</strong> ${item.candidateAnswer || 'No answer provided'}</p>
            <p><strong>Score:</strong> ${item.score}/100</p>
            <p style="color: green;"><strong>What You Got Right:</strong> ${item.whatWentWell || 'You covered the main concept.'}</p>
            <p style="color: #b8860b;"><strong>What Was Missing:</strong> ${item.whatWasMissing || 'Add more specific examples and technical depth to score higher.'}</p>
            <div style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #007bff; margin-top: 10px;">
              <p><strong>Ideal Answer:</strong></p>
              <p>${item.idealAnswer}</p>
            </div>
            <p><strong>Practice Prompt:</strong> <em>${item.practicePrompt || item.question}</em></p>
          </div>
        `).join('')}
      </div>
    `;

    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Answer_Guide_${studentName.replace(/\s+/g, '_')}_${dateForFile}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const exportWord = () => {
    const studentName = data?.student?.name || 'Candidate';
    const dateStr = data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    const dateForFile = dateStr.replace(/\//g, '-');
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Answer Guide</title></head><body>";
    const footer = "</body></html>";
    const body = `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <h1 style="text-align: center;">Interview Answer Guide</h1>
        <p style="text-align: center; color: #666; font-style: italic; margin-bottom: 20px;">Attended by: ${studentName} &nbsp;|&nbsp; Date: ${dateStr}</p>
        <hr/>
        ${items.map((item, i) => `
          <div style="margin-bottom: 20px;">
            <h3>Q${i + 1}: ${item.question}</h3>
            <p><strong>Your Answer:</strong> ${item.candidateAnswer || 'No answer provided'}</p>
            <p><strong>Score:</strong> ${item.score}/100</p>
            <p style="color: green;"><strong>What You Got Right:</strong> ${item.whatWentWell || 'You covered the main concept.'}</p>
            <p style="color: #b8860b;"><strong>What Was Missing:</strong> ${item.whatWasMissing || 'Add more specific examples and technical depth to score higher.'}</p>
            <div style="background-color: #f9f9f9; padding: 10px; border: 1px solid #ccc;">
              <p><strong>Ideal Answer:</strong></p>
              <p>${item.idealAnswer}</p>
            </div>
            <p><strong>Practice Prompt:</strong> <em>${item.practicePrompt || item.question}</em></p>
          </div>
        `).join('')}
      </div>
    `;
    const sourceHTML = header + body + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Answer_Guide_${studentName.replace(/\s+/g, '_')}_${dateForFile}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85; u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || (v.lang === 'en-US' && v.name.includes('Google')));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  if (!items.length) return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
      <p style={{ color:'var(--t3)', fontFamily:'Outfit', fontSize:18 }}>No answers recorded yet.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
      {/* Header card */}
      <div style={{ background:'var(--od)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:250 }}>
          <span style={{ fontSize:24 }}>📚</span>
          <div>
            <p style={{ color:'var(--o)', fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:2, marginBottom:3 }}>ANSWER GUIDE — STUDY & PRACTICE</p>
            <p style={{ color:'var(--t3)', fontSize:13 }}>
              Click any question to see what you got right, what was missing, and the ideal answer to memorise.
              Use the <strong style={{ color:'var(--t2)' }}>🔊 Listen</strong> button to hear model answers spoken aloud.
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, alignSelf:'center' }}>
          <button onClick={exportPDF} style={{ background:'var(--card)', border:'1px solid var(--border)', padding:'8px 14px', borderRadius:8, color:'var(--t2)', fontSize:13, fontFamily:'Outfit', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'background .2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--card2)'} onMouseLeave={e => e.currentTarget.style.background='var(--card)'}>
            📄 Download PDF
          </button>
          <button onClick={exportWord} style={{ background:'var(--card)', border:'1px solid var(--border)', padding:'8px 14px', borderRadius:8, color:'var(--t2)', fontSize:13, fontFamily:'Outfit', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'background .2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--card2)'} onMouseLeave={e => e.currentTarget.style.background='var(--card)'}>
            📝 Download Word
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {items.map((item, i) => {
          const isOpen = expandedQ === i;
          const score  = item.score || 0;
          const scoreColor = score >= 70 ? 'var(--score-green)' : score >= 40 ? 'var(--score-yellow)' : 'var(--score-red)';
          const badge = score >= 70 ? '✅ Good' : score >= 40 ? '⚠️ Review' : '❌ Study';

          return (
            <div key={i} style={{ border:`1px solid ${isOpen ? 'var(--o)' : 'var(--border)'}`, borderRadius:12, overflow:'hidden', background:'var(--card)', transition:'border-color .2s' }}>
              {/* Clickable header */}
              <div onClick={() => setExpandedQ(isOpen ? null : i)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--card2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                {/* Circle score */}
                <div style={{ width:42, height:42, borderRadius:'50%', border:`2px solid ${scoreColor}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`${scoreColor}15` }}>
                  <span style={{ fontFamily:'Outfit', fontWeight:700, fontSize:14, color:scoreColor }}>{score}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'var(--t)', fontSize:14, fontWeight:500, marginBottom:2, lineHeight:1.4 }}>{item.question}</p>
                  <span style={{ color:scoreColor, fontSize:11, fontFamily:'JetBrains Mono' }}>{badge}</span>
                </div>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ color:'var(--t4)', fontSize:16, flexShrink:0 }}>▾</motion.span>
              </div>

              {/* Expanded detail */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="detail"
                    initial={{ height:0, opacity:0 }}
                    animate={{ height:'auto', opacity:1 }}
                    exit={{ height:0, opacity:0 }}
                    transition={{ duration:0.25, ease:'easeInOut' }}
                    style={{ overflow:'hidden' }}>
                    <div style={{ borderTop:'1px solid var(--border)', padding:'18px 18px 20px' }}>

                      {/* Row 1: Your answer + What was correct */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                        <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, padding:14 }}>
                          <p style={{ color:'var(--t4)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2, marginBottom:8 }}>YOUR ANSWER</p>
                          <p style={{ color:'var(--t2)', fontSize:13, lineHeight:1.7 }}>
                            {item.candidateAnswer && item.candidateAnswer !== 'No answer provided'
                              ? item.candidateAnswer
                              : <em style={{ color:'var(--t4)' }}>No answer recorded</em>}
                          </p>
                        </div>
                        <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10, padding:14 }}>
                          <p style={{ color:'var(--score-green)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2, marginBottom:8 }}>✅ WHAT YOU GOT RIGHT</p>
                          <p style={{ color:'var(--t2)', fontSize:13, lineHeight:1.7 }}>
                            {item.whatWentWell || (score >= 60 ? 'You covered the main concept.' : 'You showed some understanding.')}
                          </p>
                        </div>
                      </div>

                      {/* What was missing */}
                      <div style={{ background:'rgba(234,179,8,0.06)', border:'1px solid rgba(234,179,8,0.2)', borderRadius:10, padding:14, marginBottom:12 }}>
                        <p style={{ color:'var(--score-yellow)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2, marginBottom:8 }}>⚠️ WHAT WAS MISSING</p>
                        <p style={{ color:'var(--t2)', fontSize:13, lineHeight:1.7 }}>
                          {item.whatWasMissing || 'Add more specific examples and technical depth to score higher.'}
                        </p>
                      </div>

                      {/* Ideal answer */}
                      <div style={{ background:`${scoreColor}08`, border:`1px solid ${scoreColor}30`, borderRadius:10, padding:16, marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                          <p style={{ color:scoreColor, fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2 }}>💡 IDEAL ANSWER — MEMORISE THIS</p>
                          <button
                            onClick={() => speak(item.idealAnswer)}
                            style={{ background:'none', border:`1px solid ${scoreColor}50`, color:scoreColor, borderRadius:6, padding:'3px 10px', fontSize:11, fontFamily:'JetBrains Mono', cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all .2s' }}
                            onMouseEnter={e => e.currentTarget.style.background=`${scoreColor}15`}
                            onMouseLeave={e => e.currentTarget.style.background='none'}>
                            🔊 Listen
                          </button>
                        </div>
                        <p style={{ color:'var(--t)', fontSize:14, lineHeight:1.85, fontWeight:400 }}>
                          {item.idealAnswer || 'Study this topic and practice a clear, structured response with a real example from your experience.'}
                        </p>
                      </div>

                      {/* Practice prompt */}
                      <div style={{ background:'var(--od)', border:'1px solid var(--border)', borderRadius:10, padding:12, display:'flex', alignItems:'flex-start', gap:10 }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>🎯</span>
                        <div>
                          <p style={{ color:'var(--o)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2, marginBottom:4 }}>PRACTICE THIS TONIGHT</p>
                          <p style={{ color:'var(--t3)', fontSize:13, fontStyle:'italic', lineHeight:1.6 }}>
                            "{item.practicePrompt || item.question}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ─── Main Results Page ─── */
export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    axios.get(`/api/results/${id}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:40, height:40, borderWidth:3, margin:'0 auto 16px' }}/>
        <p style={{ color:'var(--o)', fontFamily:'JetBrains Mono', fontSize:12, letterSpacing:2 }}>LOADING RESULTS...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t4)', fontFamily:'Inter' }}>
      Results not found
    </div>
  );

  const { scores = {}, questions = [], skillGaps = [], aiFeedbackSummary, duration = 0, type, difficulty, videoMetrics } = data;
  const scoreLabels = ['Technical', 'Communication', 'Confidence', 'Problem Solving', 'Clarity'];
  const scoreValues = [
    scores.technicalKnowledge || 0,
    scores.communication      || 0,
    scores.confidence         || 0,
    scores.problemSolving     || 0,
    scores.clarity            || 0,
  ];
  const overall = scores.overall || 0;
  const overallColor = overall >= 70 ? 'var(--score-green)' : overall >= 40 ? 'var(--score-yellow)' : 'var(--score-red)';
  const severityColor = { low:'var(--score-green)', medium:'var(--score-yellow)', high:'var(--score-red)' };

  const radarData = {
    labels: scoreLabels,
    datasets: [{
      label: 'Your Scores',
      data: scoreValues,
      backgroundColor: 'rgba(249,115,22,0.12)',
      borderColor: '#f97316',
      borderWidth: 2,
      pointBackgroundColor: '#f97316',
      pointRadius: 4,
    }]
  };
  const radarOptions = {
    scales: { r: { beginAtZero:true, max:100,
      ticks: { color:'var(--t4)', backdropColor:'transparent', stepSize:20 },
      grid: { color:'rgba(128,128,128,0.15)' },
      angleLines: { color:'rgba(128,128,128,0.15)' },
      pointLabels: { color:'var(--t3)', font:{ family:'Inter', size:11 } }
    }},
    plugins: { legend: { display:false } },
  };

  const TABS = ['overview', 'questions', 'answer guide', 'skill gaps'];

  return (
    <div style={{ minHeight:'100vh', paddingTop:80, padding:'80px 16px 64px', fontFamily:'Exo 2, sans-serif' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <p style={{ color:'rgba(249,115,22,0.55)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:4, marginBottom:8 }}>INTERVIEW COMPLETE</p>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'Outfit', fontWeight:700, fontSize:'clamp(32px,6vw,52px)', color:'var(--t)', marginBottom:4, lineHeight:1 }}>
                Your <span style={{ color:'var(--o)' }}>Results</span>
              </h1>
              <p style={{ color:'var(--t4)', fontSize:13, textTransform:'capitalize' }}>
                {type} · {difficulty} · {Math.floor(duration/60)}m {duration%60}s
              </p>
            </div>
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring' }}
              style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize:'clamp(56px,10vw,80px)', color:overallColor, lineHeight:1 }}>{overall}</div>
              <p style={{ color:'var(--t4)', fontSize:12, fontFamily:'JetBrains Mono' }}>/ 100</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:4, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:4, marginBottom:24, width:'fit-content', flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'9px 18px', borderRadius:9, fontFamily:'Outfit', fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'capitalize', cursor:'pointer', transition:'all .2s', border:'none',
                background: tab === t ? 'var(--o)' : 'transparent',
                color:       tab === t ? '#fff'    : 'var(--t3)',
              }}>
              {t === 'answer guide' ? '📚 Answer Guide' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16 }}>
              {/* Score rings + radar */}
              <div className="glass-card" style={{ padding:24 }}>
                <p style={{ color:'rgba(249,115,22,0.55)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:3, marginBottom:20 }}>SCORE BREAKDOWN</p>
                <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-around', gap:16, marginBottom:16 }}>
                  {scoreLabels.map((l, i) => <ScoreRing key={l} score={scoreValues[i]} label={l} />)}
                </div>
                <div style={{ height:200 }}><Radar data={radarData} options={radarOptions} /></div>
              </div>

              {/* Right side cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div className="glass-card" style={{ padding:18 }}>
                  <p style={{ color:'rgba(249,115,22,0.55)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:3, marginBottom:10 }}>AI SUMMARY</p>
                  <p style={{ color:'var(--t2)', fontSize:13, lineHeight:1.7 }}>{aiFeedbackSummary || 'Interview completed. Review the Answer Guide to improve.'}</p>
                </div>
                <div className="glass-card" style={{ padding:18 }}>
                  <p style={{ color:'rgba(249,115,22,0.55)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:3, marginBottom:10 }}>QUICK STATS</p>
                  {[
                    ['Questions',  questions.length],
                    ['Answered',   questions.filter(q => q.answer).length],
                    ['Duration',   `${Math.floor(duration/60)}m ${duration%60}s`],
                    ['Skill Gaps', skillGaps.length],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border2)' }}>
                      <span style={{ color:'var(--t3)', fontSize:13 }}>{l}</span>
                      <span style={{ color:'var(--t)', fontSize:13, fontFamily:'JetBrains Mono' }}>{v}</span>
                    </div>
                  ))}
                </div>
                {videoMetrics?.eyeContactScore > 0 && (
                  <div className="glass-card" style={{ padding:18 }}>
                    <p style={{ color:'rgba(249,115,22,0.55)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:3, marginBottom:10 }}>VIDEO METRICS</p>
                    {[['Eye Contact', videoMetrics.eyeContactScore], ['Posture', videoMetrics.postureScore]].map(([l, v]) => (
                      <div key={l} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ color:'var(--t3)', fontSize:12 }}>{l}</span>
                          <span style={{ color:'var(--o)', fontSize:12, fontFamily:'JetBrains Mono' }}>{Math.round(v)}%</span>
                        </div>
                        <div style={{ height:4, background:'var(--border2)', borderRadius:2, overflow:'hidden' }}>
                          <motion.div style={{ height:'100%', background:'var(--o)', borderRadius:2 }}
                            initial={{ width:0 }} animate={{ width:`${v}%` }} transition={{ duration:1, delay:0.5 }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* QUESTIONS TAB */}
        {tab === 'questions' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {questions.map((q, i) => (
              <div key={i} className="glass-card" style={{ padding:22 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ color:'rgba(249,115,22,0.55)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2 }}>Q{i+1}</span>
                  <span style={{ fontFamily:'Outfit', fontWeight:700, fontSize:20, color: q.score >= 70 ? 'var(--score-green)' : q.score >= 40 ? 'var(--score-yellow)' : 'var(--score-red)' }}>
                    {q.score}<span style={{ color:'var(--t4)', fontSize:12, fontFamily:'JetBrains Mono' }}>/100</span>
                  </span>
                </div>
                <p style={{ color:'var(--t)', fontSize:15, fontWeight:500, marginBottom:10, lineHeight:1.5 }}>{q.question}</p>
                {q.answer && (
                  <p style={{ color:'var(--t3)', fontSize:13, lineHeight:1.7, borderLeft:'2px solid rgba(249,115,22,0.3)', paddingLeft:12, marginBottom:10 }}>
                    {q.answer}
                  </p>
                )}
                {q.aiFeedback && (
                  <p style={{ color:'var(--t4)', fontSize:12, lineHeight:1.7, background:'var(--bg3)', borderRadius:8, padding:'10px 12px' }}>
                    {q.aiFeedback}
                  </p>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ANSWER GUIDE TAB */}
        {tab === 'answer guide' && (
          <AnswerGuide
            data={data}
            questions={questions}
            expandedQ={expandedQ}
            setExpandedQ={setExpandedQ}
          />
        )}

        {/* SKILL GAPS TAB */}
        {tab === 'skill gaps' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            {skillGaps.length === 0 ? (
              <div className="glass-card" style={{ padding:'48px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
                <p style={{ fontFamily:'Outfit', fontWeight:700, fontSize:22, color:'var(--t)', marginBottom:8 }}>No Major Gaps Found</p>
                <p style={{ color:'var(--t3)' }}>Great performance! Keep practicing to stay sharp.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:14 }}>
                {skillGaps.map((g, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}
                    className="glass-card" style={{ padding:22 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <h3 style={{ fontFamily:'Outfit', fontWeight:700, fontSize:18, color:'var(--t)' }}>{g.topic}</h3>
                      <span style={{ fontSize:11, fontFamily:'JetBrains Mono', padding:'2px 8px', borderRadius:4, textTransform:'capitalize', background:`${severityColor[g.severity]}20`, color:severityColor[g.severity], border:`1px solid ${severityColor[g.severity]}40` }}>
                        {g.severity}
                      </span>
                    </div>
                    {g.description && <p style={{ color:'var(--t3)', fontSize:13, marginBottom:12, lineHeight:1.6 }}>{g.description}</p>}
                    {g.suggestions?.length > 0 && (
                      <div>
                        <p style={{ color:'var(--t4)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:2, marginBottom:8 }}>RESOURCES</p>
                        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
                          {g.suggestions.map((s, j) => (
                            <li key={j} style={{ color:'var(--t3)', fontSize:12, display:'flex', alignItems:'flex-start', gap:6 }}>
                              <span style={{ color:'var(--o)' }}>›</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:28 }}>
          <button onClick={() => navigate('/setup')} className="btn-orange" style={{ padding:'12px 28px', borderRadius:12, fontSize:14 }}>
            Practice Again
          </button>
          <button onClick={() => setTab('answer guide')}
            style={{ padding:'12px 28px', borderRadius:12, fontFamily:'Outfit', fontWeight:700, fontSize:14, letterSpacing:1, border:'1px solid var(--border)', background:'var(--od)', color:'var(--o)', cursor:'pointer', transition:'all .2s' }}>
            📚 Study Answer Guide
          </button>
          <button onClick={() => navigate('/dashboard')}
            style={{ padding:'12px 28px', borderRadius:12, fontFamily:'Outfit', fontWeight:700, fontSize:14, letterSpacing:1, border:'1px solid var(--border)', background:'transparent', color:'var(--t3)', cursor:'pointer', transition:'all .2s' }}>
            Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
