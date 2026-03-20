const https = require('https');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;
console.log("Key:", apiKey ? apiKey.substring(0, 5) + "..." : "NULL");

const body = JSON.stringify({
  model: 'llama-3.1-8b-instant',
  messages: [{ role: 'user', content: 'Return ONLY valid JSON: {"questions": ["test"]}' }],
  temperature: 0.9, max_tokens: 100
});

const req = https.request({
  hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(body) }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => { 
    console.log("STATUS:", res.statusCode);
    console.log("DATA:", data);
  });
});
req.write(body); req.end();
