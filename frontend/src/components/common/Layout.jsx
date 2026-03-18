import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background 0.3s', backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
