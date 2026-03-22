/**
 * VisionHire AI — Multi-provider AI utility
 * Priority: Groq → Gemini → Fallback
 */

const https = require('https');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null;
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9, max_tokens: 2000,
      response_format: { type: 'json_object' }
    });
    const opts = {
      hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { 
        if (res.statusCode !== 200) console.error("Groq API Error:", res.statusCode, data);
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content || null); } catch { resolve(null); } 
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.write(body); req.end();
  });
}

async function callGeminiModel(apiKey, model, body) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve({ ok: true, text: JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text || '' }); }
          catch { resolve({ ok: false, status: 500 }); }
        } else resolve({ ok: false, status: res.statusCode });
      });
    });
    req.on('error', () => resolve({ ok: false, status: 500 }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ ok: false, status: 408 }); });
    req.write(body); req.end();
  });
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 2000, responseMimeType: "application/json" }
  });
  for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']) {
    const r = await callGeminiModel(apiKey, model, body);
    if (r.ok) return r.text;
    if (r.status !== 429 && r.status !== 404) break;
  }
  return null;
}

async function callAI(prompt) {
  const g = await callGroq(prompt);
  if (g) return g;
  const m = await callGemini(prompt);
  if (m) return m;
  return null;
}

function safeJSON(text, fallback) {
  if (!text) return fallback;
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/([\[{][\s\S]*[\]}])/);
    return JSON.parse((m ? m[1] || m[0] : text).trim());
  } catch { return fallback; }
}

// ─── QUESTION TYPE POOLS (for variety) ─────────────────────────────────────
const QUESTION_TYPES = {
  technical: [
    'conceptual', 'problem_solving', 'code_review', 'system_design',
    'debugging', 'best_practices', 'comparison', 'real_world_scenario', 'coding_problem'
  ],
  hr: [
    'self_intro', 'behavioral_star', 'situational', 'motivation',
    'strengths_weaknesses', 'teamwork', 'conflict_resolution', 'career_goals'
  ],
  mixed: [
    'self_intro', 'technical_concept', 'behavioral_star', 'problem_solving',
    'situational', 'system_design', 'career_goals', 'real_world_scenario', 'coding_problem'
  ]
};

// ─── RESUME ANALYSIS ────────────────────────────────────────────────────────
async function analyzeResume(resumeText) {
  const prompt = `Analyze this resume carefully. Return ONLY valid JSON, no markdown:
{
  "name": "candidate name",
  "skills": ["skill1"],
  "technologies": ["tech1"],
  "projects": ["ProjectName: description with tech used"],
  "experience": ["Role at Company: what they did"],
  "education": ["Degree, Institution, Year"],
  "certifications": ["cert1"],
  "summary": "2 sentence summary",
  "keyStrengths": ["strength1"],
  "yearsOfExperience": "fresher/1-2 years/3-5 years/5+ years"
}
Resume:
${resumeText.substring(0, 4000)}`;
  const text = await callAI(prompt);
  return safeJSON(text, { skills:[], projects:[], technologies:[], experience:[], education:[], certifications:[], summary:'', keyStrengths:[], yearsOfExperience:'fresher' });
}

