import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Suppress generic cross-origin "Script error." that crashes the dev overlay (often from browser extensions)
window.onerror = function(msg) {
  if (msg === 'Script error.') return true;
};

// Force-hide the Webpack overlay for this specific phantom error
if (process.env.NODE_ENV === 'development') {
  const observer = new MutationObserver(() => {
    const errorIframe = document.querySelector('iframe');
    if (errorIframe && errorIframe.style.zIndex === '2147483647') {
      try {
        if (errorIframe.contentDocument?.body?.innerText.includes('Script error.')) {
          errorIframe.style.display = 'none';
        }
      } catch (e) {
        // Cross-origin iframe block, safely ignore
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('visionhire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
