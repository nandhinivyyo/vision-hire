const axios = require('axios');

async function testSignup() {
  const start = Date.now();
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      collegeName: 'Test College',
      department: 'CSE',
      phone: '1234567890'
    });
    console.log('Signup success:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Signup failed:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
  console.log(`Time taken: ${Date.now() - start}ms`);
}

testSignup();
