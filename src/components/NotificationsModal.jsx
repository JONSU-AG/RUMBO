import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, MessageSquare, Heart, Sparkles, Trash2, ExternalLink, Megaphone, Info, Eye } from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const NotificationsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeNotifTab, setActiveNotifTab] = useState('avisos'); // Default tab: 'avisos' (Avisos de la comunidad / Creadores)
  const [selectedNoticePopup, setSelectedNoticePopup] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    try {
      const qUser = query(
        collection(db, 'notificaciones'),
        where('recipientUid', '==', user.uid)
      );

      const qAll = query(
        collection(db, 'notificaciones'),
        where('recipientUid', '==', 'all')
      );

      let userDocs = [];
      let allDocs = [];

      const updateMergedNotifications = () => {
        const docMap = new Map();
        [...userDocs, ...allDocs].forEach(d => docMap.set(d.id, d));
        const combined = Array.from(docMap.values());

        // Sort by most recent first
        combined.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });

        setNotifications(combined);
        setUnreadCount(combined.filter(n => !n.read).length);
      };

      const unsubUser = onSnapshot(qUser, (snapshot) => {
        userDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateMergedNotifications();
      }, (err) => {
        console.warn("User notifications listener error:", err);
      });

      const unsubAll = onSnapshot(qAll, (snapshot) => {
        allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateMergedNotifications();
      }, (err) => {
        console.warn("All notifications listener error:", err);
      });

      return () => {
        unsubUser();
        unsubAll();
      };
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

  const handleNotificationClick = (n) => {
    markAsRead(n.id);

    // If it's an Admin community notice/broadcast -> Open popup modal without navigating!
    if (n.type === 'admin_broadcast' || n.type === 'comunidad' || n.recipientUid === 'all') {
      setSelectedNoticePopup(n);
      return;
    }

    onClose();

    // 1. Mensaje Directo Privado (WhatsApp-like) -> Ir a la página independiente /chats con ese remitente
    if (n.type === 'chat' || n.type === 'mensaje' || n.type === 'direct_message' || n.targetPath?.includes('tab=chat')) {
      const chatPartner = n.senderUid && n.senderUid !== user?.uid ? n.senderUid : n.chatUid;
      if (chatPartner) {
        navigate(`/chats?with=${chatPartner}`);
      } else {
        navigate('/chats');
      }
      return;
    }

    // 2. Publicación, Comentario o Reacción en Muro -> Ir exactamente a esa publicación
    if (n.postId || n.type === 'comment' || n.type === 'reaction' || n.type === 'wall_post' || n.type === 'post') {
      const wallProfile = n.profileUid || n.targetUid || user?.uid;
      const postHash = n.postId ? `#post-${n.postId}` : '';
      const postParam = n.postId ? `&postId=${n.postId}` : '';
      navigate(`/usuario/${wallProfile}?tab=muro${postParam}${postHash}`);
      return;
    }

    // 3. Material de Biblioteca
    if (n.type === 'material' || n.materialId) {
      navigate(`/biblioteca?materialId=${n.materialId || n.targetId}`);
      return;
    }

    // 4. Ruta personalizada
    if (n.targetPath) {
      navigate(n.targetPath);
      return;
    }

    // 5. Fallback a perfil de usuario
    const targetUid = n.profileUid || n.targetUid || (n.senderUid && n.senderUid !== user?.uid ? n.senderUid : null);
    if (targetUid) {
      navigate(`/usuario/${targetUid}`);
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
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
              maxWidth: '500px',
              maxHeight: '82vh',
              borderRadius: '28px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--card-bg, #ffffff)',
              color: 'var(--text-main, #1c1c1e)',
              border: '1.5px solid var(--card-border, rgba(120,120,128,0.2))',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              position: 'relative'
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

            {/* Tab Switcher: Avisos (Default) vs Notificaciones */}
            {(() => {
              const isAvisos = (n) => n.type === 'admin_broadcast' || n.type === 'comunidad' || n.type === 'aviso' || n.recipientUid === 'all';
              const avisosList = notifications.filter(isAvisos);
              const notifList = notifications.filter(n => !isAvisos(n));

              const displayedList = activeNotifTab === 'avisos' ? avisosList : notifList;
              const avisosUnread = avisosList.filter(n => !n.read).length;
              const notifUnread = notifList.filter(n => !n.read).length;

              return (
                <>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--card-border)',
                    paddingBottom: '12px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setActiveNotifTab('avisos')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeNotifTab === 'avisos' ? 'linear-gradient(135deg, #A855F7, #6366F1)' : 'rgba(120, 120, 128, 0.08)',
                        color: activeNotifTab === 'avisos' ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: activeNotifTab === 'avisos' ? '0 4px 14px rgba(168, 85, 247, 0.35)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Megaphone size={15} />
                      <span>Avisos ({avisosList.length})</span>
                      {avisosUnread > 0 && (
                        <span style={{ padding: '2px 6px', borderRadius: '8px', background: '#EF4444', color: '#FFF', fontSize: '0.65rem', fontWeight: 900 }}>
                          {avisosUnread}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveNotifTab('normal')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeNotifTab === 'normal' ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.08)',
                        color: activeNotifTab === 'normal' ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: activeNotifTab === 'normal' ? '0 4px 14px rgba(0, 122, 255, 0.35)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Bell size={15} />
                      <span>Notificaciones ({notifList.length})</span>
                      {notifUnread > 0 && (
                        <span style={{ padding: '2px 6px', borderRadius: '8px', background: '#EF4444', color: '#FFF', fontSize: '0.65rem', fontWeight: 900 }}>
                          {notifUnread}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Notifications Feed */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                    {displayedList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                        <Sparkles size={36} style={{ color: 'var(--accent-color)', marginBottom: '10px' }} />
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {activeNotifTab === 'avisos' ? 'No hay avisos oficiales por el momento' : 'No tienes notificaciones personales'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {activeNotifTab === 'avisos'
                            ? 'Aquí verás los comunicados, avisos de la comunidad y novedades importantes.'
                            : 'Aquí verás las interacciones, respuestas y reacciones de otros estudiantes.'}
                        </p>
                      </div>
                    ) : (
                      displayedList.map(n => {
                        const isBroadcast = isAvisos(n);

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '14px',
                        borderRadius: '18px',
                        background: n.read 
                          ? 'rgba(120, 120, 128, 0.04)' 
                          : isBroadcast 
                            ? 'rgba(168, 85, 247, 0.12)' 
                            : 'rgba(0, 122, 255, 0.08)',
                        border: n.read 
                          ? '1px solid var(--card-border)' 
                          : isBroadcast 
                            ? '1.5px solid #A855F7' 
                            : '1.5px solid var(--accent-color)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {/* Avatar / Icon */}
                      {isBroadcast ? (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                        }}>
                          <Megaphone size={20} />
                        </div>
                      ) : n.senderPhoto ? (
                        <img
                          src={n.senderPhoto}
                          alt={n.senderName}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
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
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          {(n.senderName || 'U')[0].toUpperCase()}
                        </div>
                      )}

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isBroadcast ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#A855F7' }}>
                                📢 AVISO COMUNITARIO
                              </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0' }}>
                              {n.title || 'Aviso Oficial RUMBO'}
                            </div>
                            <div style={{
                              fontSize: '0.84rem',
                              color: 'var(--text-main)',
                              lineHeight: 1.45,
                              whiteSpace: (n.message && n.message.length <= 140) ? 'pre-wrap' : 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: (n.message && n.message.length > 140) ? '-webkit-box' : 'block',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {n.message}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                              {n.senderName || 'Estudiante RUMBO'}
                            </span>{' '}
                            {n.message}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            {formatDate(n.createdAt)}
                          </span>

                          {isBroadcast ? (
                            (n.message && n.message.length > 140) ? (
                              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#A855F7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Eye size={13} /> Ver más
                              </span>
                            ) : null
                          ) : (
                            <span style={{ 
                              fontSize: '0.76rem', 
                              fontWeight: 700, 
                              color: (n.type === 'chat' || n.type === 'mensaje') ? '#059669' : 'var(--accent-color)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px' 
                            }}>
                              {(n.type === 'chat' || n.type === 'mensaje' || n.type === 'direct_message') 
                                ? <>Ver Mensaje Privado 💬</>
                                : (n.postId || n.type === 'comment' || n.type === 'reaction' || n.type === 'wall_post')
                                  ? <>Ir a la Publicación 📄</>
                                  : (n.type === 'material' || n.materialId)
                                    ? <>Ver Material 📚</>
                                    : <>Ver en Perfil <ExternalLink size={12} /></>
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
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
                  );
                })
              )}
            </div>
          </>
        );
      })()}
          </motion.div>

          {/* 📢 POPUP MODAL PARA LECTURA DE AVISOS DE LA COMUNIDAD */}
          <AnimatePresence>
            {selectedNoticePopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={() => setSelectedNoticePopup(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 10000,
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="ios-glass-card"
                  style={{
                    width: '100%',
                    maxWidth: '460px',
                    borderRadius: '28px',
                    padding: '24px',
                    background: 'var(--card-bg, #ffffff)',
                    color: 'var(--text-main, #1c1c1e)',
                    border: '1.5px solid #A855F7',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Megaphone size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.18)', color: '#A855F7' }}>
                        📢 COMUNICADO OFICIAL
                      </span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {selectedNoticePopup.title || 'Aviso a la Comunidad RUMBO'}
                      </h3>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(120, 120, 128, 0.05)',
                    padding: '16px',
                    borderRadius: '18px',
                    border: '1px solid var(--card-border)',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {selectedNoticePopup.message}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Emitido: {formatDate(selectedNoticePopup.createdAt)}
                    </span>
                    <button
                      onClick={() => setSelectedNoticePopup(null)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)'
                      }}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

