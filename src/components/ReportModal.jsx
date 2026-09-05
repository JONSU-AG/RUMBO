import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const REPORT_REASONS = [
  { id: 'broken_link', label: '🔗 Enlace caído o archivo inaccesible' },
  { id: 'wrong_material', label: '❌ Material incorrecto, incompleto o de otro año' },
  { id: 'spam', label: '⚠️ Spam, enlaces publicitarios no autorizados' },
  { id: 'inappropriate', label: '🚫 Contenido inapropiado u ofensivo' },
  { id: 'other', label: '📝 Otro motivo' }
];

export const ReportModal = ({ isOpen, onClose, targetId, targetTitle = '', targetType = 'material', reportedUser = null }) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'reportes'), {
        targetId,
        targetTitle,
        targetType, // 'material' | 'user' | 'perfil' | 'comentario' | 'profile_comment' | 'foro'
        reportedUser: reportedUser || null,
        reporterUid: user?.uid || 'anonimo',
        reporterEmail: user?.email || 'anonimo',
        reason: selectedReason,
        reasonLabel: REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason,
        details: details.trim(),
        status: 'pendiente', // 'pendiente' | 'revisado' | 'sancionado'
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      // Update target document with reports count and auto-hide if reports >= 3
      if (targetId) {
        let targetCollection = 'uploads';
        if (targetType === 'user' || targetType === 'perfil') targetCollection = 'usuarios';
        else if (targetType === 'comentario') targetCollection = 'comments';
        else if (targetType === 'profile_comment') targetCollection = 'profile_comments';
        else if (targetType === 'foro') targetCollection = 'foro_preguntas';

        try {
          const qReports = query(collection(db, 'reportes'), where('targetId', '==', targetId));
          const snap = await getDocs(qReports);
          const reportCount = snap.size;
          const isTripleReport = reportCount >= 3;

          const targetRef = doc(db, targetCollection, targetId);
          const updateData = {
            reportsCount: reportCount,
            lastReportedAt: Date.now()
          };

          // Para perfiles de usuarios: Los reportes van al Admin, pero el perfil NUNCA se auto-cierra.
          // Solo el Admin puede revisar y opcionalmente enviar un aviso en pantalla.
          const isUserProfile = targetType === 'user' || targetType === 'perfil';
          if (isTripleReport && !isUserProfile) {
            updateData.oculto = true;
            updateData.hidden = true;
            updateData.autoHidden = true;
            updateData.tripleReported = true;
            updateData.hiddenReason = 'triple_report';
          }

          await setDoc(targetRef, updateData, { merge: true });
        } catch (errCount) {
          console.warn("Could not sync report count on target doc:", errCount);
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Error al enviar reporte: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="ios-glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          borderRadius: '28px',
          position: 'relative',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(120, 120, 128, 0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(52, 168, 83, 0.15)', borderRadius: '50%', color: '#34A853', marginBottom: '16px' }}>
              <CheckCircle size={44} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-main)' }}>
              Reporte Enviado
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
              Gracias por colaborar. Nuestro equipo de administración revisará el caso de inmediato.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(255, 59, 48, 0.15)',
                color: '#ff3b30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Reportar {targetType === 'user' ? 'Usuario' : 'Material'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {targetTitle || 'Contenido seleccionado'}
                </p>
              </div>
            </div>

            {/* Reasons List */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Selecciona el motivo:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REPORT_REASONS.map(r => (
                  <label
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: selectedReason === r.id ? '1.5px solid #ff3b30' : '1px solid var(--card-border)',
                      background: selectedReason === r.id ? 'rgba(255,59,48,0.08)' : 'rgba(120,120,128,0.05)',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      style={{ accentColor: '#ff3b30' }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Detalles adicionales (opcional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                placeholder="Explica brevemente qué ocurrió..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--card-border)',
                  background: 'rgba(120,120,128,0.06)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--card-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#ff3b30',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(255,59,48,0.3)'
                }}
              >
                <Send size={16} />
                {submitting ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