// ─── QUESTION GENERATION (with forced variety) ──────────────────────────────
async function generateInterviewQuestions(options) {
  const { type = 'technical', topic, difficulty = 'medium', persona = 'friendly', language = 'en-US', resumeData, count = 10, sessionSeed } = options;
  const seed = sessionSeed || Math.random().toString(36).slice(2);
  const timestamp = Date.now();

  // Pick random question types to force variety
  const qTypes = QUESTION_TYPES[type] || QUESTION_TYPES.technical;
  const shuffledTypes = [...qTypes].sort(() => Math.random() - 0.5);
  const selectedTypes = shuffledTypes.slice(0, Math.min(count, shuffledTypes.length));

  let resumeCtx = '';
  const hasResume = resumeData?.skills?.length > 0 || resumeData?.technologies?.length > 0;
  if (hasResume) {
    resumeCtx = `
CANDIDATE PROFILE:
- Name: ${resumeData.name || 'Candidate'}
- Level: ${resumeData.yearsOfExperience || 'fresher'}
- Skills: ${resumeData.skills?.join(', ')}
- Technologies: ${resumeData.technologies?.join(', ')}
- Projects: ${resumeData.projects?.slice(0,3).join(' | ')}
- Experience: ${resumeData.experience?.slice(0,2).join(' | ')}
- Education: ${resumeData.education?.slice(0,1).join('')}`;
  }

  const typeInstructions = {
    conceptual:           'Ask a conceptual "explain X" or "what is X and why does it matter" question',
    problem_solving:      'Ask a practical problem-solving scenario like "how would you approach..."',
    code_review:          'Ask about code quality, best practices, or "what is wrong with this approach"',
    system_design:        'Ask a system design or architecture question',
    debugging:            'Ask a debugging scenario or "what could cause this issue"',
    best_practices:       'Ask about best practices, patterns, or "what is the right way to..."',
    comparison:           'Ask to compare two technologies/approaches and when to use each',
    real_world_scenario:  'Ask a real-world scenario based on their actual project experience',
    self_intro:           'Ask them to introduce themselves — their background, projects, and goals',
    behavioral_star:      'Ask a behavioral question using STAR format — "tell me about a time when..."',
    situational:          'Ask a situational "what would you do if..." question',
    motivation:           'Ask about motivation, passion, why they chose this field',
    strengths_weaknesses: 'Ask about their specific technical or professional strengths and one weakness',
    teamwork:             'Ask about collaboration, team dynamics, and working with others',
    conflict_resolution:  'Ask about handling disagreements, feedback, or difficult situations',
    career_goals:         'Ask about their 3-5 year plan and how this role fits',
    technical_concept:    'Ask a fundamental technical concept relevant to their skills',
    coding_problem:       'Ask a specific coding problem (e.g. "Write a function to...") that they must solve now in the live editor.',
  };

  const typeGuide = topic 
      ? `Generate exactly ${count} unique questions strictly and exclusively regarding the tech skill/topic: **${topic}**. Do not ask about anything else.`
      : selectedTypes.map((t, i) => `Q${i+1}: ${typeInstructions[t] || 'Ask a relevant interview question'}`).join('\n');

  const topics = ['Arrays', 'Hash Maps', 'Pointers', 'React/Frontend', 'System Design', 'APIs', 'Databases', 'Authentication', 'Microservices', 'Dynamic Programming', 'Scalability', 'Sorting', 'Trees/Graphs'];
  const randTopics = topics.sort(() => Math.random() - 0.5).slice(0, 3);

  let personaInstruction = `You are a real HR interviewer. You MUST translate and write ALL questions strictly in the language of this locale: ${language}.`;
  if (persona === 'strict') {
    personaInstruction = `You are a strict, no-nonsense Senior Tech Lead interviewer. You MUST translate and write ALL questions strictly in the language of this locale: ${language}.`;
  } else if (persona === 'roast') {
    personaInstruction = `You are a brutally honest, savage interviewer similar to Gordon Ramsay. You MUST translate and write ALL questions strictly in the language of this locale: ${language}.`;
  }

  const prompt = `${personaInstruction} conducting a ${type} interview at ${difficulty} difficulty.
Session: ${seed}-${timestamp} (generate UNIQUE questions, different every session)
${resumeCtx || 'No resume — ask general questions for a student/fresher.'}

Generate exactly ${count} questions following this VARIETY GUIDE:
${typeGuide}

RULES:
- Q1 MUST be a self-introduction question
- CRITICAL: You MUST include at least one specific CODING PROBLEM (e.g. "Write a function to...") because the user has a live code editor available!
- Ensure you ask completely UNIQUE questions every time. ${topic ? '' : `Include questions related to these random topics to force variety: ${randTopics.join(', ')}.`}
- CRITICAL LANGUAGE RULE: ALL OUTPUT TEXT IN THE JSON arrays (every single question) MUST BE TRANSLATED TO THIS EXACT LANGUAGE LOCALE: "${language}". DO NOT OUTPUT ENGLISH UNLESS THE LOCALE IS ENGLISH. (e.g. 'fr-FR' = pure French, 'en-IN' = Hinglish).
- Reference the candidate's ACTUAL skills, projects, and technologies when possible
- Make each question DIFFERENT in format and topic
- ${difficulty === 'easy' ? 'Keep questions foundational and approachable' : difficulty === 'medium' ? 'Include practical and applied scenarios' : 'Include advanced concepts, trade-offs, and system thinking'}
- Sound like a real interviewer, conversational tone

Return ONLY valid JSON in this exact format, no markdown:
{
  "questions": [
    "question 1 string",
    "question 2 string"
  ]
}`;

  const text = await callAI(prompt);
  if (!text) console.error("AI returned null/empty response for questions");
  
  const parsed = safeJSON(text, null);
  let qArray = [];
  if (Array.isArray(parsed)) qArray = parsed;
  else if (parsed && Array.isArray(parsed.questions)) qArray = parsed.questions;

  if (qArray.length >= 1) {
    // Llama 3 frequently hallucinates [{question: "..."}] instead of strings. Force strings.
    const stringArray = qArray.map(q => {
      if (typeof q === 'string') return q;
      if (q && q.question) return q.question;
      if (q && q.text) return q.text;
      return String(q);
    });
    
    const first = stringArray[0];
    const rest = stringArray.slice(1).sort(() => Math.random() - 0.5);
    return [first, ...rest].slice(0, count);
  }
  
  console.log("Failed to parse AI questions, using fallback. Raw AI Text:", text);
  return buildFallbackQuestions(type, topic, difficulty, resumeData, count);
}

