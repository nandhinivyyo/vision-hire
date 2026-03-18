import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function InterviewRoomPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { questions = [], useVoice, useVideo, type, difficulty, totalTimeSeconds } = location.state || {};

  const [currentQ, setCurrentQ]     = useState(0);
  const [answer, setAnswer]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback]     = useState(null);
  const [completing, setCompleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft]     = useState(totalTimeSeconds ? Number(totalTimeSeconds) : 180);
  const lastSpeechAtRef = useRef(Date.now());
  const lastNudgeAtRef = useRef(0);
  const nudgeInFlightRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const lastTranscriptUiAtRef = useRef(0);
  const answerRef = useRef('');
  const answerTextareaRef = useRef(null);

  // ── Real video state ──
  const [camStatus, setCamStatus]       = useState('idle'); // idle | requesting | active | denied | nosupport
  const [faceDetected, setFaceDetected] = useState(false);
  const [eyeScore, setEyeScore]         = useState(0);
  const [postureScore, setPostureScore] = useState(0);
  const [facePresence, setFacePresence] = useState(0); // % of frames face was detected
  const [warning, setWarning]           = useState('');
  const [tfReady, setTfReady]           = useState(false);
  const [offscreenCount, setOffscreenCount] = useState(0);
  const offscreenCountRef = useRef(0);
  const autoEndedRef = useRef(false);
  const lastLeaveEventAtRef = useRef(0);
  const faceMissingCountRef = useRef(0);
  const [faceMissingCount, setFaceMissingCount] = useState(0);
  const faceMissingSinceRef = useRef(null);
  const faceMissingTriggeredRef = useRef(false);

  // Tracking refs
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const streamRef       = useRef(null);
  const detectorRef     = useRef(null);
  const detectionLoop   = useRef(null);
  const recognitionRef  = useRef(null);

  // Stats accumulators
  const frameCount      = useRef(0);
  const faceFrames      = useRef(0);
  const eyeScoreAcc     = useRef([]);
  const postureAcc      = useRef([]);

  // ── Timer ──
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [currentQ, totalTimeSeconds]);

  useEffect(() => {
    // Practice mode: per-question timer. Session mode: single overall timer.
    if (!totalTimeSeconds) setTimeLeft(180);
    setAnswer('');
    setFeedback(null);
    answerRef.current = '';
    if (answerTextareaRef.current) answerTextareaRef.current.value = '';
  }, [currentQ]);

  // Auto-finish when overall timer hits zero (session interviews)
  const timeUpRef = useRef(false);
  useEffect(() => {
    if (!totalTimeSeconds) return;
    if (timeLeft > 0) return;
    if (timeUpRef.current) return;
    timeUpRef.current = true;
    toast.error("Time's up! Auto-submitting your interview.", { duration: 3500 });
    finishInterview();
  }, [timeLeft, totalTimeSeconds]);

  const autoEndInterview = useCallback(async (reason) => {
    if (autoEndedRef.current) return;
    autoEndedRef.current = true;
    setCompleting(true);
    stopCamera();
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel?.();
    try {
      await axios.post(`/api/interview/${id}/abandon`, {
        reason,
        videoMetrics: useVideo ? {
          eyeContactScore: eyeScore,
          postureScore: postureScore,
          facePresencePercent: facePresence,
          warnings: [reason]
        } : { warnings: [reason] }
      });
    } catch { /* ignore */ }
    navigate(`/results/${id}`);
  }, [id, useVideo, eyeScore, postureScore, facePresence, navigate]);

  // ── Off-screen / tab switch detection (video sessions) ──
  useEffect(() => {
    if (!useVideo) return;
    const warnAndCount = (why) => {
      if (autoEndedRef.current) return;
      // Debounce: a single tab switch often triggers both visibilitychange + blur.
      const now = Date.now();
      if (now - lastLeaveEventAtRef.current < 1200) return;
      lastLeaveEventAtRef.current = now;

      offscreenCountRef.current += 1;
      setOffscreenCount(offscreenCountRef.current);
      const left = 2 - offscreenCountRef.current;
      const msg = left > 0
        ? `⚠️ Warning ${offscreenCountRef.current}/2: Do not leave the interview screen (${why}).`
        : `❌ You left the interview screen 2 times. Interview auto-ended.`;
      setWarning(msg);
      toast.error(msg, { duration: 4000 });
      if (offscreenCountRef.current >= 2) {
        autoEndInterview('Auto-ended: user left the interview screen twice');
      }
    };

    const onVis = () => { if (document.hidden) warnAndCount('tab switched / minimized'); };
    const onBlur = () => warnAndCount('window lost focus');
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
    };
  }, [useVideo, autoEndInterview]);

  // ── Face missing detection (video sessions): 2 strikes => auto end ──
  useEffect(() => {
    if (!useVideo) return;
    if (autoEndedRef.current) return;

    // If camera isn't active yet, don't penalize.
    if (camStatus !== 'active') return;

    const now = Date.now();
    if (faceDetected) {
      faceMissingSinceRef.current = null;
      faceMissingTriggeredRef.current = false;
      return;
    }

    if (!faceMissingSinceRef.current) faceMissingSinceRef.current = now;

    const missingMs = now - faceMissingSinceRef.current;
    // Require a brief continuous miss to avoid noisy false positives.
    if (missingMs < 2500) return;
    // Only count one strike per "missing period" until face returns.
    if (faceMissingTriggeredRef.current) return;
    faceMissingTriggeredRef.current = true;

    faceMissingCountRef.current += 1;
    setFaceMissingCount(faceMissingCountRef.current);
    const left = 2 - faceMissingCountRef.current;
    const msg = left > 0
      ? `⚠️ Face missing ${faceMissingCountRef.current}/2: Keep your face inside the frame.`
      : `❌ Face missing 2 times. Interview auto-ended.`;
    setWarning(msg);
    toast.error(msg, { duration: 4000 });
    if (faceMissingCountRef.current >= 2) {
      autoEndInterview('Auto-ended: face missing twice');
    }
  }, [useVideo, camStatus, faceDetected, autoEndInterview]);

  // ── TTS ──
  useEffect(() => {
    if (useVoice && questions[currentQ]?.question && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(questions[currentQ].question);
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      setTimeout(() => window.speechSynthesis.speak(u), 500);
    }
  }, [currentQ, useVoice, questions]);

  // ── Load TensorFlow + BlazeFace via CDN ──
  useEffect(() => {
    if (!useVideo) return;
    let cancelled = false;

    const loadScripts = async () => {
      // Load TF.js core
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
      if (cancelled) return;
      // Load BlazeFace model
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js');
      if (cancelled) return;
      setTfReady(true);
    };

    loadScripts().catch(() => {
      // TF failed to load — use brightness-based fallback
      setTfReady('fallback');
    });

    return () => { cancelled = true; };
  }, [useVideo]);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── Request webcam once TF is ready ──
  useEffect(() => {
    if (!useVideo || !tfReady) return;
    startCamera();
    return () => stopCamera();
  }, [useVideo, tfReady]);

  const startCamera = async () => {
    setCamStatus('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamStatus('nosupport');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamStatus('active');

      // Start face detection loop
      if (tfReady === 'fallback') {
        startBrightnessLoop();
      } else {
        await startBlazeFaceLoop();
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCamStatus('denied');
      } else {
        setCamStatus('denied');
      }
      console.warn('Camera error:', err.message);
    }
  };

  const stopCamera = () => {
    if (detectionLoop.current) clearInterval(detectionLoop.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ── BlazeFace face detection loop ──
  const startBlazeFaceLoop = async () => {
    try {
      const model = await window.blazeface.load();
      detectorRef.current = model;

      detectionLoop.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const predictions = await model.estimateFaces(videoRef.current, false);
          processDetection(predictions.length > 0, predictions[0]);
        } catch { /* ignore frame errors */ }
      }, 500); // run every 500ms
    } catch {
      startBrightnessLoop();
    }
  };

  // ── Brightness-based fallback (no ML, uses canvas pixel analysis) ──
  const startBrightnessLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    detectionLoop.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      canvas.width = 160; canvas.height = 120;
      ctx.drawImage(videoRef.current, 0, 0, 160, 120);
      const img = ctx.getImageData(0, 0, 160, 120);

      // Measure brightness variance — if camera is covered/off, variance is near 0
      let sum = 0, sumSq = 0;
      for (let i = 0; i < img.data.length; i += 16) {
        const gray = 0.299 * img.data[i] + 0.587 * img.data[i+1] + 0.114 * img.data[i+2];
        sum += gray; sumSq += gray * gray;
      }
      const n = img.data.length / 16;
      const mean = sum / n;
      const variance = (sumSq / n) - (mean * mean);

      // Skin tone detection in center zone (where face usually is)
      const centerData = ctx.getImageData(40, 20, 80, 80);
      let skinPixels = 0;
      for (let i = 0; i < centerData.data.length; i += 4) {
        const r = centerData.data[i], g = centerData.data[i+1], b = centerData.data[i+2];
        // Basic skin tone heuristic
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r-g) > 15) skinPixels++;
      }
      const skinRatio = skinPixels / (centerData.data.length / 4);
      const likelyFace = variance > 100 && skinRatio > 0.08;
      processDetection(likelyFace, null);
    }, 800);
  };

  // ── Process detection result into scores ──
  const processDetection = (detected, prediction) => {
    frameCount.current++;
    if (detected) faceFrames.current++;

    setFaceDetected(detected);
    const presence = Math.round((faceFrames.current / frameCount.current) * 100);
    setFacePresence(presence);

    if (detected) {
      setWarning('');

      // Eye contact: use face position relative to center (if we have BlazeFace data)
      let eyeVal = 0;
      if (prediction?.landmarks) {
        // landmarks[0]=right eye, [1]=left eye
        const [re, le] = [prediction.landmarks[0], prediction.landmarks[1]];
        const centerX = videoRef.current ? videoRef.current.videoWidth / 2 : 160;
        const centerY = videoRef.current ? videoRef.current.videoHeight / 2 : 120;
        const eyeMidX = (re[0] + le[0]) / 2;
        const eyeMidY = (re[1] + le[1]) / 2;
        const distX = Math.abs(eyeMidX - centerX) / centerX;
        const distY = Math.abs(eyeMidY - centerY) / centerY;
        eyeVal = Math.round(Math.max(30, 100 - (distX * 60) - (distY * 40)));
      } else {
        // Fallback: good if face detected, add small random variation
        eyeVal = Math.round(65 + Math.random() * 20);
      }

      // Posture: use face bounding box size (bigger = closer/better)
      let postureVal = 0;
      if (prediction?.topLeft && prediction?.bottomRight) {
        const faceH = prediction.bottomRight[1] - prediction.topLeft[1];
        const frameH = videoRef.current?.videoHeight || 240;
        const ratio = faceH / frameH;
        // 0.2–0.5 ratio = ideal posture distance
        postureVal = ratio < 0.1 ? 40 : ratio > 0.7 ? 50 : Math.round(60 + ratio * 80);
        postureVal = Math.min(95, postureVal);
      } else {
        postureVal = Math.round(60 + Math.random() * 25);
      }

      eyeScoreAcc.current.push(eyeVal);
      postureAcc.current.push(postureVal);

      // Smooth with rolling average (last 6 frames)
      const recentEye = eyeScoreAcc.current.slice(-6);
      const recentPosture = postureAcc.current.slice(-6);
      setEyeScore(Math.round(recentEye.reduce((a,b)=>a+b,0)/recentEye.length));
      setPostureScore(Math.round(recentPosture.reduce((a,b)=>a+b,0)/recentPosture.length));

    } else {
      // No face detected
      setEyeScore(0);
      setPostureScore(0);
      if (frameCount.current > 4) {
        setWarning('⚠️ Face not detected — please look at the camera');
      }
    }
  };

  // ── Voice recording ──
  const startVoice = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast.error('Speech recognition not supported in this browser (try Chrome/Edge).');
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      return toast.error('Mic requires HTTPS (or localhost).');
    }
    // If already running, stop and restart cleanly
    try { recognitionRef.current?.stop?.(); } catch {}

    // Force microphone permission prompt first (improves reliability)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
      }
    } catch (e) {
      return toast.error('Microphone permission denied. Allow mic access in browser settings.');
    }

    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    finalTranscriptRef.current = '';
    r.onresult = (e) => {
      lastSpeechAtRef.current = Date.now();
      let interim = '';

      // Only process new results (fast), keep final transcript in a ref.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res?.[0]?.transcript || '';
        if (res.isFinal) finalTranscriptRef.current += txt;
        else interim += txt;
      }

      // Throttle UI updates to keep typing snappy.
      const now = performance.now();
      if (now - lastTranscriptUiAtRef.current < 80) return;
      lastTranscriptUiAtRef.current = now;

      const combined = (finalTranscriptRef.current + interim).trim();
      answerRef.current = combined;
      if (answerTextareaRef.current) answerTextareaRef.current.value = combined;
    };
    r.onstart = () => setIsRecording(true);
    r.onerror = (ev) => {
      setIsRecording(false);
      const code = ev?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast.error('Mic blocked. Allow microphone access and try again.');
      } else if (code === 'no-speech') {
        toast.error('No speech detected. Try speaking closer to the mic.');
      } else if (code) {
        toast.error(`Mic error: ${code}`);
      } else {
        toast.error('Mic error. Try again.');
      }
    };
    r.onend = () => setIsRecording(false);
    try {
      r.start();
    } catch {
      setIsRecording(false);
      toast.error('Could not start mic. Try refreshing the page.');
      return;
    }
    recognitionRef.current = r;
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const speakHr = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.pitch = 1.0;
      u.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Female') || v.name.includes('Samantha') ||
        v.name.includes('Karen') || v.name.includes('Moira') ||
        (v.lang === 'en-US' && v.name.includes('Google'))
      );
      if (preferred) u.voice = preferred;
      window.speechSynthesis.speak(u);
    }, 250);
  };

  // ── HR assist when silent during voice (feels like a real interviewer) ──
  useEffect(() => {
    if (!isRecording) return;
    // Reset timers when (re)starting recording
    lastSpeechAtRef.current = Date.now();
    const interval = setInterval(async () => {
      if (!isRecording) return;
      if (autoEndedRef.current) return;
      if (feedback) return; // don't interrupt feedback state
      if (window.speechSynthesis?.speaking) return;

      const now = Date.now();
      const silentMs = now - lastSpeechAtRef.current;
      // Candidate is "stuck" if silent for 8s while recording
      if (silentMs < 8000) return;

      // Cooldown so HR doesn't keep interrupting
      if (now - lastNudgeAtRef.current < 20000) return;
      if (nudgeInFlightRef.current) return;

      nudgeInFlightRef.current = true;
      lastNudgeAtRef.current = now;
      try {
        const res = await axios.post(`/api/interview/${id}/nudge`, {
          questionIndex: currentQ,
          partialAnswer: answerRef.current || answer || ''
        });
        const nudge = res.data?.nudge;
        if (nudge) {
          setWarning(`🤝 HR: ${nudge}`);
          speakHr(nudge);
        }
      } catch {
        // ignore nudge errors
      } finally {
        nudgeInFlightRef.current = false;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, id, currentQ, answer, feedback]);

  // ── Speak AI feedback aloud like a real interviewer ──
  const speakFeedback = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Small delay so it feels natural
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.88;
      u.pitch = 1.0;
      u.volume = 1.0;
      // Try to use a female voice for HR feel
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Female') || v.name.includes('Samantha') ||
        v.name.includes('Karen') || v.name.includes('Moira') ||
        (v.lang === 'en-US' && v.name.includes('Google'))
      );
      if (preferred) u.voice = preferred;
      window.speechSynthesis.speak(u);
    }, 300);
  };

  // ── Submit answer ──
  const submitAnswer = async () => {
    const currentAnswer = (answerRef.current || answer || '').trim();
    if (!currentAnswer) return toast.error('Please provide an answer');
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/interview/${id}/answer`, {
        questionIndex: currentQ,
        answer: currentAnswer,
        videoMetrics: useVideo ? {
          eyeContactScore: eyeScore,
          postureScore: postureScore,
          faceDetected
        } : undefined
      });
      setFeedback(res.data.evaluation);
      // Speak the AI's voice response like a real HR interviewer
      const voiceText = res.data.voiceResponse || res.data.evaluation?.voiceResponse || res.data.evaluation?.feedback;
      if (voiceText) speakFeedback(voiceText);

      if (!res.data.isComplete) {
        // Wait for voice to finish before moving to next question
        const voiceDelay = voiceText ? Math.max(5000, voiceText.length * 60) : 4000;
        setTimeout(() => {
          window.speechSynthesis.cancel();
          setCurrentQ(q => q + 1);
        }, voiceDelay);
      }
    } catch { toast.error('Failed to submit answer'); }
    finally { setSubmitting(false); }
  };

  // ── Finish interview ──
  const finishInterview = async () => {
    setCompleting(true);
    window.speechSynthesis?.cancel();
    try {
      await axios.post(`/api/interview/${id}/complete`, {
        videoMetrics: {
          eyeContactScore: eyeScore,
          postureScore: postureScore,
          facePresencePercent: facePresence
        }
      });
      navigate(`/results/${id}`);
    } catch { toast.error('Failed to complete'); setCompleting(false); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const progress = (currentQ / Math.max(questions.length, 1)) * 100;
  const isLast = currentQ >= questions.length - 1;
  const q = questions[currentQ]?.question;

  // Cam status UI
  const CamOverlay = () => {
    if (camStatus === 'active') return null;
    const msgs = {
      idle: null,
      requesting: { icon: '📷', text: 'Requesting camera access...' },
      denied: { icon: '🚫', text: 'Camera access denied.\nAllow camera in browser settings.' },
      nosupport: { icon: '❌', text: 'Camera not supported in this browser.' },
    };
    const m = msgs[camStatus];
    if (!m) return null;
    return (
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', borderRadius:12, gap:8, padding:12 }}>
        <span style={{ fontSize:28 }}>{m.icon}</span>
        <p style={{ color:'var(--t3)', fontSize:11, fontFamily:'JetBrains Mono', textAlign:'center', whiteSpace:'pre-line' }}>{m.text}</p>
        {camStatus === 'denied' && (
          <button onClick={startCamera} style={{ marginTop:4, background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', color:'#f97316', borderRadius:6, padding:'4px 12px', fontSize:11, cursor:'pointer', fontFamily:'JetBrains Mono' }}>
            Retry
          </button>
        )}
      </div>
    );
  };

  const [showExitDialog, setShowExitDialog] = useState(false);
  const handleExit = () => setShowExitDialog(true);
  const confirmExit = () => {
    stopCamera();
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    navigate('/dashboard');
  };

  const scoreColor = (s) => s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : s > 0 ? '#ef4444' : '#555';

  // Close dialog on Esc
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowExitDialog(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', backgroundImage:'linear-gradient(rgba(249,115,22,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.04) 1px,transparent 1px)', backgroundSize:'40px 40px', display:'flex', flexDirection:'column', fontFamily:'Exo 2, sans-serif' }}>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display:'none' }} />

      {/* ── EXIT CONFIRMATION DIALOG ── */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowExitDialog(false)}>
            <motion.div
              initial={{ scale:0.88, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.88, opacity:0 }}
              transition={{ type:'spring', stiffness:340, damping:26 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'var(--bg2)', border:'1px solid rgba(249,115,22,0.35)', borderRadius:16, padding:'32px 28px', maxWidth:400, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.5)', textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(239,68,68,0.12)', border:'2px solid rgba(239,68,68,0.35)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:26 }}>⚠️</div>
              <h2 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:22, color:'var(--t)', marginBottom:8 }}>Exit Interview?</h2>
              <p style={{ color:'var(--t3)', fontSize:14, lineHeight:1.65, marginBottom:6 }}>
                You have answered <strong style={{ color:'var(--t)' }}>{currentQ} of {questions.length}</strong> questions.
              </p>
              <p style={{ color:'rgba(239,68,68,0.7)', fontSize:12, marginBottom:24, fontFamily:'JetBrains Mono' }}>
                Progress will be lost if you abandon.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowExitDialog(false)}
                  style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid var(--border)', background:'var(--card)', color:'var(--t)', fontFamily:'Rajdhani', fontWeight:700, fontSize:13, letterSpacing:1, cursor:'pointer', transition:'all .2s' }}>
                  ← Stay
                </button>
                <button onClick={() => { setShowExitDialog(false); finishInterview(); }}
                  style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', fontFamily:'Rajdhani', fontWeight:700, fontSize:12, letterSpacing:1, cursor:'pointer', boxShadow:'0 0 16px rgba(249,115,22,0.3)' }}>
                  🎯 Get Report
                </button>
                <button onClick={confirmExit}
                  style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid rgba(239,68,68,0.35)', background:'rgba(239,68,68,0.08)', color:'#ef4444', fontFamily:'Rajdhani', fontWeight:700, fontSize:13, letterSpacing:1, cursor:'pointer', transition:'all .2s' }}>
                  ✕ Leave
                </button>
              </div>
              <p style={{ color:'var(--t4)', fontSize:10, fontFamily:'JetBrains Mono', marginTop:12 }}>Press Esc to dismiss</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderBottom:'1px solid rgba(249,115,22,0.15)', background:'var(--nav-bg)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:100, gap:12 }}>

        {/* Left: clickable logo + live badge */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <button onClick={handleExit} title="Exit interview"
            style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, transition:'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(249,115,22,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}>
            <div style={{ width:28, height:28, borderRadius:6, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width:16, height:16 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily:'Rajdhani', fontWeight:700, color:'var(--t)', letterSpacing:2, fontSize:15 }}>
              VISION<span style={{ color:'#f97316' }}>HIRE</span>
            </span>
          </button>
          <div style={{ width:1, height:18, background:'var(--border2)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span className="pulse-dot" />
            <span style={{ color:'#f97316', fontSize:10, fontFamily:'JetBrains Mono', letterSpacing:2 }}>LIVE</span>
            <span style={{ color:'var(--t4)', fontSize:10, fontFamily:'JetBrains Mono', textTransform:'capitalize' }}>{type} · {difficulty}</span>
          </div>
        </div>

        {/* Center: dot progress */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flex:1, justifyContent:'center' }}>
          {questions.map((_, i) => (
            <div key={i} style={{ width: i === currentQ ? 18 : 7, height:7, borderRadius:4, transition:'all .3s', background: i < currentQ ? '#f97316' : i === currentQ ? '#f97316' : 'var(--border2)', opacity: i < currentQ ? 0.5 : 1 }} />
          ))}
        </div>

        {/* Right: timer + buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:18, fontWeight:700, color: timeLeft < 30 ? '#ef4444' : '#f97316', lineHeight:1 }}>{fmt(timeLeft)}</div>
            <div style={{ color:'var(--t4)', fontSize:9, fontFamily:'JetBrains Mono', letterSpacing:1 }}>Q {currentQ+1}/{questions.length}</div>
          </div>
          <button onClick={finishInterview} disabled={completing}
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', fontFamily:'Rajdhani', fontWeight:700, fontSize:12, letterSpacing:1.5, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:'0 0 14px rgba(249,115,22,0.25)' }}>
            {completing ? <div className="spinner" style={{ width:12, height:12, borderWidth:2 }} /> : '🎯'}
            {completing ? 'Generating...' : 'End & Report'}
          </button>
          <button onClick={handleExit}
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'8px 12px', fontFamily:'Rajdhani', fontWeight:700, fontSize:12, letterSpacing:1.5, cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all .2s', whiteSpace:'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:'var(--card2)' }}>
        <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#f97316,#ea580c)' }} animate={{ width:`${progress}%` }} />
      </div>

      <div style={{ display:'flex', flex:1 }}>

        {/* Main content */}
        <div style={{ flex:1, padding:32, display:'flex', flexDirection:'column', gap:20 }}>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              style={{ background:'var(--card)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:16, padding:28 }}>
              <p style={{ color:'rgba(249,115,22,0.6)', fontSize:10, fontFamily:'JetBrains Mono', letterSpacing:3, marginBottom:10 }}>
                QUESTION {currentQ+1} OF {questions.length}
              </p>
              <p style={{ color:'var(--t)', fontSize:18, lineHeight:1.7 }}>{q}</p>
              {useVoice && (
                <button onClick={() => { const u = new SpeechSynthesisUtterance(q); u.rate=0.9; window.speechSynthesis.speak(u); }}
                  style={{ marginTop:10, color:'rgba(249,115,22,0.5)', background:'none', border:'none', cursor:'pointer', fontSize:11, fontFamily:'JetBrains Mono' }}>
                  🔊 Replay question
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                style={{ borderRadius:16, padding:24, background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.3)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ color:'#f97316', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:3 }}>AI FEEDBACK</span>
                  <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:26, color: scoreColor(feedback.score) }}>
                    {feedback.score}<span style={{ color:'var(--t4)', fontSize:13, fontFamily:'JetBrains Mono' }}>/100</span>
                  </span>
                </div>
                <p style={{ color:'var(--t2)', fontSize:14, lineHeight:1.7 }}>{feedback.feedback}</p>
                {!isLast && <p style={{ color:'rgba(249,115,22,0.4)', fontSize:11, fontFamily:'JetBrains Mono', marginTop:10 }}>⏳ Next question in 4 seconds...</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer area */}
          {!feedback && (
            <>
              <textarea
                ref={answerTextareaRef}
                defaultValue={answer}
                onChange={e => { setAnswer(e.target.value); answerRef.current = e.target.value; }}
                placeholder="Type your answer here, or click the mic to speak..."
                style={{ background:'var(--card)', border:'1px solid rgba(249,115,22,0.2)', color:'var(--t)', fontFamily:'Exo 2', fontSize:14, lineHeight:1.7, padding:20, borderRadius:12, resize:'none', outline:'none', minHeight:180 }}
                onFocus={e => e.target.style.borderColor='#f97316'}
                onBlur={e => e.target.style.borderColor='rgba(249,115,22,0.2)'}
              />
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                {useVoice && (
                  <motion.button whileTap={{ scale:0.9 }} onClick={isRecording ? stopVoice : startVoice}
                    style={{ width:52, height:52, borderRadius:'50%', border:'1px solid rgba(249,115,22,0.4)', background: isRecording ? '#ef4444' : 'rgba(249,115,22,0.15)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.5)' : 'none', flexShrink:0 }}>
                    {isRecording ? '⏹️' : '🎙️'}
                  </motion.button>
                )}
                {isRecording && <span style={{ color:'#ef4444', fontSize:11, fontFamily:'JetBrains Mono', display:'flex', alignItems:'center', gap:6 }}><span className="pulse-dot" style={{ background:'#ef4444' }}/>Recording...</span>}
                <div style={{ flex:1 }} />
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={submitAnswer}
                  disabled={submitting || !(answerRef.current || answer || '').trim()}
                  style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', border:'none', borderRadius:12, padding:'12px 32px', fontFamily:'Rajdhani', fontWeight:700, fontSize:14, letterSpacing:2, cursor: (!(answerRef.current || answer || '').trim()||submitting) ? 'not-allowed' : 'pointer', opacity: !(answerRef.current || answer || '').trim() ? 0.4 : 1, display:'flex', alignItems:'center', gap:8, boxShadow:'0 0 20px rgba(249,115,22,0.3)' }}>
                  {submitting && <div className="spinner" style={{ width:16, height:16, borderWidth:2 }} />}
                  {submitting ? 'Evaluating...' : isLast ? 'Submit Final Answer' : 'Submit & Next →'}
                </motion.button>
              </div>
            </>
          )}

          {feedback && isLast && (
            <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={finishInterview} disabled={completing}
              style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', border:'none', borderRadius:12, padding:'16px', fontFamily:'Rajdhani', fontWeight:700, fontSize:16, letterSpacing:2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 0 30px rgba(249,115,22,0.4)' }}>
              {completing ? <div className="spinner" style={{ width:20, height:20, borderWidth:2 }} /> : '🚀'}
              {completing ? 'Generating AI Report...' : 'View Full Results & Score Report'}
            </motion.button>
          )}
        </div>

        {/* Video sidebar */}
        {useVideo && (
          <div style={{ width:260, borderLeft:'1px solid rgba(249,115,22,0.1)', padding:20, display:'flex', flexDirection:'column', gap:14, background:'var(--card)', flexShrink:0 }}>

            {/* Webcam feed */}
            <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'var(--bg2)', border:'1px solid rgba(249,115,22,0.2)', aspectRatio:'4/3' }}>
              <video ref={videoRef} autoPlay muted playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display: camStatus === 'active' ? 'block' : 'none' }} />
              <CamOverlay />

              {/* Face detected indicator */}
              {camStatus === 'active' && (
                <div style={{ position:'absolute', bottom:6, left:6, right:6, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ background:'var(--bg2)', color: faceDetected ? 'var(--score-green)' : 'var(--score-red)', fontSize:9, fontFamily:'JetBrains Mono', padding:'2px 6px', borderRadius:4, letterSpacing:1, border:'1px solid var(--border2)' }}>
                    {faceDetected ? '● FACE DETECTED' : '● NO FACE'}
                  </span>
                  <span style={{ background:'var(--bg2)', color:'var(--t3)', fontSize:9, fontFamily:'JetBrains Mono', padding:'2px 6px', borderRadius:4, border:'1px solid var(--border2)' }}>
                    {facePresence}% present
                  </span>
                </div>
              )}
            </div>

            {/* Warning */}
            {warning && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'8px 10px' }}>
                <p style={{ color:'#ef4444', fontSize:11, fontFamily:'JetBrains Mono' }}>{warning}</p>
              </div>
            )}

            <p style={{ color:'rgba(249,115,22,0.5)', fontSize:9, fontFamily:'JetBrains Mono', letterSpacing:3 }}>VIDEO METRICS</p>

            {/* Metric bars */}
            {[
              { label:'Eye Contact',  score: eyeScore,    active: camStatus === 'active' && faceDetected },
              { label:'Posture',      score: postureScore, active: camStatus === 'active' && faceDetected },
              { label:'Face Presence',score: facePresence, active: camStatus === 'active' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ color:'var(--t3)', fontSize:11, fontFamily:'JetBrains Mono' }}>{m.label}</span>
                  <span style={{ fontSize:12, fontFamily:'JetBrains Mono', fontWeight:700, color: m.active ? scoreColor(m.score) : 'var(--t4)' }}>
                    {m.active ? `${m.score}%` : '--'}
                  </span>
                </div>
                <div style={{ height:4, background:'var(--card2)', borderRadius:2, overflow:'hidden' }}>
                  <motion.div
                    style={{ height:'100%', borderRadius:2, background: m.active ? `linear-gradient(90deg, ${scoreColor(m.score)}, ${scoreColor(m.score)}88)` : 'var(--border2)' }}
                    animate={{ width: m.active ? `${m.score}%` : '0%' }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            ))}

            {/* Status info */}
            <div style={{ marginTop:'auto', borderTop:'1px solid var(--border2)', paddingTop:12 }}>
              <p style={{ color:'var(--t3)', fontSize:9, fontFamily:'JetBrains Mono', letterSpacing:2, marginBottom:8 }}>
                {tfReady === true ? 'AI FACE DETECTION ACTIVE' : tfReady === 'fallback' ? 'BRIGHTNESS DETECTION' : 'LOADING DETECTOR...'}
              </p>
              {['Look directly at camera', 'Sit up straight', 'Keep face in frame', 'Adequate lighting'].map(t => (
                <p key={t} style={{ color:'var(--t3)', fontSize:11, marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'rgba(249,115,22,0.4)' }}>›</span> {t}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
