import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, X, Check, Flame, Heart, Wine, LayoutGrid, List } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  {
    id: 'light',
    name: 'Blanco 1',
    shortDesc: 'Claro cristalino',
    icon: Sun,
    previewBg: '#F2F2F7',
    previewCard: '#FFFFFF',
    previewAccent: '#007AFF',
    badgeColor: '#007AFF'
  },
  {
    id: 'light-warm',
    name: 'Blanco 2',
    shortDesc: 'Cálido y suave',
    icon: Flame,
    previewBg: '#F6F3EC',
    previewCard: '#FFFFFF',
    previewAccent: '#EA580C',
    badgeColor: '#EA580C'
  },
  {
    id: 'dark',
    name: 'Negro',
    shortDesc: 'Oscuro profundo',
    icon: Moon,
    previewBg: '#000000',
    previewCard: '#1C1C1E',
    previewAccent: '#0A84FF',
    badgeColor: '#38BDF8'
  },
  {
    id: 'guinda',
    name: 'Guinda Noche 🍷',
    shortDesc: 'Vino elegante',
    icon: Wine,
    previewBg: '#2d060d',
    previewCard: '#440a14',
    previewAccent: '#E11D48',
    badgeColor: '#FB7185'
  },
  {
    id: 'guinda-light',
    name: 'Guinda Rosado 🌸',
    shortDesc: 'Rosa suave y crema',
    icon: Heart,
    previewBg: '#FDF2F4',
    previewCard: '#FFFFFF',
    previewAccent: '#BE123C',
    badgeColor: '#BE123C'
  },
  {
    id: 'coraje',
    name: 'Coraje Beige 🐕',
    shortDesc: 'Beige del desierto',
    icon: Heart,
    previewBg: '#F4EBE1',
    previewCard: '#FFFAF5',
    previewAccent: '#DB2777',
    badgeColor: '#DB2777'
  },
  {
    id: 'coraje-dark',
    name: 'Coraje Noche ✨',
    shortDesc: 'Morado y magenta',
    icon: Sparkles,
    previewBg: '#120919',
    previewCard: '#22102C',
    previewAccent: '#EC4899',
    badgeColor: '#EC4899'
  },
  {
    id: 'beige-carmesi',
    name: 'Beige Carmesí 🍷',
    shortDesc: 'Beige crema y vino',
    icon: Flame,
    previewBg: '#E8DFD8',
    previewCard: '#F8F3EE',
    previewAccent: '#9F1239',
    badgeColor: '#9F1239'
  }
];

export const ThemeSelectorModal = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('rumbo_theme_view_mode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('rumbo_theme_view_mode', viewMode);
  }, [viewMode]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '16px',
          boxSizing: 'border-box'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          style={{
            width: '100%',
            maxWidth: '460px',
            maxHeight: 'min(92vh, 600px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '24px',
            padding: '16px 16px 14px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
            color: 'var(--text-main)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  🎨 Temas
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--accent-color)',
                  background: 'rgba(0, 122, 255, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {THEMES.length} estilos
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Selecciona la apariencia visual de RUMBO
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Toggle Grid/List */}
              <div style={{
                display: 'flex',
                background: 'rgba(120, 120, 128, 0.12)',
                borderRadius: '12px',
                padding: '2px',
                gap: '2px'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Vista Cuadrícula"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '9px',
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--card-bg)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--text-secondary)',
                    boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Vista Lista"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '9px',
                    border: 'none',
                    background: viewMode === 'list' ? 'var(--card-bg)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--accent-color)' : 'var(--text-secondary)',
                    boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <List size={14} />
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(120, 120, 128, 0.12)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Theme Options Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '2px',
            marginRight: '-2px'
          }}>
            {viewMode === 'grid' ? (
              /* Compact 2-Column Grid Layout */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {THEMES.map((t, index) => {
                  const isSelected = theme === t.id;
                  const Icon = t.icon;
                  const isFullWidth = index === THEMES.length - 1 && THEMES.length % 2 !== 0;

                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleTheme(t.id)}
                      style={{
                        gridColumn: isFullWidth ? 'span 2' : 'span 1',
                        padding: '9px 11px',
                        borderRadius: '16px',
                        border: isSelected ? `2px solid ${t.badgeColor}` : '1.5px solid var(--card-border)',
                        background: isSelected ? 'rgba(120, 120, 128, 0.12)' : 'rgba(120, 120, 128, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected ? `0 4px 12px ${t.badgeColor}25` : 'none',
                        position: 'relative'
                      }}
                    >
                      {/* Swatch Icon */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: t.previewBg,
                          border: `2px solid ${t.previewAccent}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: t.previewAccent,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                        }}
                      >
                        <Icon size={16} />
                      </div>

                      {/* Theme text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '0.84rem', 
                            fontWeight: 700, 
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {t.name}
                          </h4>
                        </div>
                        <p style={{ 
                          margin: '1px 0 0', 
                          fontSize: '0.70rem', 
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {t.shortDesc}
                        </p>
                      </div>

                      {/* Radio / Check mark */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? `2px solid ${t.badgeColor}` : '1.5px solid var(--card-border)',
                          background: isSelected ? t.badgeColor : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Compact List View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {THEMES.map((t) => {
                  const isSelected = theme === t.id;
                  const Icon = t.icon;

                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleTheme(t.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '14px',
                        border: isSelected ? `1.5px solid ${t.badgeColor}` : '1px solid var(--card-border)',
                        background: isSelected ? 'rgba(120, 120, 128, 0.12)' : 'rgba(120, 120, 128, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: t.previewBg,
                          border: `1.5px solid ${t.previewAccent}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: t.previewAccent,
                          flexShrink: 0
                        }}
                      >
                        <Icon size={14} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {t.name}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {t.shortDesc}
                        </span>
                      </div>

                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isSelected ? `2px solid ${t.badgeColor}` : '1.5px solid var(--card-border)',
                          background: isSelected ? t.badgeColor : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0
                        }}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Compact "Listo" button */}
          <div style={{ marginTop: '12px', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '14px',
                border: 'none',
                background: 'var(--accent-color)',
                color: '#fff',
                fontSize: '0.90rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
                transition: 'all 0.18s ease'
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

