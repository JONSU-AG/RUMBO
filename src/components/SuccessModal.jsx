import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export const SuccessModal = ({ isOpen, onClose, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            className="glass-card"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              zIndex: 10000,
              width: '90%',
              maxWidth: '400px',
              padding: '32px',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(52, 199, 89, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: '#34c759'
              }}
            >
              <CheckCircle size={48} />
            </motion.div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              {title || "¡Éxito!"}
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              {message || "La operación se realizó correctamente."}
            </p>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              Aceptar
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
