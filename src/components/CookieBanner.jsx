import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Check, X } from 'lucide-react';

export const CookieBanner = ({ onOpenTerms }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('rumbo-cookie-accepted');
      if (!accepted) {
        const timer = setTimeout(() => setVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn("Storage check:", e);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('rumbo-cookie-accepted', 'true');
    } catch (e) {
      console.warn("Storage save:", e);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ios-cookie-banner"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div style={{
            background: 'rgba(66, 133, 244, 0.15)',
            padding: '10px',
            borderRadius: '14px',
            color: 'var(--google-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Cookie size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Privacidad & Términos
            </h4>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
              Usamos cookies esenciales.{' '}
              <button
                type="button"
                onClick={onOpenTerms}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--google-blue)',
                  padding: 0,
                  font: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: '700'
                }}
              >
                Términos & Condiciones
              </button>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleAccept}
              style={{
                padding: '9px 14px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--accent-gradient, linear-gradient(135deg, #007AFF, #5856D6))',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              <Check size={15} /> Entendido
            </button>

            <button
              type="button"
              onClick={handleAccept}
              aria-label="Cerrar aviso"
              style={{
                background: 'rgba(120, 120, 128, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 0
              }}
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
