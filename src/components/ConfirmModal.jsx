import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, CheckCircle2, X, ShieldAlert } from 'lucide-react';

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar Acción", 
  message = "¿Estás seguro de realizar esta acción?", 
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  variant = "danger" // 'danger' | 'warning' | 'info'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      <div 
        className="ios-modal-backdrop" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          style={{
            background: 'var(--card-bg, #1C1C1E)',
            border: '1.5px solid var(--card-border, rgba(255,255,255,0.15))',
            borderRadius: '26px',
            padding: '26px 24px 22px',
            maxWidth: '390px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: 'var(--text-main, #FFFFFF)'
          }}
        >
          {/* Icon Header */}
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: isDanger ? 'rgba(239, 68, 68, 0.16)' : 'rgba(0, 122, 255, 0.16)',
            color: isDanger ? '#EF4444' : 'var(--accent-color, #007AFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: isDanger ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1.5px solid rgba(0, 122, 255, 0.35)'
          }}>
            {isDanger ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
          </div>

          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 800 }}>
            {title}
          </h3>

          <p style={{ margin: '0 0 24px 0', fontSize: '0.92rem', color: 'var(--text-secondary, rgba(255,255,255,0.7))', lineHeight: 1.5 }}>
            {message}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {cancelText && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: '1.5px solid var(--card-border, rgba(255,255,255,0.15))',
                  background: 'rgba(120, 120, 128, 0.14)',
                  color: 'var(--text-main, #FFFFFF)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '16px',
                border: 'none',
                background: isDanger ? '#EF4444' : 'var(--accent-color, #007AFF)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: isDanger ? '0 4px 16px rgba(239, 68, 68, 0.35)' : '0 4px 16px rgba(0, 122, 255, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const NoticeModal = ({
  isOpen,
  onClose,
  title = "Aviso RUMBO",
  message = "",
  type = "info", // 'info' | 'success' | 'warning' | 'error'
  buttonText = "Entendido"
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  const iconColor = isSuccess ? '#34A853' : isError ? '#EF4444' : isWarning ? '#F59E0B' : 'var(--accent-color, #007AFF)';

  return (
    <AnimatePresence>
      <div 
        className="ios-modal-backdrop" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          style={{
            background: 'var(--card-bg, #1C1C1E)',
            border: '1.5px solid var(--card-border, rgba(255,255,255,0.15))',
            borderRadius: '26px',
            padding: '26px 24px 22px',
            maxWidth: '390px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: 'var(--text-main, #FFFFFF)'
          }}
        >
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: `${iconColor}20`,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: `1.5px solid ${iconColor}40`
          }}>
            {isSuccess ? <CheckCircle2 size={28} /> : isError ? <ShieldAlert size={28} /> : <Info size={28} />}
          </div>

          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 800 }}>
            {title}
          </h3>

          <p style={{ margin: '0 0 24px 0', fontSize: '0.92rem', color: 'var(--text-secondary, rgba(255,255,255,0.7))', lineHeight: 1.5 }}>
            {message}
          </p>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '16px',
              border: 'none',
              background: iconColor,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${iconColor}40`,
              transition: 'all 0.2s ease'
            }}
          >
            {buttonText}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
