import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Folder, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Share2, 
  MessageCircle, 
  Trash2, 
  Clock, 
  Send,
  AlertTriangle
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
import { LiveUserAvatar, LiveUserName } from './LiveUserAvatar';
import { BookmarkButton } from './BookmarkButton';
import { getDirectImageUrl, getDriveThumbnailUrl } from '../lib/storageHelper';

const POST_EMOJIS = ['❤️', '🔥', '⭐'];
const SUBCOMMENT_EMOJIS = ['👍', '👎', '❤️', '🔥'];

// Helper to reliably identify images (including Google Drive uploads, direct links, and file metadata)
export const isImageItem = (item) => {
  if (!item) return false;
  const mime = (item.fileMeta?.mimeType || '').toLowerCase();
  const name = (item.fileMeta?.name || '').toLowerCase();
  const url = (item.url || '').toLowerCase();
  const title = (item.title || '').toLowerCase();

  // If explicitly PDF or folder, it's not an image
  if (item.type === 'pdf' || mime.includes('pdf') || name.match(/\.pdf($|\?)/i) || url.match(/\.pdf($|\?|&)/i)) {
    return false;
  }
  if (item.type === 'drive' && (url.includes('/folders/') || url.includes('folderview'))) {
    return false;
  }

  if (item.type === 'imagen' || item.type === 'image') return true;
  if (mime.includes('image') || mime.includes('png') || mime.includes('jpeg') || mime.includes('jpg') || mime.includes('webp')) return true;
  if (url.startsWith('data:image/') || url.startsWith('blob:')) return true;
  if (url.includes('firebasestorage.googleapis.com')) return true;
  if (url.match(/\.(jpeg|jpg|png|webp|gif|bmp|svg)($|\?|&)/i)) return true;
  if (name.match(/\.(jpeg|jpg|png|webp|gif|bmp|svg)($|\?)/i)) return true;
  if (title.match(/\.(jpeg|jpg|png|webp|gif|bmp|svg)($|\?)/i)) return true;
  return false;
};

