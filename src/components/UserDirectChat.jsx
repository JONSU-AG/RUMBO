import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  MessageSquare, 
  Trash2, 
  Lock, 
  Sparkles, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  Search, 
  User, 
  ShieldCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
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
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { LiveUserAvatar, LiveUserName } from './LiveUserAvatar';
import { ConfirmModal, NoticeModal } from './ConfirmModal';
import { Link } from 'react-router-dom';

export const UserDirectChat = ({ 
  profileUid, 
  profileName = 'este usuario', 
  isOwnProfile = false,
  initialChatWithUid = null 
}) => {
  const { user, userData, isAdmin } = useAuth();
  
  // Selected conversation partner when in own profile view
  const [selectedPartnerUid, setSelectedPartnerUid] = useState(initialChatWithUid || null);
  const [selectedPartnerData, setSelectedPartnerData] = useState(null);
  
  // All messages where current user is a participant (for own profile inbox list)
  const [inboxMessages, setInboxMessages] = useState([]);
  
  // Active messages in the current 1-on-1 conversation
  const [activeMessages, setActiveMessages] = useState([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
  const chatBottomRef = useRef(null);

  // Sync initialChatWithUid when prop changes
  useEffect(() => {
    if (initialChatWithUid) {
      setSelectedPartnerUid(initialChatWithUid);
    }
  }, [initialChatWithUid]);

  // Determine active conversation partner UID
  // If viewing someone else's profile -> always profileUid
  // If viewing own profile -> selectedPartnerUid (if chosen)
  const currentPartnerUid = isOwnProfile ? selectedPartnerUid : profileUid;

  // Active 1-on-1 Conversation ID
  const activeConversationId = useMemo(() => {
    if (!user?.uid || !currentPartnerUid) return null;
    return [user.uid, currentPartnerUid].sort().join('_');
  }, [user?.uid, currentPartnerUid]);

  // 1. Subscribe to real-time messages for the ACTIVE 1-on-1 conversation
  useEffect(() => {
    if (!activeConversationId) {
      setActiveMessages([]);
      return;
    }

    try {
      // Query modern private messages by conversationId
      const q = query(
        collection(db, 'mensajes_directos_privados'),
        where('conversationId', '==', activeConversationId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return tA - tB;
        });
        setActiveMessages(docs);
      }, (err) => {
        console.warn("Active private chat listener notice:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Direct chat setup error:", e);
    }
  }, [activeConversationId]);

  // 2. If on OWN profile, listen to all conversations where user is a participant
  useEffect(() => {
    if (!isOwnProfile || !user?.uid) return;

    try {
      const q = query(
        collection(db, 'mensajes_directos_privados'),
        where('participants', 'array-contains', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setInboxMessages(docs);
      }, (err) => {
        console.warn("Inbox listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Inbox setup error:", e);
    }
  }, [isOwnProfile, user?.uid]);

  // Group inbox messages by partner UID for the WhatsApp conversation list
  const conversationGroups = useMemo(() => {
    if (!user?.uid) return [];
    const map = {};

    inboxMessages.forEach(msg => {
      // The partner is the participant that is not me
      const partnerUid = (msg.participants && msg.participants.find(p => p !== user.uid)) ||
                         (msg.senderUid === user.uid ? msg.recipientUid : msg.senderUid);

      if (!partnerUid) return;

      const partnerName = msg.senderUid === user.uid 
        ? (msg.recipientName || 'Estudiante RUMBO') 
        : (msg.senderName || 'Estudiante RUMBO');

      const partnerPhoto = msg.senderUid === user.uid 
        ? (msg.recipientPhoto || null) 
        : (msg.senderPhoto || null);

      const msgTime = msg.createdAt?.toMillis ? msg.createdAt.toMillis() : (msg.timestamp || 0);

      if (!map[partnerUid]) {
        map[partnerUid] = {
          partnerUid,
          partnerName,
          partnerPhoto,
          lastMsg: msg,
          lastTime: msgTime,
          unreadCount: (!msg.read && msg.recipientUid === user.uid) ? 1 : 0
        };
      } else {
        if (msgTime > map[partnerUid].lastTime) {
          map[partnerUid].lastMsg = msg;
          map[partnerUid].lastTime = msgTime;
          if (partnerName) map[partnerUid].partnerName = partnerName;
          if (partnerPhoto) map[partnerUid].partnerPhoto = partnerPhoto;
        }
        if (!msg.read && msg.recipientUid === user.uid) {
          map[partnerUid].unreadCount += 1;
        }
      }
    });

    const list = Object.values(map).sort((a, b) => b.lastTime - a.lastTime);
    
    if (!searchFilter.trim()) return list;
    const filter = searchFilter.toLowerCase();
    return list.filter(c => c.partnerName?.toLowerCase().includes(filter));
  }, [inboxMessages, user?.uid, searchFilter]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages.length]);

  // Send a private 1-on-1 message (WhatsApp style)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || submitting || !currentPartnerUid) return;

    setSubmitting(true);
    const text = newMessage.trim();
    const now = Date.now();

    try {
      const participants = [user.uid, currentPartnerUid].sort();
      const conversationId = participants.join('_');

      const targetPartnerName = selectedPartnerData?.partnerName || profileName || 'Estudiante RUMBO';
      const targetPartnerPhoto = selectedPartnerData?.partnerPhoto || null;

      // 1. Save strictly private message
      await addDoc(collection(db, 'mensajes_directos_privados'), {
        conversationId,
        participants,
        senderUid: user.uid,
        senderName: userData?.displayName || user.displayName || 'Estudiante RUMBO',
        senderPhoto: user.photoURL || null,
        recipientUid: currentPartnerUid,
        recipientName: targetPartnerName,
        recipientPhoto: targetPartnerPhoto,
        text: text,
        createdAt: serverTimestamp(),
        timestamp: now,
        read: false
      });

      // 2. Send instant private notification to recipient
      if (user.uid !== currentPartnerUid) {
        try {
          await addDoc(collection(db, 'notificaciones'), {
            recipientUid: currentPartnerUid,
            senderUid: user.uid,
            senderName: userData?.displayName || user.displayName || 'Estudiante RUMBO',
            senderPhoto: user.photoURL || null,
            type: 'chat',
            conversationId: conversationId,
            targetPath: `/usuario/${currentPartnerUid}?tab=chat&with=${user.uid}`,
            message: `te envió un mensaje privado: "${text.slice(0, 45)}"`,
            read: false,
            createdAt: serverTimestamp(),
            timestamp: now
          });
        } catch (eNotif) {
          console.warn("Error sending chat notification:", eNotif);
        }
      }

      setNewMessage('');
    } catch (err) {
      console.error("Error sending private message:", err);
      setNoticeModal({ 
        isOpen: true, 
        title: "Error de Envío", 
        message: "No se pudo enviar el mensaje privado: " + err.message, 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete message
  const handleDeleteMessage = (msg) => {
    const isMine = user && msg.senderUid === user.uid;
    setConfirmModal({
      isOpen: true,
      title: isMine ? "Eliminar Mensaje" : "Eliminar (Moderación)",
      message: "¿Deseas eliminar este mensaje de la conversación?",
      confirmText: "Sí, Eliminar",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'mensajes_directos_privados', msg.id));
        } catch (err) {
          console.error("Error deleting message:", err);
          setNoticeModal({ isOpen: true, title: "Error", message: "Error al eliminar: " + err.message, type: 'error' });
        }
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatInboxDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  // -------------------------------------------------------------
  // VIEW: Not Logged In
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="ios-glass-card" style={{
        borderRadius: '24px',
        padding: '36px 20px',
        textAlign: 'center',
        background: 'var(--card-bg)',
        border: '1.5px solid var(--card-border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(5, 150, 105, 0.12)',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Lock size={26} />
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Mensajes Directos Privados
        </h4>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '380px', marginInline: 'auto' }}>
          Para mantener la privacidad y seguridad como en WhatsApp, debes iniciar sesión con tu cuenta para enviar y leer mensajes directos.
        </p>
        <Link
          to="/auth"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
          }}
        >
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Own Profile & No Partner Selected -> WhatsApp Inbox List
  // -------------------------------------------------------------
  if (isOwnProfile && !selectedPartnerUid) {
    return (
      <div className="ios-glass-card" style={{
        borderRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: '1.5px solid rgba(16, 185, 129, 0.25)',
        background: 'var(--card-bg)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
      }}>
        {/* Inbox Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #10B981)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={17} />
              </div>
              <span>Mis Mensajes Privados</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Lock size={12} style={{ color: '#059669' }} /> Conversaciones 100% privadas e internas
            </span>
          </div>
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            fontSize: '0.78rem',
            fontWeight: 800
          }}>
            {conversationGroups.length} chats
          </span>
        </div>

        {/* Search Contact Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar conversación por nombre de estudiante..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '14px',
              border: '1px solid var(--card-border)',
              background: 'rgba(120, 120, 128, 0.05)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* WhatsApp Conversations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {conversationGroups.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(120, 120, 128, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'var(--text-secondary)'
              }}>
                <MessageSquare size={24} style={{ opacity: 0.6 }} />
              </div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {searchFilter ? 'No se encontraron conversaciones con ese nombre' : 'Aún no tienes mensajes privados'}
              </p>
              <span style={{ fontSize: '0.82rem', display: 'block', maxWidth: '340px', margin: '0 auto' }}>
                Cuando visites el perfil de otro estudiante y le envíes un mensaje, o cuando te escriban a ti, aparecerán aquí como en WhatsApp.
              </span>
            </div>
          ) : (
            conversationGroups.map(group => (
              <motion.div
                key={group.partnerUid}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedPartnerUid(group.partnerUid);
                  setSelectedPartnerData(group);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: group.unreadCount > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(120, 120, 128, 0.04)',
                  border: group.unreadCount > 0 ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--card-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <LiveUserAvatar uid={group.partnerUid} fallbackName={group.partnerName} fallbackPhoto={group.partnerPhoto} size={42} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: '2px solid var(--card-bg)'
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <LiveUserName uid={group.partnerUid} fallbackName={group.partnerName} />
                    </span>
                    <span style={{ fontSize: '0.72rem', color: group.unreadCount > 0 ? '#059669' : 'var(--text-secondary)', fontWeight: group.unreadCount > 0 ? 800 : 500 }}>
                      {formatInboxDate(group.lastTime)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: group.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-secondary)',
                      fontWeight: group.unreadCount > 0 ? 700 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {group.lastMsg?.senderUid === user.uid ? 'Tú: ' : ''}
                      {group.lastMsg?.text || 'Mensaje adjunto'}
                    </p>

                    {group.unreadCount > 0 && (
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: '10px',
                        background: '#10B981',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        {group.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: 1-on-1 WhatsApp Chat View (Either with selectedPartner or visited profile)
  // -------------------------------------------------------------
  const displayPartnerName = isOwnProfile 
    ? (selectedPartnerData?.partnerName || 'Estudiante RUMBO') 
    : (profileName || 'este usuario');

  const displayPartnerPhoto = isOwnProfile 
    ? (selectedPartnerData?.partnerPhoto || null) 
    : null;

  return (
    <div className="ios-glass-card" style={{
      borderRadius: '24px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '520px',
      border: '1.5px solid rgba(16, 185, 129, 0.3)',
      background: 'var(--card-bg)',
      boxShadow: '0 12px 35px rgba(0,0,0,0.08)'
    }}>
      {/* WhatsApp Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(5, 150, 105, 0.08)',
        borderBottom: '1px solid var(--card-border)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Back button if in own profile inbox */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                setSelectedPartnerUid(null);
                setSelectedPartnerData(null);
              }}
              style={{
                background: 'rgba(120, 120, 128, 0.1)',
                border: 'none',
                borderRadius: '12px',
                padding: '6px 10px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
              title="Volver a lista de chats"
            >
              <ArrowLeft size={16} /> <span className="hide-on-mobile">Chats</span>
            </button>
          )}

          <Link to={`/usuario/${currentPartnerUid}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <LiveUserAvatar uid={currentPartnerUid} fallbackName={displayPartnerName} fallbackPhoto={displayPartnerPhoto} size={38} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10B981',
                border: '1.5px solid var(--card-bg)'
              }} />
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LiveUserName uid={currentPartnerUid} fallbackName={displayPartnerName} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={10} /> Chat Privado Interno
              </span>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#059669',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🔒 Encriptado Local
          </span>
        </div>
      </div>

      {/* Messages Scroll Feed (WhatsApp Bubbles) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'rgba(120, 120, 128, 0.02)'
      }}>
        {activeMessages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              <MessageSquare size={22} />
            </div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
              Inicia la conversación privada con {displayPartnerName}
            </p>
            <span style={{ fontSize: '0.8rem', maxWidth: '300px', display: 'block', margin: '0 auto' }}>
              Este chat es 100% interno entre ustedes dos. Ningún otro usuario podrá ver estos mensajes.
            </span>
          </div>
        ) : (
          activeMessages.map(msg => {
            const isMe = user && msg.senderUid === user.uid;
            const canDelete = isMe || isAdmin;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe 
                    ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
                    : 'var(--card-bg)',
                  color: isMe ? '#FFFFFF' : 'var(--text-main)',
                  border: isMe ? 'none' : '1px solid var(--card-border)',
                  boxShadow: isMe 
                    ? '0 4px 14px rgba(16, 185, 129, 0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative',
                  wordBreak: 'break-word',
                  fontSize: '0.9rem',
                  lineHeight: 1.45
                }}>
                  {/* Message Content */}
                  <div>{msg.text}</div>

                  {/* Metadata: Time and Checks */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    marginTop: '4px',
                    fontSize: '0.68rem',
                    color: isMe ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)'
                  }}>
                    <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                    {isMe && <CheckCheck size={13} style={{ opacity: 0.9 }} />}
                    
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg)}
                        title="Eliminar mensaje"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isMe ? 'rgba(255, 255, 255, 0.7)' : '#EF4444',
                          cursor: 'pointer',
                          padding: '0 0 0 4px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* WhatsApp Chat Input Bar */}
      <form onSubmit={handleSendMessage} style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Escribe un mensaje privado para ${displayPartnerName}...`}
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: '20px',
            border: '1.5px solid var(--card-border)',
            background: 'rgba(120, 120, 128, 0.05)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!newMessage.trim() || submitting}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: newMessage.trim() && !submitting 
              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
              : 'rgba(120, 120, 128, 0.2)',
            color: '#FFFFFF',
            cursor: newMessage.trim() && !submitting ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: newMessage.trim() ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
          title="Enviar mensaje privado"
        >
          <Send size={16} />
        </motion.button>
      </form>

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
