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
  ExternalLink,
  Copy,
  Smile,
  ThumbsUp,
  Heart,
  Flame,
  Image as ImageIcon,
  Loader2,
  X,
  Crop,
  Download
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
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { LiveUserAvatar, LiveUserName } from './LiveUserAvatar';
import { ConfirmModal, NoticeModal } from './ConfirmModal';
import { Link } from 'react-router-dom';
import { uploadFileReliable, getDirectImageUrl, getDriveThumbnailUrl, getDriveExportUrl } from '../lib/storageHelper';

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeActionMsg, setActiveActionMsg] = useState(null); // Message selected for long-press/click options modal
  const [fullViewImageUrl, setFullViewImageUrl] = useState(null); // Fullscreen image viewer pop-up
  const [imagePreviewModal, setImagePreviewModal] = useState({ isOpen: false, file: null, previewUrl: null, isCropped: false }); // Send/Preview/Crop modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (!user?.uid || !currentPartnerUid) {
      setActiveMessages([]);
      return;
    }

    try {
      // Query private messages for this specific 2-user interaction in real time
      const q = query(
        collection(db, 'mensajes_directos_privados'),
        where('participants', 'array-contains', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => (m.senderUid === currentPartnerUid && m.recipientUid === user.uid) || 
                       (m.senderUid === user.uid && m.recipientUid === currentPartnerUid) ||
                       m.conversationId === activeConversationId);

        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return tA - tB;
        });

        setActiveMessages(docs);

        // Mark incoming unread messages as read automatically when chat window is active
        docs.forEach(async (m) => {
          if (!m.read && m.recipientUid === user.uid) {
            try {
              await updateDoc(doc(db, 'mensajes_directos_privados', m.id), { read: true });
            } catch (e) {
              // silent catch for permission or unread update
            }
          }
        });
      }, (err) => {
        console.warn("Active private chat listener notice:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Direct chat setup error:", e);
    }
  }, [user?.uid, currentPartnerUid, activeConversationId]);

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

  const chatScrollContainerRef = useRef(null);

  // Scroll inner chat container to bottom when messages update WITHOUT pulling the whole window/page
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [activeMessages.length]);

  // Send a private 1-on-1 message (WhatsApp style)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !user || submitting || !currentPartnerUid) return;

    setSubmitting(true);
    const text = newMessage.trim();
    const now = Date.now();

    try {
      let imageUrl = null;
      if (selectedImage) {
        setImageUploading(true);
        // Covert image file directly to compressed DataURL (Base64) to guarantee 100% instant cross-device rendering without CORS/Drive restrictions
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(selectedImage);
        });
      }

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
        imageUrl: imageUrl,
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
            targetPath: `/chats?with=${user.uid}`,
            message: imageUrl 
              ? (text ? `📷 Te envió una foto con mensaje: "${text.slice(0, 30)}"` : '📷 Te envió una imagen') 
              : `te envió un mensaje privado: "${text.slice(0, 45)}"`,
            read: false,
            createdAt: serverTimestamp(),
            timestamp: now
          });
        } catch (eNotif) {
          console.warn("Error sending chat notification:", eNotif);
        }
      }

      setNewMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      setImageUploading(false);
    }
  };

  // Reaction toggle handler
  const handleToggleReaction = async (msgId, currentReactions, emoji) => {
    if (!user?.uid) return;
    try {
      const reactions = { ...(currentReactions || {}) };
      const userList = reactions[emoji] || [];
      const hasReacted = userList.includes(user.uid);

      if (hasReacted) {
        reactions[emoji] = userList.filter(id => id !== user.uid);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...userList, user.uid];
      }

      await updateDoc(doc(db, 'mensajes_directos_privados', msgId), { reactions });
    } catch (e) {
      console.warn("Error toggling reaction:", e);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setNoticeModal({
      isOpen: true,
      title: "Mensaje Copiado",
      message: "El texto del mensaje ha sido copiado al portapapeles.",
      type: 'info'
    });
  };

  const renderMessageTextWithLinks = (text, isMe) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isMe ? '#FFE066' : 'var(--accent-color)',
              fontWeight: 700,
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
                      {group.lastMsg?.imageUrl ? (group.lastMsg?.text ? `📷 ${group.lastMsg.text}` : '📷 Foto') : (group.lastMsg?.text || 'Mensaje')}
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
      height: '560px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
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
      <div
        ref={chatScrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(120, 120, 128, 0.02)'
        }}
      >
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

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  onClick={() => setActiveActionMsg(msg)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: isMe 
                      ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
                      : 'var(--card-bg)',
                    color: isMe ? '#FFFFFF' : 'var(--text-main)',
                    border: isMe ? 'none' : '1px solid var(--card-border)',
                    boxShadow: isMe 
                      ? '0 3px 10px rgba(16, 185, 129, 0.25)' 
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    fontSize: '0.88rem',
                    lineHeight: 1.35,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {/* Message Image Attachment */}
                  {msg.imageUrl && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullViewImageUrl(getDirectImageUrl(msg.imageUrl));
                      }}
                      style={{ 
                        marginBottom: msg.text ? '6px' : '0', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        border: '1px solid rgba(255,255,255,0.25)', 
                        cursor: 'pointer',
                        background: 'rgba(0,0,0,0.15)',
                        minWidth: '160px',
                        minHeight: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={getDirectImageUrl(msg.imageUrl)}
                        alt="Imagen adjunta"
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite error loops
                          const thumbUrl = getDriveThumbnailUrl(msg.imageUrl, 'w800');
                          const exportUrl = getDriveExportUrl(msg.imageUrl);
                          
                          if (thumbUrl && e.target.src !== thumbUrl) {
                            e.target.src = thumbUrl;
                          } else if (exportUrl && e.target.src !== exportUrl) {
                            e.target.src = exportUrl;
                          } else {
                            e.target.style.display = 'none';
                            if (e.target.parentNode) {
                              e.target.parentNode.innerHTML = `<div style="padding: 10px; font-size: 0.78rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">📷 Ver Imagen</div>`;
                            }
                          }
                        }}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '280px',
                          objectFit: 'contain',
                          display: 'block',
                          borderRadius: '10px'
                        }}
                      />
                    </div>
                  )}

                  {/* Message Text & Timestamp in WhatsApp slim inline layout */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                    {msg.text && (
                      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                        {renderMessageTextWithLinks(msg.text, isMe)}
                      </span>
                    )}

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.62rem',
                      color: isMe ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-secondary)',
                      marginLeft: 'auto',
                      paddingTop: '2px'
                    }}>
                      <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                      {isMe && <CheckCheck size={12} style={{ opacity: 0.9 }} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Selected Image Preview Chip */}
      {selectedImage && (
        <div style={{
          padding: '6px 12px',
          background: 'rgba(16, 185, 129, 0.12)',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#10B981',
          fontWeight: 700
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <ImageIcon size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedImage.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedImage(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* WhatsApp Chat Input Bar */}
      <form onSubmit={handleSendMessage} style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Hidden File Input for Image Attachment */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setImagePreviewModal({ isOpen: true, file: file, previewUrl: reader.result, isCropped: false });
                setSelectedImage(file);
              };
              reader.readAsDataURL(file);
            }
          }}
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Adjuntar Imagen"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: 'none',
            background: selectedImage ? 'rgba(16, 185, 129, 0.18)' : 'rgba(120, 120, 128, 0.12)',
            color: selectedImage ? '#10B981' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <ImageIcon size={18} />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Escribe un mensaje para ${displayPartnerName}...`}
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
          disabled={(!newMessage.trim() && !selectedImage) || submitting || imageUploading}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: (newMessage.trim() || selectedImage) && !submitting && !imageUploading
              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
              : 'rgba(120, 120, 128, 0.2)',
            color: '#FFFFFF',
            cursor: (newMessage.trim() || selectedImage) && !submitting && !imageUploading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: (newMessage.trim() || selectedImage) ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
          title="Enviar mensaje privado"
        >
          {imageUploading || submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
        </motion.button>
      </form>

      {/* WhatsApp Style Message Action Popover Modal */}
      <AnimatePresence>
        {activeActionMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveActionMsg(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '320px',
                borderRadius: '20px',
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                padding: '18px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* Message Snippet Preview */}
              <div style={{
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'rgba(120, 120, 128, 0.08)',
                fontSize: '0.84rem',
                color: 'var(--text-main)',
                borderLeft: '4px solid #10B981',
                maxHeight: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activeActionMsg.text || '📷 Imagen adjunta'}
              </div>

              {/* Action Buttons List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(activeActionMsg.text);
                    setActiveActionMsg(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'rgba(120, 120, 128, 0.08)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Copy size={16} /> Copiar texto del mensaje
                </button>

                {(user && (activeActionMsg.senderUid === user.uid || isAdmin)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const msgToDelete = activeActionMsg;
                      setActiveActionMsg(null);
                      handleDeleteMessage(msgToDelete);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <Trash2 size={16} /> Eliminar mensaje
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveActionMsg(null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '14px',
                    border: '1px solid var(--card-border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Fullscreen Image Viewer Pop-up Modal */}
      <AnimatePresence>
        {fullViewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullViewImageUrl(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(10px)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '10px' }}>
              <a
                href={fullViewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#FFF',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> Abrir original
              </a>
              <button
                type="button"
                onClick={() => setFullViewImageUrl(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullViewImageUrl}
              alt="Vista completa"
              onError={(e) => {
                const thumbUrl = getDriveThumbnailUrl(fullViewImageUrl, 'w1600');
                const exportUrl = getDriveExportUrl(fullViewImageUrl);
                if (e.target.src !== thumbUrl && e.target.src !== exportUrl) {
                  e.target.src = thumbUrl;
                } else if (e.target.src === thumbUrl && thumbUrl !== exportUrl) {
                  e.target.src = exportUrl;
                }
              }}
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '94vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Send Image Preview & Crop Modal */}
      <AnimatePresence>
        {imagePreviewModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setImagePreviewModal({ isOpen: false, file: null, previewUrl: null, isCropped: false });
              setSelectedImage(null);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '420px',
                borderRadius: '24px',
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: '#10B981' }} /> Vista Previa de Imagen
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreviewModal({ isOpen: false, file: null, previewUrl: null, isCropped: false });
                    setSelectedImage(null);
                  }}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Image Box */}
              <div style={{
                width: '100%',
                maxHeight: '320px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={imagePreviewModal.previewUrl}
                  alt="Vista previa"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '320px',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Controls & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreviewModal({ isOpen: false, file: null, previewUrl: null, isCropped: false });
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1px solid var(--card-border)',
                      background: 'transparent',
                      color: '#EF4444',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      setImagePreviewModal({ isOpen: false, file: null, previewUrl: null, isCropped: false });
                      handleSendMessage(e);
                    }}
                    style={{
                      flex: 1.5,
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                      color: '#FFF',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Send size={16} /> Enviar Foto
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