export const getDrivePreviewUrl = (url) => {
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

export const CommunityUploadCard = ({
  item,
  user,
  isAdmin,
  onReport,
  onDelete,
  getPreviewUrl,
  setNoticeModal,
  setLightboxImage
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [subComments, setSubComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authorUid = item.uploadedBy?.uid || item.authorUid;
  const authorName = item.uploadedBy?.name || item.author || 'Estudiante RUMBO';
  const authorPhoto = item.uploadedBy?.photoURL;
  const canDelete = user && (user.uid === authorUid || isAdmin);
  const isImage = isImageItem(item);
  const isFolder = item.type === 'drive' || item.url?.includes('/folders/') || item.url?.includes('folderview');
  const previewUrl = getDrivePreviewUrl(item.url) || (getPreviewUrl ? getPreviewUrl(item.url) : item.url);

  // Escuchar comentarios vinculados a esta publicación (publicacion_comentarios)
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
        console.warn("Error subcomments in Biblioteca:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Setup subcomments error:", e);
    }
  }, [item.id]);

  // Reacciones directas en la publicación (❤️ 🔥 ⭐)
  const handleToggleReaction = async (emoji) => {
    if (!user) {
      if (setNoticeModal) {
        setNoticeModal({ isOpen: true, title: "Inicia Sesión", message: "Debes iniciar sesión para reaccionar a esta publicación.", type: 'info' });
      }
      return;
    }

    const docRef = doc(db, 'uploads', item.id);
    const currentReactions = item.reactions || {};
    const currentEmojiUsers = Array.isArray(currentReactions[emoji]) ? currentReactions[emoji] : [];
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

      if (!hasReacted && authorUid && user.uid !== authorUid) {
        await addDoc(collection(db, 'notificaciones'), {
          recipientUid: authorUid,
          senderUid: user.uid,
          senderName: user.displayName || 'Estudiante RUMBO',
          senderPhoto: user.photoURL || null,
          type: 'reaction',
          postId: item.id,
          profileUid: authorUid,
          postTitle: item.title || 'Material de Biblioteca',
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

  // Reacciones en un comentario
  const handleToggleSubCommentReaction = async (subCommentId, currentReactions = {}, emoji) => {
    if (!user) return;
    const docRef = doc(db, 'publicacion_comentarios', subCommentId);
    const currentUsers = Array.isArray(currentReactions[emoji]) ? currentReactions[emoji] : [];
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

  // Enviar comentario
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const text = newCommentText.trim();
      await addDoc(collection(db, 'publicacion_comentarios'), {
        postId: item.id,
        postAuthorUid: authorUid || '',
        profileUid: authorUid || '',
        authorUid: user.uid,
        authorName: user.displayName || 'Estudiante RUMBO',
        authorPhoto: user.photoURL || null,
        text: text,
        reactions: {},
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      if (authorUid && user.uid !== authorUid) {
        await addDoc(collection(db, 'notificaciones'), {
          recipientUid: authorUid,
          senderUid: user.uid,
          senderName: user.displayName || 'Estudiante RUMBO',
          senderPhoto: user.photoURL || null,
          type: 'comment',
          postId: item.id,
          profileUid: authorUid,
          postTitle: item.title || 'Material de Biblioteca',
          message: `comentó en tu material: "${text.slice(0, 45)}"`,
          read: false,
          createdAt: serverTimestamp(),
          timestamp: Date.now()
        });
      }

      setNewCommentText('');
      setShowComments(true);
    } catch (err) {
      console.error("Error al publicar comentario:", err);
      if (setNoticeModal) {
        setNoticeModal({ isOpen: true, title: "Error", message: "No se pudo guardar el comentario: " + err.message, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'publicacion_comentarios', commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.title, url: item.url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.url);
      if (setNoticeModal) {
        setNoticeModal({ isOpen: true, title: "¡Enlace Copiado!", message: "El enlace del material ha sido copiado al portapapeles.", type: 'success' });
      }
    }
  };

  const visibleComments = showAllComments ? subComments : subComments.slice(-2);

  return (
    <motion.div
      id={`library-card-${item.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="ios-glass-card"
      style={{
        padding: '20px',
        borderRadius: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1.5px solid rgba(0, 122, 255, 0.25)',
        background: 'rgba(0, 122, 255, 0.03)',
        boxShadow: 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* ─── POST HEADER (Igual al muro del Perfil) ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to={authorUid ? `/usuario/${authorUid}` : '#'} style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <LiveUserAvatar 
              uid={authorUid} 
              fallbackName={authorName} 
              fallbackPhoto={authorPhoto} 
              size={44} 
            />
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to={authorUid ? `/usuario/${authorUid}` : '#'}
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                  textDecoration: 'none'
                }}
              >
                <LiveUserName uid={authorUid} fallbackName={authorName} />
              </Link>
              <span style={{
                padding: '2px 8px',
                borderRadius: '99px',
                background: item.isOfficial ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))' : 'rgba(0,122,255,0.14)',
                color: item.isOfficial ? '#D97706' : 'var(--accent-color)',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: item.isOfficial ? '1px solid #F59E0B' : 'none'
              }}>
                {item.isOfficial ? '👑 OFICIAL' : (item.categoriaLabel || item.category || '📚 Aporte RUMBO')}
              </span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Clock size={12} /> {formatDate(item.createdAt)}
              {item.fileMeta?.size && <span>• {item.fileMeta.size}</span>}
            </span>
          </div>
        </div>

        {/* Top Actions: Delete / Report */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(item)}
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
              onClick={() => onReport(item.id, item.title, 'material')}
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

      {/* ─── POST BODY (Título y Descripción) ─── */}
      <div style={{ marginTop: '2px' }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {item.title}
        </h4>
        {item.author && item.author !== authorName && (
          <div style={{ fontSize: '0.82rem', color: 'var(--accent-color)', fontWeight: 700, marginBottom: '6px' }}>
            ✍️ Autor Original / Crédito: <strong>{item.author}</strong>
          </div>
        )}
        {(item.desc || item.description) && (
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {item.desc || item.description}
          </p>
        )}
      </div>

      {/* ─── MEDIA PREVIEW DIRECTO (ESTILO PERFIL / FACEBOOK) ─── */}
      {item.url && (
        <div style={{ marginTop: '6px' }}>
          {isImage ? (
            <div
              onClick={() => {
                if (setLightboxImage) {
                  setLightboxImage(item.url);
                } else {
                  window.open(item.url, '_blank');
                }
              }}
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
                alt={item.title}
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
              {isPreviewOpen && (
                <div style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2px solid rgba(0, 122, 255, 0.4)',
                  height: isFolder ? '440px' : '520px',
                  maxWidth: '480px',
                  margin: '4px auto 8px auto',
                  background: '#FFFFFF',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.15)'
                }}>
                  <iframe
                    src={previewUrl}
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

      {/* ─── ACCIONES DEL MATERIAL (Abrir, Vista Previa, Compartir, Guardar, Comentar) ─── */}
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

        {!isImage && (
          <button
            onClick={() => setIsPreviewOpen(prev => !prev)}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid var(--card-border)',
              background: isPreviewOpen ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
              color: 'var(--accent-color)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 700
            }}
          >
            <Eye size={14} /> {isPreviewOpen ? 'Ocultar Vista Previa' : 'Vista Previa'}
          </button>
        )}

        <button
          onClick={handleShare}
          title="Compartir recurso"
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'rgba(120, 120, 128, 0.08)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.84rem',
            fontWeight: 700
          }}
        >
          <Share2 size={14} /> Compartir
        </button>

        <BookmarkButton item={item} size="small" showText={true} />

        <button
          onClick={() => setShowComments(prev => !prev)}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: showComments ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
            color: showComments ? 'var(--accent-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <MessageCircle size={14} /> Comentarios ({subComments.length})
        </button>
      </div>

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
          const userList = Array.isArray(item.reactions?.[emoji]) ? item.reactions[emoji] : [];
          const count = userList.length;
          const hasReacted = user && userList.includes(user.uid);

          return (
            <button
              key={emoji}
              onClick={() => handleToggleReaction(emoji)}
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
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: '6px',
              padding: '12px 14px',
              borderRadius: '16px',
              background: 'rgba(120, 120, 128, 0.04)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
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
            {visibleComments.map(c => {
              const canDeleteSub = user && (user.uid === c.authorUid || user.uid === authorUid || isAdmin);

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
                          {formatDate(c.createdAt || c.timestamp)}
                        </span>
                        {canDeleteSub && (
                          <button
                            onClick={() => handleDeleteSubComment(c.id)}
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

                    <p style={{ margin: '4px 0 6px', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                      {c.text}
                    </p>

                    {/* Sub-comment Emoji Reactions */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {SUBCOMMENT_EMOJIS.map(emoji => {
                        const uList = Array.isArray(c.reactions?.[emoji]) ? c.reactions[emoji] : [];
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
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
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
                  disabled={!newCommentText.trim() || isSubmitting}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: newCommentText.trim() ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '6px' }}>
                <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>Inicia sesión</Link> para comentar en esta publicación.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
