const axios = require('axios');

async function test() {
  try {
    const username = 'testuser_' + Date.now();
    const password = 'TestPassword123!';
    
    console.log('Registering...', username);
    await axios.post('https://confiaplus-api.onrender.com/api/auth/register/', {
      username,
      email: `${username}@test.com`,
      password,
      nome_completo: 'Test User',
      telefone: '11999999999',
      tipo_usuario: 'PROFISSIONAL'
    });
    
    console.log('Logging in...');
    const loginRes = await axios.post('https://confiaplus-api.onrender.com/api/auth/login/', {
      username,
      password
    });
    
    const token = loginRes.data.access;
    console.log('Token:', token ? 'Success' : 'Failed');
    
    console.log('Fetching dashboard...');
    const dashRes = await axios.get('https://confiaplus-api.onrender.com/api/dashboard/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Dashboard Data:', JSON.stringify(dashRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
