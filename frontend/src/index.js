import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Suppress generic cross-origin "Script error." that crashes the dev overlay (often from extensions/CDN)
window.addEventListener('error', e => {
  if (e.message === 'Script error.') {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('visionhire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