function buildFallbackQuestions(type, topic, difficulty, resumeData, count) {
  const skills = resumeData?.skills || [];
  const techs  = resumeData?.technologies || [];
  const projects = resumeData?.projects || [];
  const hasResume = skills.length > 0;

  const intro = hasResume
    ? `Tell me about yourself — walk me through your background, the projects you've built, and what excites you most about ${techs[0] || 'technology'}.`
    : 'Tell me about yourself — your background, what led you to this field, and what you are most proud of so far.';

  const qBank = {
    technical: [
      intro,
      techs[0] ? `You mentioned ${techs[0]} — can you explain how you have used it and what challenges you faced?` : 'What is your strongest programming language and why?',
      projects[0] ? `Walk me through your ${projects[0].split(':')[0]} project — architecture, your role, and key decisions you made.` : 'Describe the most complex technical problem you have solved.',
      `How do you ensure code quality and maintainability in your projects?`,
      skills[1] ? `How does ${skills[0]} differ from ${skills[1]}? When would you choose one over the other?` : 'Explain the difference between relational and non-relational databases.',
      `What happens when you type a URL into a browser? Walk me through each step.`,
      `How would you design a simple URL shortener like bit.ly?`,
      `Write a function to reverse a string or array without using built-in reverse methods.`,
      `Tell me about a bug you spent a long time debugging. What was the issue and how did you find it?`,
      `What is the difference between authentication and authorization? Give a real example.`,
      `How do you stay updated with new technologies and best practices?`,
    ],
    hr: [
      intro,
      `Describe a time you faced a major challenge in a project. What did you do and what was the outcome?`,
      `Tell me about a time you disagreed with a teammate. How did you handle it?`,
      `What is your greatest technical strength, and give me a concrete example of it in action?`,
      `Where do you see yourself in 3 years, and how does this role fit into that vision?`,
      `How do you prioritize tasks when you have multiple deadlines at once?`,
      `Describe a situation where you had to learn something completely new under time pressure.`,
      `Tell me about a project you are most proud of and why it stands out to you.`,
      `What motivates you to keep improving your skills outside of work or college?`,
      `Describe your ideal work environment and team culture.`,
    ],
  };

  const pool = qBank[type] || [...qBank.technical.slice(0,6), ...qBank.hr.slice(1,5)];
  
  if (topic) {
    return [
      intro,
      `What are the core fundamentals of ${topic}?`,
      `Explain a common challenge when working with ${topic} and how to solve it.`,
      `What are the best practices for using ${topic}?`,
      `How does ${topic} compare to its alternatives?`,
      `Describe a time you built or learned something related to ${topic}.`,
      `How do you debug issues in ${topic}?`,
      `What is the most advanced concept you know about ${topic}?`,
      `Write a basic code setup or design related to ${topic}.`,
      `Where do you see the future of ${topic} heading?`
    ].slice(0, count);
  }

  const rest = pool.slice(1).sort(() => Math.random() - 0.5);
  return [pool[0], ...rest].slice(0, count);
}

