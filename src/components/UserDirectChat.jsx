import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Trash2, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth, ADMIN_EMAILS, isAuthorOfFirebase } from '../context/AuthContext';
import { LiveUserAvatar, LiveUserName } from './LiveUserAvatar';
import { ConfirmModal, NoticeModal } from './ConfirmModal';
import { Link } from 'react-router-dom';

export const UserDirectChat = ({ profileUid, profileName = 'este usuario', isOwnProfile = false }) => {
  const { user, userData, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Subscribe to real-time direct profile chat messages
  useEffect(() => {
    if (!profileUid) return;

    try {
      const q = query(
        collection(db, 'mensajes_directos_perfil'),
        where('profileUid', '==', profileUid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(docs);
      }, (err) => {
        console.warn("Direct chat listener notice:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Direct chat setup error:", e);
    }
  }, [profileUid]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || submitting) return;

    setSubmitting(true);
    const text = newMessage.trim();
    try {
      await addDoc(collection(db, 'mensajes_directos_perfil'), {
        profileUid: profileUid,
        authorUid: user.uid,
        authorName: userData?.displayName || user.displayName || 'Estudiante RUMBO',
        authorPhoto: user.photoURL || null,
        text: text,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      // Send notification to profile owner if messaging someone else
      if (user.uid !== profileUid) {
        try {
          await addDoc(collection(db, 'notificaciones'), {
            recipientUid: profileUid,
            senderUid: user.uid,
            senderName: userData?.displayName || user.displayName || 'Estudiante RUMBO',
            senderPhoto: user.photoURL || null,
            type: 'chat',
            profileUid: profileUid,
            message: `te dejó un mensaje en tu chat de perfil: "${text.slice(0, 45)}"`,
            read: false,
            createdAt: serverTimestamp(),
            timestamp: Date.now()
          });
        } catch (eNotif) {
          console.warn("Error sending chat notification:", eNotif);
        }
      }

      setNewMessage('');
    } catch (err) {
      console.error("Error sending direct message:", err);
      setNoticeModal({ isOpen: true, title: "Error", message: "No se pudo enviar el mensaje: " + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = (msgId) => {
    setConfirmModal({
      isOpen: true,
      title: "Eliminar Mensaje",
      message: "¿Deseas eliminar este mensaje del chat?",
      confirmText: "Sí, Eliminar",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'mensajes_directos_perfil', msgId));
        } catch (err) {
          console.error("Error deleting message:", err);
          setNoticeModal({ isOpen: true, title: "Error", message: "Error al eliminar: " + err.message, type: 'error' });
        }
      }
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ios-glass-card" style={{
      borderRadius: '24px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      border: '1.5px solid rgba(0, 122, 255, 0.25)',
      background: 'var(--card-bg)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={19} style={{ color: 'var(--accent-color)' }} />
            <span>Chat & Mensajes con {profileName}</span>
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {isOwnProfile ? 'Mensajes y comentarios recibidos en tu perfil' : `Deja una pregunta o mensaje para ${profileName}`}
          </span>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: '12px',
          background: 'rgba(0,122,255,0.12)',
          color: 'var(--accent-color)',
          fontSize: '0.75rem',
          fontWeight: 800
        }}>
          💬 {messages.length}
        </span>
      </div>

      {/* Messages Feed Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '380px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {messages.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {isOwnProfile ? 'Aún no tienes mensajes en tu perfil' : `Sé el primero en enviar un mensaje a ${profileName}`}
            </p>
            <span style={{ fontSize: '0.8rem' }}>
              Escribe un saludo, consulta de estudios o recomendación académica.
            </span>
          </div>
        ) : (
          messages.map(msg => {
            const isMyMsg = user && user.uid === msg.authorUid;
            const canDelete = isMyMsg || isOwnProfile || isAdmin;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: isMyMsg ? 'rgba(0, 122, 255, 0.08)' : 'rgba(120, 120, 128, 0.05)',
                  border: isMyMsg ? '1px solid rgba(0, 122, 255, 0.2)' : '1px solid var(--card-border)'
                }}
              >
                <Link to={`/usuario/${msg.authorUid}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <LiveUserAvatar uid={msg.authorUid} fallbackName={msg.authorName} fallbackPhoto={msg.authorPhoto} size={32} />
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <Link to={`/usuario/${msg.authorUid}`} style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '0.84rem', textDecoration: 'none' }}>
                      <LiveUserName uid={msg.authorUid} fallbackName={msg.authorName} />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {formatDate(msg.createdAt)}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Eliminar mensaje"
                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      {user ? (
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Envía un mensaje a ${profileName}...`}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '14px',
              border: '1.5px solid var(--card-border)',
              background: 'rgba(120, 120, 128, 0.05)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!newMessage.trim() || submitting}
            style={{
              padding: '10px 14px',
              borderRadius: '14px',
              border: 'none',
              background: newMessage.trim() ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.2)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: newMessage.trim() && !submitting ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <Send size={15} />
            <span className="hide-on-mobile">Enviar</span>
          </motion.button>
        </form>
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <Link to="/auth" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>Inicia sesión</Link> para enviar mensajes directos.
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || "Aceptar"}
      />

      <NoticeModal
        isOpen={noticeModal.isOpen}
        onClose={() => setNoticeModal({ ...noticeModal, isOpen: false })}
        title={noticeModal.title}
        message={noticeModal.message}
        type={noticeModal.type}
      />
    </div>
  );
};
