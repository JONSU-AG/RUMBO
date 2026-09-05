import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  User, 
  Clock, 
  Heart, 
  Sparkles, 
  Image as ImageIcon, 
  X, 
  Folder, 
  ExternalLink, 
  Share2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  FileText,
  MessageCircle,
  ThumbsUp
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
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { uploadFileReliable } from '../lib/storageHelper';
import { ConfirmModal, NoticeModal } from './ConfirmModal';
import { LiveUserAvatar, LiveUserName } from './LiveUserAvatar';

const POST_EMOJIS = ['❤️', '🔥', '⭐'];
const COMMENT_EMOJIS = ['👍', '👎', '❤️', '🔥'];

// ─── SUB-COMPONENTE: PUBLICACIÓN INDIVIDUAL CON REACCIONES Y COMENTARIOS TIPO FACEBOOK ───
const PostItemCard = ({ 
  item, 
  user, 
  isAdmin, 
  profileUid, 
  onReport, 
  setLightboxImage, 
  expandedPreviews, 
  setExpandedPreviews, 
  handleDeleteItem,
  getDirectImageUrl,
  handleImageError,
  isImageUrl,
  getDrivePreviewUrl,
  isTargetPost = false
}) => {
  const isComment = item._type === 'comment';
  const canDelete = user && (user.uid === item.authorUid || user.uid === profileUid || isAdmin);

  const [subComments, setSubComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newSubComment, setNewSubComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Sub-comments listener for this specific post
  useEffect(() => {
    if (!item.id) return;
    try {
      const q = query(
        collection(db, 'publicacion_comentarios'),
        where('postId', '==', item.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setSubComments(docs);
      }, (err) => {
        console.warn("Subcomments listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Subcomments setup error:", e);
    }
  }, [item.id]);

  // Toggle Reaction on the Post
  const handleTogglePostReaction = async (emoji) => {
    if (!user) {
      setNoticeModal({ isOpen: true, title: "Inicio de Sesión Requerido", message: "Inicia sesión para reaccionar a esta publicación.", type: 'warning' });
      return;
    }
    const collectionName = isComment ? 'perfil_comentarios' : 'uploads';
    const docRef = doc(db, collectionName, item.id);

    const currentReactions = item.reactions || {};
    const currentEmojiUsers = currentReactions[emoji] || [];
    const hasReacted = currentEmojiUsers.includes(user.uid);

    const updatedUsers = hasReacted
      ? currentEmojiUsers.filter(u => u !== user.uid)
      : [...currentEmojiUsers, user.uid];

    const updatedReactions = {
      ...currentReactions,
      [emoji]: updatedUsers
    };

    try {
      await setDoc(docRef, { reactions: updatedReactions }, { merge: true });

      // Notify post author if user reacted to someone else's post
      if (!hasReacted && user.uid !== item.authorUid) {
        await addDoc(collection(db, 'notificaciones'), {
          recipientUid: item.authorUid,
          senderUid: user.uid,
          senderName: user.displayName || 'Estudiante RUMBO',
          senderPhoto: user.photoURL || null,
          type: 'reaction',
          postId: item.id,
          profileUid: profileUid,
          postTitle: item.title || item.text || 'Publicación',
          message: `reaccionó ${emoji} a tu publicación`,
          read: false,
          createdAt: serverTimestamp(),
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error("Error updating reaction:", err);
    }
  };

  // Submit a Sub-comment under this post
  const handleAddSubComment = async (e) => {
    e.preventDefault();
    if (!newSubComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const text = newSubComment.trim();
      await addDoc(collection(db, 'publicacion_comentarios'), {
        postId: item.id,
        postAuthorUid: item.authorUid,
        profileUid: profileUid,
        authorUid: user.uid,
        authorName: user.displayName || 'Estudiante RUMBO',
        authorPhoto: user.photoURL || null,
        text: text,
        reactions: {},
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      // Send notification to post author if commenting on someone else's post
      if (user.uid !== item.authorUid) {
        await addDoc(collection(db, 'notificaciones'), {
          recipientUid: item.authorUid,
          senderUid: user.uid,
          senderName: user.displayName || 'Estudiante RUMBO',
          senderPhoto: user.photoURL || null,
          type: 'comment',
          postId: item.id,
          profileUid: profileUid,
          postTitle: item.title || item.text || 'Publicación',
          message: `comentó en tu publicación: "${text.slice(0, 45)}"`,
          read: false,
          createdAt: serverTimestamp(),
          timestamp: Date.now()
        });
      }

      setNewSubComment('');
    } catch (err) {
      console.error("Error adding subcomment:", err);
      setNoticeModal({ isOpen: true, title: "Error", message: "Error al publicar comentario: " + err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Reaction on a Sub-comment
  const handleToggleSubCommentReaction = async (subCommentId, currentReactions = {}, emoji) => {
    if (!user) return;
    const docRef = doc(db, 'publicacion_comentarios', subCommentId);
    const currentUsers = currentReactions[emoji] || [];
    const hasReacted = currentUsers.includes(user.uid);

    const updatedUsers = hasReacted
      ? currentUsers.filter(u => u !== user.uid)
      : [...currentUsers, user.uid];

    const updatedReactions = {
      ...currentReactions,
      [emoji]: updatedUsers
    };

    try {
      await setDoc(docRef, { reactions: updatedReactions }, { merge: true });
    } catch (err) {
      console.error("Error updating subcomment reaction:", err);
    }
  };

  // Delete a Sub-comment
  const handleDeleteSubComment = (subComment) => {
    const isOther = user && subComment.authorUid && subComment.authorUid !== user.uid;
    setConfirmModal({
      isOpen: true,
      title: isOther ? "⚠️ Confirmar Eliminación" : "Borrar Comentario",
      message: isOther 
        ? `¿Deseas eliminar el comentario de ${subComment.authorName || 'este usuario'}?`
        : "¿Deseas borrar este comentario?",
      confirmText: "Sí, Borrar",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'publicacion_comentarios', subComment.id));
        } catch (err) {
          console.error("Error deleting subcomment:", err);
          setNoticeModal({ isOpen: true, title: "Error", message: "No se pudo eliminar el comentario: " + err.message, type: 'error' });
        }
      }
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Limit display to max 2 comments by default (Facebook Style)
  const visibleSubComments = showAllComments ? subComments : subComments.slice(-2);

  return (
    <motion.div
      id={`post-${item.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="ios-glass-card"
      style={{
        padding: '20px',
        borderRadius: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: isTargetPost 
          ? '2px solid #EC4899' 
          : isComment 
            ? '1px solid var(--card-border)' 
            : '1.5px solid rgba(0, 122, 255, 0.25)',
        background: isTargetPost
          ? 'rgba(236, 72, 153, 0.06)'
          : isComment 
            ? 'var(--card-bg)' 
            : 'rgba(0, 122, 255, 0.03)',
        boxShadow: isTargetPost 
          ? '0 0 25px rgba(236, 72, 153, 0.28)' 
          : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {isTargetPost && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '12px',
          background: 'rgba(236, 72, 153, 0.15)',
          color: '#EC4899',
          fontSize: '0.76rem',
          fontWeight: 800,
          alignSelf: 'flex-start'
        }}>
          📌 Publicación de tu notificación
        </div>
      )}
      {/* Post Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to={`/usuario/${item.authorUid}`} style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <LiveUserAvatar 
              uid={item.authorUid} 
              fallbackName={item.authorName} 
              fallbackPhoto={item.authorPhoto} 
              size={44} 
            />
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to={`/usuario/${item.authorUid}`}
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                  textDecoration: 'none'
                }}
              >
                <LiveUserName uid={item.authorUid} fallbackName={item.authorName} />
              </Link>
              <span style={{
                padding: '2px 8px',
                borderRadius: '99px',
                background: isComment ? 'rgba(120,120,128,0.12)' : 'rgba(0,122,255,0.14)',
                color: isComment ? 'var(--text-secondary)' : 'var(--accent-color)',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {isComment ? '💬 Mensaje' : '📚 Aporte RUMBO'}
              </span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Clock size={12} /> {formatDate(item.createdAt)}
            </span>
          </div>
        </div>

        {/* Top Actions: Delete / Report */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canDelete && (
            <button
              onClick={() => handleDeleteItem(item)}
              title="Eliminar publicación"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <Trash2 size={14} /> Borrar
            </button>
          )}
          {onReport && (
            <button
              onClick={() => onReport(item.id, item.text || item.title, isComment ? 'profile_comment' : 'material')}
              title="Reportar publicación"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <AlertTriangle size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Post Body: Title / Text */}
      {isComment ? (
        item.text && (
          <p style={{
            margin: 0,
            fontSize: '0.95rem',
            color: 'var(--text-main)',
            lineHeight: 1.5,
            whiteSpace: 'pre-line'
          }}>
            {item.text}
          </p>
        )
      ) : (
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {item.title}
          </h4>
          {item.author && item.author.trim() !== '' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '10px',
              background: 'rgba(0, 122, 255, 0.08)',
              border: '1px solid rgba(0, 122, 255, 0.18)',
              fontSize: '0.82rem',
              color: 'var(--accent-color)',
              fontWeight: 800,
              marginBottom: '6px'
            }}>
              <span>✍️ Autor: {item.author}</span>
            </div>
          )}
          {item.desc && (
            <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {item.desc}
            </p>
          )}
        </div>
      )}

      {/* Attached Image Rendering (Twitter / Facebook Media Card Style) */}
      {isComment && item.imageUrl && (
        <div
          onClick={() => setLightboxImage(item.imageUrl)}
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1px solid var(--card-border)',
            position: 'relative',
            background: 'rgba(0,0,0,0.04)',
            marginTop: '4px'
          }}
        >
          <img
            src={getDirectImageUrl(item.imageUrl)}
            onError={(e) => handleImageError(e, item.imageUrl)}
            alt="Foto adjunta"
            style={{
              width: '100%',
              maxHeight: '440px',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      )}

      {/* Material Upload Media & File Card Preview (Twitter/Facebook Style) */}
      {!isComment && item.url && (
        <div style={{ marginTop: '6px' }}>
          {isImageUrl(item.url) ? (
            <div
              onClick={() => setLightboxImage(getDirectImageUrl(item.url))}
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--card-border)',
                position: 'relative',
                background: 'rgba(0,0,0,0.04)',
                maxWidth: '480px',
                margin: '0 auto'
              }}
            >
              <img
                src={getDirectImageUrl(item.url)}
                onError={(e) => handleImageError(e, item.url)}
                alt={item.title || 'Imagen compartida'}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
          ) : (
            <div>
              {expandedPreviews[item.id] !== false && (
                <div style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2px solid rgba(0, 122, 255, 0.4)',
                  height: '520px',
                  maxWidth: '480px',
                  margin: '4px auto 8px auto',
                  background: '#FFFFFF',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.15)'
                }}>
                  <iframe
                    src={getDrivePreviewUrl(item.url) || item.url}
                    title={item.title}
                    style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }}
                    allow="autoplay"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Material Upload Actions */}
      {!isComment && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'var(--accent-color)',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ExternalLink size={14} /> Abrir Recurso
          </a>

          {getDrivePreviewUrl(item.url) && !isImageUrl(item.url) && (
            <button
              onClick={() => setExpandedPreviews(prev => ({ ...prev, [item.id]: prev[item.id] === false ? true : false }))}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: expandedPreviews[item.id] !== false ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 700
              }}
            >
              <Eye size={14} /> {expandedPreviews[item.id] !== false ? 'Ocultar Vista Previa' : 'Vista Previa'}
            </button>
          )}

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: item.title, url: item.url });
              } else {
                navigator.clipboard.writeText(item.url);
                setNoticeModal({ isOpen: true, title: "¡Enlace Copiado!", message: "El enlace del material ha sido copiado al portapapeles.", type: 'success' });
              }
            }}
            title="Compartir recurso"
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid var(--card-border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.84rem'
            }}
          >
            <Share2 size={14} /> Compartir
          </button>
        </div>
      )}

      {/* ─── EMOJI REACTIONS BAR ON POST (❤️ 🔥 ⭐) ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        paddingTop: '8px',
        borderTop: '1px solid var(--card-border)',
        flexWrap: 'wrap'
      }}>
        {POST_EMOJIS.map(emoji => {
          const userList = item.reactions?.[emoji] || [];
          const count = userList.length;
          const hasReacted = user && userList.includes(user.uid);

          return (
            <button
              key={emoji}
              onClick={() => handleTogglePostReaction(emoji)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: hasReacted ? '1.5px solid var(--accent-color)' : '1px solid var(--card-border)',
                background: hasReacted ? 'rgba(0, 122, 255, 0.12)' : 'rgba(120, 120, 128, 0.05)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ─── SUB-COMMENTS SECTION (FACEBOOK POST COMMENTS STYLE) ─── */}
      <div style={{
        marginTop: '6px',
        padding: '12px 14px',
        borderRadius: '16px',
        background: 'rgba(120, 120, 128, 0.04)',
        border: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Header / Expand All Button */}
        {subComments.length > 2 && (
          <button
            onClick={() => setShowAllComments(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              padding: '2px 0',
              textAlign: 'left',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MessageCircle size={14} />
            {showAllComments 
              ? 'Ocultar comentarios anteriores' 
              : `💬 Ver todos los ${subComments.length} comentarios (${subComments.length - 2} anteriores)`}
          </button>
        )}

        {/* Render visible sub-comments */}
        {visibleSubComments.map(c => {
          const canDeleteSub = user && (user.uid === c.authorUid || user.uid === item.authorUid || isAdmin);

          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '8px 10px',
                borderRadius: '14px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)'
              }}
            >
              <Link to={`/usuario/${c.authorUid}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'inline-flex' }}>
                <LiveUserAvatar 
                  uid={c.authorUid} 
                  fallbackName={c.authorName} 
                  fallbackPhoto={c.authorPhoto} 
                  size={34} 
                />
              </Link>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to={`/usuario/${c.authorUid}`} style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-main)', textDecoration: 'none' }}>
                    <LiveUserName uid={c.authorUid} fallbackName={c.authorName} />
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {formatDate(c.createdAt)}
                    </span>
                    {canDeleteSub && (
                      <button
                        onClick={() => handleDeleteSubComment(c)}
                        title="Borrar comentario"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: '4px 0 6px', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {c.text}
                </p>

                {/* Sub-comment Emoji Reactions */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {COMMENT_EMOJIS.map(emoji => {
                    const uList = c.reactions?.[emoji] || [];
                    const count = uList.length;
                    const hasReacted = user && uList.includes(user.uid);

                    return (
                      <button
                        key={emoji}
                        onClick={() => handleToggleSubCommentReaction(c.id, c.reactions, emoji)}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          border: hasReacted ? '1px solid var(--accent-color)' : 'none',
                          background: hasReacted ? 'rgba(0,122,255,0.12)' : 'rgba(120,120,128,0.08)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Inline Sub-comment Input Form */}
        {user ? (
          <form onSubmit={handleAddSubComment} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <input
              type="text"
              value={newSubComment}
              onChange={(e) => setNewSubComment(e.target.value)}
              placeholder="Escribe un comentario..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!newSubComment.trim() || isSubmitting}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: 'none',
                background: newSubComment.trim() ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.2)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: newSubComment.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              <Send size={14} />
              <span className="hide-on-mobile">Comentar</span>
            </button>
          </form>
        ) : (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Inicia sesión para comentar en esta publicación.
          </p>
        )}
      </div>

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
    </motion.div>
  );
};

// ─── COMPONENTE PRINCIPAL PROFILE COMMENTS / TIMELINE ───
export const ProfileComments = ({ profileUid, profileName = 'este usuario', userUploads = [], onReport, targetPostId = null }) => {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Local file preview or URL
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeFeedFilter, setActiveFeedFilter] = useState('all'); // 'all' | 'posts' | 'materials'
  const [lightboxImage, setLightboxImage] = useState(null);
  const [expandedPreviews, setExpandedPreviews] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const fileInputRef = useRef(null);

  // Auto-scroll to target post if coming from notification
  useEffect(() => {
    if (targetPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [targetPostId, comments.length, userUploads.length]);

  useEffect(() => {
    if (!profileUid) return;

    try {
      const q = query(
        collection(db, 'perfil_comentarios'),
        where('profileUid', '==', profileUid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => (!c.oculto && !c.hidden && (c.reportsCount || 0) < 3));
        
        docs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        setComments(docs);
      }, (err) => {
        console.warn("Could not listen to profile comments:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Profile comments error:", e);
    }
  }, [profileUid]);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);
    setUploadingImage(true);

    try {
      const uploadedUrl = await uploadFileReliable(file);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
      }
    } catch (err) {
      console.error("Error subiendo foto al muro:", err);
      setNoticeModal({ isOpen: true, title: "Error al Subir Imagen", message: "No se pudo subir la imagen. Intenta con una foto más liviana.", type: 'error' });
      setSelectedImage(null);
      setImageUrl('');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!newComment.trim() && !imageUrl) || !user || submitting || uploadingImage) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'perfil_comentarios'), {
        profileUid,
        authorUid: user.uid,
        authorName: user.displayName || 'Estudiante RUMBO',
        authorPhoto: user.photoURL || null,
        authorEmail: user.email || '',
        text: newComment.trim(),
        imageUrl: imageUrl.trim() || null,
        reactions: {},
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      // Send notification to profile owner if posting on someone else's wall
      if (user.uid !== profileUid) {
        try {
          await addDoc(collection(db, 'notificaciones'), {
            recipientUid: profileUid,
            senderUid: user.uid,
            senderName: user.displayName || 'Estudiante RUMBO',
            senderPhoto: user.photoURL || null,
            type: 'wall_post',
            profileUid: profileUid,
            message: `publicó en tu muro social: "${newComment.trim().slice(0, 45)}"`,
            read: false,
            createdAt: serverTimestamp(),
            timestamp: Date.now()
          });
        } catch (eNotif) {
          console.warn("Notification error:", eNotif);
        }
      }

      setNewComment('');
      setSelectedImage(null);
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Error adding comment:", err);
      setNoticeModal({ isOpen: true, title: "Error al Publicar", message: "Error al publicar mensaje: " + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.startsWith('data:image/') || url.startsWith('blob:')) return true;
    if (url.includes('firebasestorage.googleapis.com')) return true;
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i)) return true;
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) return true;
    return false;
  };

  const getDirectImageUrl = (rawUrl) => {
    if (!rawUrl) return '';
    if (typeof rawUrl !== 'string') return '';
    
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.includes('firebasestorage.googleapis.com')) {
      return rawUrl;
    }

    const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                       rawUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                       rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }

    return rawUrl;
  };

  const handleImageError = (e, rawUrl) => {
    if (!rawUrl) return;
    const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                       rawUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                       rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (driveMatch && driveMatch[1]) {
      const driveId = driveMatch[1];
      if (!e.target.dataset.triedThumbnail) {
        e.target.dataset.triedThumbnail = 'true';
        e.target.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
        return;
      }
      if (!e.target.dataset.triedUc) {
        e.target.dataset.triedUc = 'true';
        e.target.src = `https://drive.google.com/uc?export=view&id=${driveId}`;
        return;
      }
    }
  };

  const getDrivePreviewUrl = (url) => {
    if (!url) return null;
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    const folderMatch = url.match(/(?:\/folders\/|folderview\?id=|open\?id=)([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
    }
    return null;
  };

  const handleDeleteItem = (item) => {
    const isComment = item._type === 'comment';
    const isOtherUserItem = user && item.authorUid && item.authorUid !== user.uid;

    const modalTitle = isOtherUserItem 
      ? "⚠️ Confirmar Eliminación (Moderación)" 
      : (isComment ? "Eliminar Publicación" : "Eliminar Material");

    const confirmMsg = isOtherUserItem
      ? `¿Deseas eliminar ${isComment ? 'la publicación' : 'el material'} de ${item.authorName || 'este usuario'}?`
      : (isComment ? "¿Deseas eliminar esta publicación del muro?" : "¿Deseas eliminar este material publicado?");

    setConfirmModal({
      isOpen: true,
      title: modalTitle,
      message: confirmMsg,
      confirmText: "Sí, Eliminar",
      onConfirm: async () => {
        try {
          if (isComment) {
            await deleteDoc(doc(db, 'perfil_comentarios', item.id));
          } else {
            await deleteDoc(doc(db, 'uploads', item.id));
          }
        } catch (err) {
          console.error("Error deleting item:", err);
          setNoticeModal({ isOpen: true, title: "Error al Eliminar", message: "No se pudo eliminar: " + err.message, type: 'error' });
        }
      }
    });
  };

  const formattedUploads = (userUploads || []).map(u => ({
    id: u.id,
    _type: 'upload',
    title: u.title,
    desc: u.desc,
    url: u.url,
    category: u.category,
    createdAt: u.createdAt,
    reactions: u.reactions || {},
    timestamp: u.createdAt?.toMillis ? u.createdAt.toMillis() : (u.timestamp || 0),
    authorName: u.uploadedBy?.name || u.author || 'Aportante RUMBO',
    authorPhoto: u.uploadedBy?.photo || u.uploadedBy?.photoURL || null,
    authorUid: u.uploadedBy?.uid || profileUid,
    isOfficial: u.isOfficial
  }));

  const formattedComments = comments.map(c => ({
    id: c.id,
    _type: 'comment',
    text: c.text,
    imageUrl: c.imageUrl,
    createdAt: c.createdAt,
    reactions: c.reactions || {},
    timestamp: c.createdAt?.toMillis ? c.createdAt.toMillis() : (c.timestamp || Date.now()),
    authorName: c.authorName,
    authorPhoto: c.authorPhoto,
    authorUid: c.authorUid
  }));

  const combinedFeed = [...formattedComments, ...formattedUploads].sort((a, b) => b.timestamp - a.timestamp);

  const displayedFeed = combinedFeed.filter(item => {
    if (activeFeedFilter === 'posts') return item._type === 'comment';
    if (activeFeedFilter === 'materials') return item._type === 'upload';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filter Pills */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-color)' }} />
            Muro Social & Aportes de {profileName} ({combinedFeed.length})
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Publicaciones, fotos, recomendaciones y materiales compartidos por y para la comunidad RUMBO.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `🌟 Todo (${combinedFeed.length})` },
            { id: 'posts', label: `💬 Fotos y Mensajes (${comments.length})` },
            { id: 'materials', label: `📚 Materiales (${userUploads.length})` }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFeedFilter(filter.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: activeFeedFilter === filter.id ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.08)',
                color: activeFeedFilter === filter.id ? '#FFFFFF' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Post Box with Image Attachment */}
      {user ? (
        <form onSubmit={handleSubmit} className="ios-glass-card" style={{ padding: '20px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Tu Avatar"
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-color)' }}
              />
            ) : (
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-color), #A855F7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                flexShrink: 0
              }}>
                {(user.displayName || 'U')[0].toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Escribe una publicación o recomendación para ${profileName}...`}
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid var(--card-border)',
                  background: 'rgba(120, 120, 128, 0.06)',
                  color: 'var(--text-main)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.4,
                  resize: 'vertical'
                }}
              />

              {/* Image Thumbnail Preview */}
              {selectedImage && (
                <div style={{ position: 'relative', marginTop: '10px', display: 'inline-block' }}>
                  <img
                    src={selectedImage}
                    alt="Previa subida"
                    style={{
                      maxHeight: '140px',
                      borderRadius: '14px',
                      objectFit: 'cover',
                      border: '1.5px solid var(--accent-color)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  {uploadingImage && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      Subiendo foto...
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)',
                      background: 'rgba(0, 122, 255, 0.08)',
                      color: 'var(--accent-color)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ImageIcon size={16} />
                    <span className="hide-on-mobile">Adjuntar Foto</span>
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={(!newComment.trim() && !imageUrl) || submitting || uploadingImage}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: (newComment.trim() || imageUrl) && !uploadingImage ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: (newComment.trim() || imageUrl) && !submitting && !uploadingImage ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: (newComment.trim() || imageUrl) ? '0 4px 12px rgba(0,122,255,0.25)' : 'none'
                  }}
                >
                  <Send size={14} />
                  <span className="hide-on-mobile">{submitting ? 'Publicando...' : 'Publicar'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="ios-glass-card" style={{ padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Inicia sesión para publicar un mensaje o foto en el muro social.
          </p>
          <Link
            to="/auth"
            style={{
              display: 'inline-flex',
              padding: '8px 18px',
              borderRadius: '12px',
              background: 'var(--accent-color)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none'
            }}
          >
            Iniciar Sesión
          </Link>
        </div>
      )}

      {/* Social Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {displayedFeed.length === 0 ? (
          <div className="ios-glass-card" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '20px' }}>
            <Sparkles size={36} style={{ color: 'var(--accent-color)', marginBottom: '10px' }} />
            <h5 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              No hay publicaciones en esta sección
            </h5>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sé el primero en compartir un mensaje, foto o material educativo.
            </p>
          </div>
        ) : (
          displayedFeed.map(item => (
            <PostItemCard
              key={`${item._type}-${item.id}`}
              item={item}
              user={user}
              isAdmin={isAdmin}
              profileUid={profileUid}
              onReport={onReport}
              setLightboxImage={setLightboxImage}
              expandedPreviews={expandedPreviews}
              setExpandedPreviews={setExpandedPreviews}
              handleDeleteItem={handleDeleteItem}
              getDirectImageUrl={getDirectImageUrl}
              handleImageError={handleImageError}
              isImageUrl={isImageUrl}
              getDrivePreviewUrl={getDrivePreviewUrl}
              isTargetPost={Boolean(targetPostId && String(item.id) === String(targetPostId))}
            />
          ))
        )}
      </div>

      {/* Lightbox Photo Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.88)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            >
              <img
                src={getDirectImageUrl(lightboxImage)}
                onError={(e) => handleImageError(e, lightboxImage)}
                alt="Foto a pantalla completa"
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  borderRadius: '16px',
                  objectFit: 'contain',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              />
              <button
                onClick={() => setLightboxImage(null)}
                style={{
                  position: 'absolute',
                  top: '-16px',
                  right: '-16px',
                  background: 'var(--accent-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                <X size={18} />
              </button>
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