// ─── EVALUATE ANSWER WITH VOICE RESPONSE ────────────────────────────────────
async function evaluateAnswer(question, answer, resumeContext = '', persona = 'friendly', language = 'en-US') {
  if (!answer || answer.trim().length < 3) {
    return {
      score: 0,
      feedback: 'No answer provided.',
      voiceResponse: 'I did not catch your answer. Please try again.',
      strengths: [],
      improvements: ['Please provide a detailed answer'],
      correctAnswer: '',
      followUpQuestion: null
    };
  }

  // Random openers so voice never sounds the same
  const goodOpeners = [
    "That's a really solid answer!", "Excellent! You nailed the key concepts there.",
    "Very good, I like how you explained that.", "Nice work! That shows strong understanding.",
    "Absolutely right, well done.", "Great response! You clearly know this well.",
    "Spot on! That's exactly what we look for.", "Impressive answer, very well articulated."
  ];
  const partialOpeners = [
    "Good start, you're on the right track.", "Not bad, you touched on some key points.",
    "I appreciate the effort, you got part of it.", "You're heading in the right direction.",
    "That's a fair answer, though it could be stronger.", "You've got the basic idea, let's build on that."
  ];
  const wrongOpeners = [
    "Hmm, not quite what I was looking for.", "That's not entirely accurate, let me clarify.",
    "I think there's a bit of confusion here.", "Let's revisit this one.",
    "Not quite, but that's okay — this is how we learn.", "That missed the mark a bit, no worries."
  ];
  const seed = Math.floor(Math.random() * 100);

  let personaInstruction = 'You are a real HR interviewer — warm, professional, conversational. You just heard this candidate\'s answer.';
  let personaRules = '- Sound encouraging but honest — like a mentor, not a robot\n- If good: praise the specific correct point, then suggest ONE improvement\n- If partial: acknowledge the correct part, then name the ONE missing concept\n- If wrong: gently correct them, give a hint toward the right answer';
  
  if (persona === 'strict') {
    personaInstruction = 'You are a strict, direct Senior Tech Lead. Keep your feedback highly professional but slightly cold and extremely focused on accuracy.';
    personaRules = '- Do not sugarcoat anything. State exactly what was factually incorrect.\n- If good: acknowledge it briefly, move on.\n- If partial/wrong: brutally dissect the flaw in their logic.';
  } else if (persona === 'roast') {
    personaInstruction = 'You are a brutally savage, hilarious interviewer like Gordon Ramsay assessing a junior dev. Roast them appropriately if they make mistakes. Be sarcastic but constructive in the end.';
    personaRules = '- If they are terribly wrong, roast them creatively (e.g. "My grandmother could code better than that", "Did you just Google that and read the first line?").\n- Mock them playfully if they stutter or use filler words.\n- Still provide ONE actual technical improvement in your savage critique.';
  }

  const prompt = `${personaInstruction}
Session randomizer: ${seed} — make your response UNIQUE and DIFFERENT each time, never repeat the same phrasing.

Question: ${question}
Candidate's Answer: ${answer}
${resumeContext ? `Candidate background: ${resumeContext}` : ''}

CRITICAL RULES FOR CODE EVALUATION (If "CODE SUBMISSION" is in the answer):
1. STRICT LINTER: You are a strict runtime compiler. Focus ONLY on syntax before logic.
2. LANGUAGE MATCH: You MUST check the bracketed header (e.g. [javascript CODE SUBMISSION]). If the written code is Python but the header says javascript, this is a FATAL ERROR. Score must be 0.
3. SYNTAX ERRORS: If a variable is undeclared or logic would crash the compiler in the stated language, YOU MUST FAIL THEM (Score: 0-20).
4. CHAIN OF THOUGHT: Write your syntax analysis in the "compilerCheck" JSON field first.
5. YOU MUST RETURN THE FULL JSON SCHEMA EVEN IF THEY FAIL.

GENERAL SCORING RULES (Applies only if code compiles, or for spoken answers):
- Correct and complete → 80-100
- Mostly correct, minor gaps → 60-79
- Partially correct → 40-59
- Mostly wrong → 20-39
- Completely wrong or does not compile → 0-19

VOICE RESPONSE RULES:
- Read the candidate's answer and provide a very short, conversational reaction to it as if you are speaking to them (max 2 sentences).
- Start by acknowledging what they said. Say if it was good, bad, or missing something.
- ${personaRules}
- DO NOT just say "Great answer". Be specific but very brief.
- The voiceResponse string MUST be translated strictly into this locale code language: "${language}". If "${language}" is 'en-IN' or 'hi-IN', use conversational Hindi mixed with English tech words (Hinglish).

Return ONLY valid JSON in this exact format:
{
  "compilerCheck": "1-sentence explicit verification of whether the code uses the correct syntax for the language declared in the header. (e.g. 'Code is Python, but header is Javascript. FAILED.')",
  "score": 78,
  "voiceResponse": "Your unique varied natural spoken response here",
  "feedback": "Written detailed feedback for results page (3-4 sentences)",
  "strengths": ["specific correct point from their answer"],
  "improvements": ["one specific thing to improve"],
  "correctAnswer": "Complete model answer.",
  "followUpQuestion": "A natural follow-up or null"
}`;

  const text = await callAI(prompt);
  const result = safeJSON(text, null);
  
  if (result?.score !== undefined) {
    return {
      score: result.score,
      voiceResponse: result.voiceResponse || result.feedback || "Your code did not pass the compiler checks. Please review your syntax.",
      feedback: result.feedback || "Compilation or syntax error.",
      strengths: result.strengths || [],
      improvements: result.improvements || ["Use the correct language syntax", "Declare all variables"],
      correctAnswer: result.correctAnswer || "",
      followUpQuestion: result.followUpQuestion || null
    };
  }

  const words = answer.trim().split(/\s+/).length;
  const score = Math.min(72, Math.max(20, Math.round(words * 1.5)));
  const isGood = score >= 60;

  // Varied fallback voice responses so it never sounds the same
  const goodFallbacks = [
    `Good answer! You covered the key points well. ${words < 30 ? "Next time, try adding a specific example from your experience to really drive it home." : "That kind of clarity will serve you well in a real interview."}`,
    `Nice work! You demonstrated solid understanding there. Keep building on that foundation — concrete examples from your projects will make your answers even stronger.`,
    `That was a solid response. I can see you have a genuine grasp of this concept. To take it to the next level, tie your answer to a specific project or situation you have dealt with.`,
    `Great answer! You explained that clearly and confidently. To really impress an interviewer, try walking them through a real scenario where you applied this knowledge.`,
    `Very well said! You hit the key points I was looking for. One small tip — mentioning the trade-offs or limitations would add even more depth to an already strong answer.`,
    `Spot on! That shows real understanding. I especially liked how you structured your response. Keep that clarity in every answer and you will do great.`,
    `Excellent response! You clearly know your stuff. The only thing I would add is a brief real-world example — that always makes answers more memorable for interviewers.`,
    `Well done! That answer was concise and accurate. In a live interview, following that up with a personal anecdote from your experience would make you stand out immediately.`,
  ];
  const weakFallbacks = [
    `Hmm, that answer needs a bit more depth. Think about the core concept and how you would explain it to someone new, then add a real example. Let us keep going!`,
    `Not quite there yet, but that is completely fine — this is exactly why we practice! Try to think about the fundamentals first, then connect them to real applications.`,
    `That missed the mark a little. The key to a strong answer here is to define the concept clearly, explain why it matters, then give a concrete example. You will get there with practice!`,
    `I appreciate the effort, but the answer needs more specifics. A great framework to use: what is it, how does it work, and when would you actually use it? Try that structure.`,
    `Not exactly what I was hoping for, but good that you attempted it. Review this topic and try to explain it in simple terms first — build from there. On to the next!`,
    `That one needs some work. No worries though — recognising the gap is the first step. Study this topic, practice your answer out loud, and it will click. Let us continue!`,
    `Hmm, let us revisit that concept later. The important thing is you tried. For now, think about how you would explain this to a friend who has never heard of it. On to the next question!`,
    `That was not quite the answer I was looking for. The core idea you want to convey here is different — make a note to review this topic after our session. Moving on!`,
  ];

  const idx = Math.floor(Math.random() * 8);
  return {
    score,
    voiceResponse: isGood ? goodFallbacks[idx] : weakFallbacks[idx],
    feedback: isGood ? 'Decent answer. Add more specific examples to score higher.' : 'Answer needs more depth and accuracy.',
    strengths: ['Attempted the question'],
    improvements: ['Add specific examples', 'Structure your answer clearly'],
    correctAnswer: 'A strong answer to this question would clearly define the concept, explain why it matters, and give a real-world example from your experience.',
    followUpQuestion: null
  };
}

