import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth(); // Only show sidebar if logged in

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white font-sans selection:bg-[#FF6A00]/30 transition-colors duration-300">
      {user && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
      <div className={`transition-all duration-300 ${user ? 'lg:pl-64' : ''}`}>
        {user && <Navbar onMenuClick={() => setIsSidebarOpen(true)} />}
        {/* We keep pt-10 / 20 logic up to the pages themselves, just render main */}
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
