import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const WarningBanner = () => {
  const { user, hasWarning, warningMessage, dismissWarning } = useAuth();

  if (!user || !hasWarning) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '680px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.98), rgba(253, 230, 138, 0.98))',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #F59E0B',
          borderRadius: '24px',
          boxShadow: '0 16px 36px rgba(245, 158, 11, 0.35)',
          padding: '16px 20px',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'rgba(245, 158, 11, 0.25)',
          color: '#D97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={24} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Aviso de la Comunidad RUMBO
          </div>
          <div style={{ fontSize: '0.88rem', marginTop: '2px', lineHeight: 1.4, color: '#78350F' }}>
            {warningMessage || 'Has recibido un aviso de moderación sobre tus aportes. Recuerda verificar que los enlaces y documentos cumplan con las normas académicas.'}
          </div>
        </div>

        <button
          onClick={dismissWarning}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: 'none',
            background: '#D97706',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)'
          }}
        >
          <Check size={14} /> Entendido
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