// ─── GENERATE FULL REPORT WITH ANSWER GUIDE ─────────────────────────────────
async function generateInterviewReport(interviewData) {
  const { questions, type, difficulty, resumeSkills = [] } = interviewData;
  const answered = questions.filter(q => q.answer?.trim() && q.answer.trim().length > 2);
  
  if (answered.length === 0) {
    return {
      scores: { technicalKnowledge: 0, communication: 0, confidence: 0, problemSolving: 0, clarity: 0 },
      overall: 0,
      summary: "You did not provide any valid answers during the interview. Please ensure you answer the questions next time.",
      strengths: [],
      weaknesses: ["No answers provided", "Empty Interview"],
      skillGaps: [{
        topic: "Interview Participation",
        severity: "high",
        description: "No answers were recorded.",
        suggestions: ["Speak into the microphone clearly", "Ensure your environment is quiet", "Check if microphone permissions are granted"]
      }],
      recommendations: ["Test your microphone before starting", "Pace yourself and answer each question"],
      answerGuide: questions.map((q) => ({
        question: q.question,
        candidateAnswer: 'Skipped / No answer',
        score: 0,
        whatWentWell: 'N/A',
        whatWasMissing: 'Candidate did not answer this question completely.',
        idealAnswer: q.correctAnswer || 'A strong answer would clearly address the core technical concepts involved.',
        practicePrompt: `Practice answering: "${q.question}"`
      }))
    };
  }

  const avgScore = Math.round(answered.reduce((s, q) => s + (q.score || 0), 0) / questions.length);

  const qaText = answered.slice(0, 8).map((q, i) =>
    `Q${i+1}: ${q.question}\nCandidate: ${q.answer.substring(0, 200)}\nScore: ${q.score}/100`
  ).join('\n\n');

  const prompt = `You are a career counselor writing a detailed post-interview report with an ANSWER GUIDE so the candidate can improve.

Interview: ${type} (${difficulty}) | Skills: ${resumeSkills.slice(0,5).join(', ') || 'general'}
Candidate answered ${answered.length} out of ${questions.length} questions.
Because they skipped questions, their TRUE MATHEMATICAL AVERAGE is: ${avgScore}/100.
Ensure the overall score strongly reflects this penalty.

${qaText}

Return ONLY valid JSON:
{
  "scores": {
    "technicalKnowledge": 75,
    "communication": 70,
    "confidence": 65,
    "problemSolving": 70,
    "clarity": 75
  },
  "overall": 71,
  "summary": "3-sentence honest assessment of their performance",
  "strengths": ["specific evidence-based strength"],
  "weaknesses": ["specific weakness with example from their answers"],
  "skillGaps": [
    {
      "topic": "Topic",
      "severity": "high",
      "description": "Why this is a gap based on their answers",
      "suggestions": ["specific learning resource or action"]
    }
  ],
  "recommendations": ["specific actionable advice"],
  "answerGuide": [
    {
      "question": "exact question text",
      "candidateAnswer": "what they said",
      "score": 65,
      "whatWentWell": "what was correct in their answer",
      "whatWasMissing": "key points they missed",
      "idealAnswer": "The complete model answer they should memorise and practice — 4-6 detailed sentences covering all key points an interviewer expects.",
      "practicePrompt": "A slightly rephrased version of this question they should practice at home"
    }
  ]
}`;

  const text = await callAI(prompt);
  const result = safeJSON(text, null);

  if (result?.scores !== undefined) {
    // Strictly enforce math to override AI hallucinations when skipping questions
    result.overall = avgScore;
    if (answered.length < questions.length) {
      for (const k of Object.keys(result.scores)) {
        if (typeof result.scores[k] === 'number') {
          result.scores[k] = Math.min(result.scores[k], avgScore + 15);
        }
      }
    }

    // If AI didn't generate answerGuide, build it from existing question data
    if (!result.answerGuide?.length) {
      result.answerGuide = questions.map(q => ({
        question: q.question,
        candidateAnswer: q.answer || 'No answer provided',
        score: q.score || 0,
        whatWentWell: q.score >= 60 ? 'You addressed the main concept' : 'You attempted the question',
        whatWasMissing: q.aiFeedback || 'More depth and specific examples needed',
        idealAnswer: q.correctAnswer || 'Review this topic and practice explaining it with a real example from your experience.',
        practicePrompt: `Can you explain ${q.question.toLowerCase().replace(/^(tell me|what is|how do you|describe)/i, '').trim()}?`
      }));
    }
    return result;
  }

  // Full fallback
  const j = () => Math.round((Math.random() - 0.5) * 10);
  const scores = {
    technicalKnowledge: Math.min(100, Math.max(0, avgScore + j())),
    communication:      Math.min(100, Math.max(0, avgScore + j())),
    confidence:         Math.min(100, Math.max(0, avgScore + j())),
    problemSolving:     Math.min(100, Math.max(0, avgScore + j())),
    clarity:            Math.min(100, Math.max(0, avgScore + j())),
  };
  return {
    scores, overall: avgScore,
    summary: `You completed a ${difficulty} ${type} interview with an average of ${avgScore}/100. ${avgScore >= 70 ? 'Strong performance overall!' : 'Keep practicing to improve.'}`,
    strengths: ['Completed the full interview', 'Showed consistent effort'],
    weaknesses: avgScore < 65 ? ['Answers need more depth and real examples'] : [],
    skillGaps: [],
    recommendations: ['Practice 2-3 mock interviews weekly', 'Review your weak topics', 'Use the Answer Guide below to study model answers'],
    answerGuide: questions.map(q => ({
      question: q.question,
      candidateAnswer: q.answer || 'No answer provided',
      score: q.score || 0,
      whatWentWell: q.score >= 60 ? 'Good attempt on this question' : 'You tried to address the question',
      whatWasMissing: 'More specific examples and technical depth needed',
      idealAnswer: q.correctAnswer || 'Study this topic thoroughly and practice explaining it clearly with examples.',
      practicePrompt: `Practice answering: "${q.question}"`
    }))
  };
}

