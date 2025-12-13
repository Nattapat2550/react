const axios = require('axios');

const apiClient = axios.create({
  baseURL: process.env.PURE_API_BASE_URL,
  headers: {
    'x-api-key': process.env.PURE_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interceptor สำหรับจัดการ error เบื้องต้น
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Pure API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

module.exports = apiClient;