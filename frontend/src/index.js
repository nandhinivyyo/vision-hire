import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress generic cross-origin "Script error." that crashes the dev overlay (often from extensions/CDN)
window.addEventListener('error', e => {
  if (e.message === 'Script error.') {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