// ─── HR "NUDGE" PROMPT (when candidate is stuck) ────────────────────────────
async function generateHrNudge(options) {
  const { question, partialAnswer = '', type = 'hr', difficulty = 'medium', resumeContext = '', language = 'en-US' } = options || {};
  const seed = Math.floor(Math.random() * 1000);
  const prompt = `You are a friendly, professional human HR interviewer.
The candidate seems stuck (silence). Your job is to help them continue WITHOUT giving them the answer.

Randomizer: ${seed} (do not repeat phrasing)
Interview type: ${type}
Difficulty: ${difficulty}

Question: ${question}
Candidate partial answer so far: ${partialAnswer || '(nothing yet)'}
${resumeContext ? `Candidate context: ${resumeContext}` : ''}

Rules:
- Ask ONE short follow-up prompt (1-2 sentences max)
- Be encouraging: "Take your time..." tone
- DO NOT reveal the solution or key points directly
- If they said nothing: ask them to start with a structure (example/STAR, definition + example, etc.)
- End with a question mark
- YOU MUST SPEAK STRICTLY IN THIS LOCALE LANGUAGE: "${language}" (e.g. 'en-IN' = Hinglish).

Return ONLY valid JSON:
{ "nudge": "..." }`;

  const text = await callAI(prompt);
  const result = safeJSON(text, null);
  if (result?.nudge) return { nudge: String(result.nudge).trim() };

  const fallbacks = [
    'Take your time—can you start with a quick definition, then give a simple example from your project?',
    'No worries—can you walk me through your thinking step by step, even if you are not fully sure yet?',
    'That is okay—can you share a real situation where you faced this, and what you did?',
    'Could you break this down into 2–3 points and explain each one briefly?',
    'Let us start simple—what is the first thing you would do in this situation, and why?',
  ];
  return { nudge: fallbacks[seed % fallbacks.length] };
}

module.exports = { analyzeResume, generateInterviewQuestions, evaluateAnswer, generateInterviewReport, generateHrNudge };
