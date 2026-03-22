import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function SpotlightBackground() {
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Use requestAnimationFrame for buttery smooth 60fps tracking without React lag
      requestAnimationFrame(() => {
        setMousePosition({
          x: e.clientX,
          y: e.clientY,
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isDark) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 will-change-transform"
      animate={{
        background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,106,0,0.06), transparent 80%)`,
      }}
      transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
    />
  );
}
