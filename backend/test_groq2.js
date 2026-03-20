const https = require('https');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;

const prompt = `You are a real HR interviewer. You MUST translate and write ALL questions strictly in the language of this locale: hi-IN. conducting a technical interview at medium difficulty.
Session: abc-123 (generate UNIQUE questions, different every session)
No resume — ask general questions for a student/fresher.

Generate exactly 3 questions following this VARIETY GUIDE:
Q1: Ask a conceptual "explain X" or "what is X and why does it matter" question
Q2: Ask a practical problem-solving scenario like "how would you approach..."
Q3: Ask a specific coding problem (e.g. "Write a function to...") that they must solve now in the live editor.

RULES:
- Q1 MUST be a self-introduction question
- CRITICAL: You MUST include at least one specific CODING PROBLEM (e.g. "Write a function to...") because the user has a live code editor available!
- Ensure you ask completely UNIQUE questions every time. Include questions related to these random topics to force variety: Arrays, APIs, React.
- CRITICAL LANGUAGE RULE: ALL OUTPUT TEXT IN THE JSON arrays (every single question) MUST BE TRANSLATED TO THIS EXACT LANGUAGE LOCALE: "hi-IN". DO NOT OUTPUT ENGLISH UNLESS THE LOCALE IS ENGLISH. (e.g. 'fr-FR' = pure French, 'en-IN' = Hinglish).
- Reference the candidate's ACTUAL skills, projects, and technologies when possible
- Make each question DIFFERENT in format and topic
- Include practical and applied scenarios
- Sound like a real interviewer, conversational tone

Return ONLY valid JSON in this exact format, no markdown:
{
  "questions": [
    "question 1 string",
    "question 2 string"
  ]
}`;

const body = JSON.stringify({
  model: 'llama-3.1-8b-instant',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.9, max_tokens: 2000
});

const req = https.request({
  hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(body) }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => { 
    console.log("STATUS:", res.statusCode);
    const content = JSON.parse(data).choices?.[0]?.message?.content;
    console.log("RAW CONTENT:\\n", content);
  });
});
req.write(body); req.end();
