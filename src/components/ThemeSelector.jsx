import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themes = [
    { id: 'light', name: 'Blanco 1', color: '#F2F2F7', icon: '☀️' },
    { id: 'light-warm', name: 'Blanco 2', color: '#F6F3EC', icon: '🌾' },
    { id: 'dark', name: 'Negro', color: '#000000', icon: '🌙' },
    { id: 'guinda', name: 'Guinda Noche', color: '#2d060d', icon: '🍷' },
    { id: 'guinda-light', name: 'Guinda Rosado', color: '#FDF2F4', icon: '🌸' },
    { id: 'coraje', name: 'Coraje Beige', color: '#F4EBE1', icon: '🐕' },
    { id: 'coraje-dark', name: 'Coraje Noche', color: '#120919', icon: '✨' },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="ios-glass"
            style={{
              position: 'absolute',
              bottom: '50px',
              left: '0',
              padding: '8px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '130px'
            }}
          >
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: theme === t.id ? 'var(--accent-color)' : 'transparent',
                  color: theme === t.id ? '#ffffff' : 'inherit',
                  fontWeight: theme === t.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                <span>{t.icon}</span>
                {t.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        className="ios-glass"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          border: '1px solid var(--card-border)',
          background: 'var(--card-bg)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px',
          padding: 0
        }}
      >
        {currentTheme.icon}
      </motion.button>
    </div>
  );
}
