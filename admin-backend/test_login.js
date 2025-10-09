const axios = require('axios');

axios.post('http://localhost:5000/api/auth/login', {
  email: "superadmin@example.com",
  password: "password123"
})
.then(response => {
  console.log('Status Code:', response.status);
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.log('Error:', error.message);
  if (error.response) {
    console.log('Status Code:', error.response.status);
    console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
  }
});