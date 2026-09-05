import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, MessageSquare, Heart, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const NotificationsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'notificaciones'),
        where('recipientUid', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        setNotifications(docs);
        setUnreadCount(docs.filter(n => !n.read).length);
      }, (err) => {
        console.warn("Notifications listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not listen to notifications:", e);
    }
  }, [user?.uid]);

  const markAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notificaciones', notifId), { read: true });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, 'notificaciones', n.id), { read: true });
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await deleteDoc(doc(db, 'notificaciones', notifId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="ios-glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '80vh',
              borderRadius: '28px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(0, 122, 255, 0.14)',
                  color: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-color)', fontWeight: 700 }}>
                      {unreadCount} sin leer
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Marcar todas como leídas"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--card-border)',
                      background: 'rgba(0, 122, 255, 0.08)',
                      color: 'var(--accent-color)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={14} /> Leídas
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(120, 120, 128, 0.15)',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                  <Sparkles size={36} style={{ color: 'var(--accent-color)', marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    No tienes notificaciones por el momento
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Aquí te avisaremos cuando otros estudiantes comenten o reaccionen a tus publicaciones.
                  </p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '18px',
                      background: n.read ? 'rgba(120, 120, 128, 0.04)' : 'rgba(0, 122, 255, 0.08)',
                      border: n.read ? '1px solid var(--card-border)' : '1.5px solid var(--accent-color)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <Link to={`/usuario/${n.senderUid}`} onClick={onClose} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      {n.senderPhoto ? (
                        <img
                          src={n.senderPhoto}
                          alt={n.senderName}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-color), #A855F7)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}>
                          {(n.senderName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        <Link to={`/usuario/${n.senderUid}`} onClick={onClose} style={{ fontWeight: 800, color: 'var(--text-main)', textDecoration: 'none' }}>
                          {n.senderName}
                        </Link>{' '}
                        {n.message}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {formatDate(n.createdAt)}
                        </span>

                        {n.profileUid && (
                          <Link
                            to={`/usuario/${n.profileUid}`}
                            onClick={onClose}
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: 'var(--accent-color)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Ver publicación <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      title="Eliminar notificación"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
