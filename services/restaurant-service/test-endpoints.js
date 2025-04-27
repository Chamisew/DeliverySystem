const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZlMjkwNTY2YThlMDJhNmRkMGNiMTgiLCJyb2xlIjoicmVzdGF1cmFudCIsImlhdCI6MTc0NDcxMzk5MywiZXhwIjoxNzQ0ODAwMzkzfQ.PGqFYUdkxWLoemXt6bY4iylz9F9e7RZh7yC8wezQ7tY';
const baseURL = 'http://localhost:3002/api';

async function testEndpoints() {
  try {
    console.log('Testing /me endpoint...');
    const meResponse = await axios.get(`${baseURL}/restaurants/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Me endpoint response:', meResponse.data);
    
    console.log('\nTesting /stats endpoint...');
    const statsResponse = await axios.get(`${baseURL}/restaurants/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Stats endpoint response:', statsResponse.data);
  } catch (error) {
    console.error('Error testing endpoints:', error.response ? error.response.data : error.message);
  }
}

testEndpoints(); 