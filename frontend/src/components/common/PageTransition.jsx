import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
      transition={{ 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] // Custom smooth CSS ease-out
      }}
      className="w-full flex-grow flex flex-col relative z-10"
    >
      {children}
    </motion.div>
  );
}
