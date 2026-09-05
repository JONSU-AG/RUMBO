import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, X, Check, Flame, Heart, Wine } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  {
    id: 'light',
    name: 'Blanco 1',
    desc: 'Apple Claro, minimalista y cristalino',
    icon: Sun,
    previewBg: '#F2F2F7',
    previewCard: '#FFFFFF',
    previewAccent: '#007AFF',
    badgeColor: '#007AFF'
  },
  {
    id: 'light-warm',
    name: 'Blanco 2',
    desc: 'Cálido, suave y descansado para la vista',
    icon: Flame,
    previewBg: '#F6F3EC',
    previewCard: '#FFFFFF',
    previewAccent: '#EA580C',
    badgeColor: '#EA580C'
  },
  {
    id: 'dark',
    name: 'Negro',
    desc: 'Modo oscuro profundo estilo macOS Sonoma',
    icon: Moon,
    previewBg: '#000000',
    previewCard: '#1C1C1E',
    previewAccent: '#0A84FF',
    badgeColor: '#38BDF8'
  },
  {
    id: 'guinda',
    name: 'Guinda Noche 🍷',
    desc: 'Vino oscuro donde predomina el guinda con toques oscuros',
    icon: Wine,
    previewBg: '#2d060d',
    previewCard: '#440a14',
    previewAccent: '#E11D48',
    badgeColor: '#FB7185'
  },
  {
    id: 'guinda-light',
    name: 'Guinda Rosado 🌸',
    desc: 'Rosado claro suave con acentos guinda y crema',
    icon: Heart,
    previewBg: '#FDF2F4',
    previewCard: '#FFFFFF',
    previewAccent: '#BE123C',
    badgeColor: '#BE123C'
  },
  {
    id: 'coraje',
    name: 'Coraje Beige',
    desc: 'Beige cálido del desierto con rosa magenta',
    icon: Heart,
    previewBg: '#F4EBE1',
    previewCard: '#FFFAF5',
    previewAccent: '#DB2777',
    badgeColor: '#DB2777'
  },
  {
    id: 'coraje-dark',
    name: 'Coraje Noche',
    desc: 'Morado nocturno elegante con destellos magenta',
    icon: Sparkles,
    previewBg: '#120919',
    previewCard: '#22102C',
    previewAccent: '#EC4899',
    badgeColor: '#EC4899'
  }
];

export const ThemeSelectorModal = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.68)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '28px',
            padding: '24px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
            color: 'var(--text-main)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                🎨 Elige tu Tema
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Personaliza la apariencia visual de RUMBO
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(120, 120, 128, 0.15)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Theme list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {THEMES.map((t) => {
              const isSelected = theme === t.id;
              const Icon = t.icon;

              return (
                <motion.div
                  key={t.id}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    toggleTheme(t.id);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '18px',
                    border: isSelected ? `2px solid ${t.badgeColor}` : '1.5px solid var(--card-border)',
                    background: isSelected ? 'rgba(120, 120, 128, 0.1)' : 'rgba(120, 120, 128, 0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 4px 14px ${t.badgeColor}22` : 'none'
                  }}
                >
                  {/* Theme swatch circle */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: t.previewBg,
                      border: `2px solid ${t.previewAccent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: t.previewAccent,
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {t.name}
                      </h4>
                      {isSelected && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          background: t.badgeColor,
                          color: '#fff'
                        }}>
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '1px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {t.desc}
                    </p>
                  </div>

                  {/* Radio tick */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? `2px solid ${t.badgeColor}` : '2px solid var(--card-border)',
                      background: isSelected ? t.badgeColor : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '16px',
                border: 'none',
                background: 'var(--accent-color)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 6px 16px rgba(0, 122, 255, 0.25)'
              }}
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
