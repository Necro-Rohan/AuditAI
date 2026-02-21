import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', 
  withCredentials: true, // for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Global interceptor for 401 Unauthorized (Expired Cookie)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we aren't already on the login page, force a reload/redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;