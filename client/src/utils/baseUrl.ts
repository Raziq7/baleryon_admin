// api.js (or axios.js)
import axios from 'axios';

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export default api;
