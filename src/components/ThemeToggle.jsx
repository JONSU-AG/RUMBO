import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Palette } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={() => toggleTheme('light')}
        title="Modo Apple Claro"
        style={{
          padding: '8px 12px',
          borderRadius: '16px',
          border: 'none',
          background: theme === 'light' ? '#4285F4' : 'rgba(0,0,0,0.06)',
          color: theme === 'light' ? '#FFF' : '#64748B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '600',
          fontSize: '0.8rem',
          transition: 'all 0.2s ease'
        }}
      >
        <Sun size={15} /> Apple Light
      </button>

      <button
        onClick={() => toggleTheme('dark')}
        title="Modo Oscuro Glass"
        style={{
          padding: '8px 12px',
          borderRadius: '16px',
          border: 'none',
          background: theme === 'dark' ? '#38BDF8' : 'rgba(0,0,0,0.06)',
          color: theme === 'dark' ? '#0F172A' : '#64748B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '600',
          fontSize: '0.8rem',
          transition: 'all 0.2s ease'
        }}
      >
        <Moon size={15} /> Dark Glass
      </button>

      <button
        onClick={() => toggleTheme('google-vibrant')}
        title="Modo Google Vibrant"
        style={{
          padding: '8px 12px',
          borderRadius: '16px',
          border: 'none',
          background: theme === 'google-vibrant' ? 'linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853)' : 'rgba(0,0,0,0.06)',
          color: theme === 'google-vibrant' ? '#FFF' : '#64748B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '600',
          fontSize: '0.8rem',
          transition: 'all 0.2s ease'
        }}
      >
        <Palette size={15} /> Google Theme
      </button>
    </div>
  );
};
