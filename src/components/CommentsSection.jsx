import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Lightbulb, 
  ThumbsUp, 
  ChevronUp, 
  ChevronDown, 
  PlayCircle, 
  ExternalLink, 
  Link2, 
  X, 
  Search,
  Check
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
  serverTimestamp,
  setDoc,
  increment
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal, NoticeModal } from './ConfirmModal';
import { Link } from 'react-router-dom';
import { searchMatches, normalizeSearchText } from '../lib/searchHelper';
import { LiveUserAvatar } from './LiveUserAvatar';

/**
 * Parsea el texto del comentario para convertir automáticamente menciones como:
 * "video 1 de literatura", "clase 2 de biologia", "video 3"
 * en mini-enlaces interactivos directos a la grabación oficial.
 */
const renderParsedComment = (text, indexableVideos = []) => {
  if (!text) return text;
  if (!Array.isArray(indexableVideos) || indexableVideos.length === 0) return text;

  // Regex para detectar "video 1 de literatura", "clase 3 de quimica", "video 2", etc.
  const regex = /\b(video|clase)\s*#?(\d+)(?:\s+(?:de\s+)?([a-záéíóúñA-ZÁÉÍÓÚÑ]+))?\b/gi;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;
    const lessonNum = parseInt(match[2], 10);
    const courseKeyword = match[3] ? normalizeSearchText(match[3]) : '';

    if (matchIndex > lastIndex) {
      elements.push(text.substring(lastIndex, matchIndex));
    }

    // Buscar video coincidente en indexableVideos
    let matchedVideo = null;
    if (courseKeyword) {
      matchedVideo = indexableVideos.find(v => 
        normalizeSearchText(v.courseName).includes(courseKeyword) && v.lessonNumber === lessonNum
      );
    } else {
      matchedVideo = indexableVideos.find(v => v.lessonNumber === lessonNum);
    }

    if (matchedVideo && matchedVideo.url) {
      elements.push(
        <a
          key={`match-${matchIndex}`}
          href={matchedVideo.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Abrir ${matchedVideo.label || matchedVideo.title}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '8px',
            background: 'rgba(0, 122, 255, 0.12)',
            color: 'var(--accent-color)',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.82rem',
            margin: '0 3px',
            verticalAlign: 'baseline',
            boxShadow: '0 1px 4px rgba(0,122,255,0.1)'
          }}
        >
          <PlayCircle size={13} />
          <span>{matchedVideo.courseName || 'Clase'} · #{matchedVideo.lessonNumber || lessonNum}</span>
          <ExternalLink size={10} style={{ opacity: 0.6 }} />
        </a>
      );
    } else {
      elements.push(fullMatch);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
};

export const CommentsSection = ({ 
  targetId, 
  targetTitle = 'esta clase', 
  targetType = 'course', 
  promptHint = '¿Qué preguntas vinieron sobre este tema en tu simulacro o examen? ¡Comparte tus tips!',
  indexableVideos = [],
  initialOpen = true
}) => {
  const { user, userData, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(initialOpen);

  // Video Indexing Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    if (!targetId) return;

    try {
      const q = query(
        collection(db, 'clase_comentarios'),
        where('targetId', '==', targetId)
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
        console.warn("Could not listen to class comments:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Comments error:", e);
    }
  }, [targetId]);

  const filteredPickerVideos = useMemo(() => {
    if (!pickerSearch.trim()) return indexableVideos.slice(0, 30);
    return indexableVideos.filter(v => 
      searchMatches([v.courseName, v.title, v.label, `clase ${v.lessonNumber}`], pickerSearch)
    ).slice(0, 30);
  }, [indexableVideos, pickerSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const commentPayload = {
        targetId,
        targetType,
        authorUid: user.uid,
        authorName: user.displayName || 'Estudiante RUMBO',
        authorPhoto: user.photoURL || null,
        text: newComment.trim(),
        likes: 0,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      };

      if (selectedVideo) {
        commentPayload.videoTag = {
          videoId: selectedVideo.id,
          lessonNumber: selectedVideo.lessonNumber || null,
          title: selectedVideo.title || '',
          label: selectedVideo.label || selectedVideo.title || '',
          url: selectedVideo.url || ''
        };
      }

      await addDoc(collection(db, 'clase_comentarios'), commentPayload);
      setNewComment('');
      setSelectedVideo(null);
    } catch (err) {
      console.error("Error adding class comment:", err);
      setNoticeModal({ isOpen: true, title: "Error", message: "Error al publicar comentario: " + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId) => {
    setConfirmModal({
      isOpen: true,
      title: "Eliminar Comentario",
      message: "¿Deseas eliminar este comentario?",
      confirmText: "Sí, Eliminar",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'clase_comentarios', commentId));
        } catch (err) {
          console.error("Error deleting comment:", err);
          setNoticeModal({ isOpen: true, title: "Error", message: "No se pudo eliminar el comentario: " + err.message, type: 'error' });
        }
      }
    });
  };

  const handleLike = async (commentId) => {
    try {
      const cRef = doc(db, 'clase_comentarios', commentId);
      await setDoc(cRef, { likes: increment(1) }, { merge: true });
    } catch (e) {
      console.warn("Error liking comment:", e);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="glass-card" 
      style={{ 
        borderRadius: '24px', 
        border: '1.5px solid var(--card-border)',
        background: 'var(--card-bg)',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* ─── BARRA SUPERIOR CON BOTÓN DE OCULTAR/MOSTRAR ─── */}
      <div 
        style={{ 
          padding: '16px 22px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: isOpen ? '1px solid var(--card-border)' : 'none',
          background: 'linear-gradient(135deg, rgba(0,122,255,0.06), rgba(168,85,247,0.04))',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(0,122,255,0.14)',
            color: 'var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Foro & Preguntas Fijas
              </h3>
              <span style={{
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: comments.length > 0 ? 'rgba(0,122,255,0.15)' : 'rgba(120,120,128,0.12)',
                color: comments.length > 0 ? 'var(--accent-color)' : 'var(--text-secondary)'
              }}>
                {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Comparte fijas de simulacro, nemotecnias e indexa clases recomendadas.
            </p>
          </div>
        </div>

        {/* Botón de Ocultar / Mostrar Foro */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '14px',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease'
          }}
        >
          {isOpen ? (
            <>
              <ChevronUp size={16} /> Ocultar foro
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Ver foro ({comments.length})
            </>
          )}
        </button>
      </div>

      {/* ─── CONTENIDO EXPANDIBLE DEL FORO ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ padding: '20px 22px' }}
          >
            {/* Prompt Hint */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '14px',
              background: 'rgba(0,122,255,0.06)',
              border: '1px solid rgba(0,122,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <Lightbulb size={16} color="var(--accent-color)" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                💡 <strong>Tip RUMBO:</strong> Si escribes <em>"video 1 de literatura"</em> o <em>"clase 2 de biología"</em>, se convertirá automáticamente en un enlace directo al video. También puedes usar el botón <strong>"Vincular Clase"</strong>.
              </p>
            </div>

            {/* Input Box */}
            {user ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Escribe tu comentario o pregunta sobre ${targetTitle}... (ej. "En el video 1 de literatura explican los géneros...")`}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1.5px solid var(--card-border)',
                      background: 'rgba(120, 120, 128, 0.04)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Selected Indexed Video Chip */}
                {selectedVideo && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: 'rgba(0, 122, 255, 0.12)',
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    alignSelf: 'flex-start'
                  }}>
                    <PlayCircle size={15} color="var(--accent-color)" />
                    <span>Clase indexada: <strong style={{ color: 'var(--accent-color)' }}>{selectedVideo.label}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Button to Open Video Indexer Picker */}
                  {indexableVideos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(!isPickerOpen)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--card-border)',
                        background: isPickerOpen ? 'rgba(0, 122, 255, 0.12)' : 'rgba(120, 120, 128, 0.08)',
                        color: isPickerOpen ? 'var(--accent-color)' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Link2 size={15} />
                      <span className="hide-on-mobile">{selectedVideo ? 'Cambiar clase' : '📎 Indexar clase'}</span>
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '14px',
                      border: 'none',
                      background: newComment.trim() ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.2)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: newComment.trim() ? '0 4px 14px rgba(0,122,255,0.25)' : 'none'
                    }}
                  >
                    <Send size={15} />
                    <span className="hide-on-mobile">{submitting ? 'Publicando...' : 'Publicar'}</span>
                  </motion.button>
                </div>

                {/* Video Picker Modal / Dropdown */}
                {isPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '14px',
                      borderRadius: '16px',
                      background: 'var(--card-bg)',
                      border: '1.5px solid var(--card-border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      marginTop: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Selecciona la clase o video a vincular:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPickerOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder="Buscar materia o clase (ej. literatura, clase 1)..."
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 34px',
                          borderRadius: '10px',
                          border: '1px solid var(--card-border)',
                          background: 'rgba(120, 120, 128, 0.05)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredPickerVideos.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          No se encontraron clases con esa búsqueda.
                        </div>
                      ) : (
                        filteredPickerVideos.map(vid => (
                          <button
                            key={vid.id}
                            type="button"
                            onClick={() => {
                              setSelectedVideo(vid);
                              setIsPickerOpen(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              border: 'none',
                              background: selectedVideo?.id === vid.id ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                              color: 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.82rem',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <PlayCircle size={14} color="var(--accent-color)" />
                              {vid.label}
                            </span>
                            {selectedVideo?.id === vid.id && <Check size={14} color="var(--accent-color)" />}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </form>
            ) : (
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(120, 120, 128, 0.05)',
                border: '1px solid var(--card-border)',
                textAlign: 'center',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                marginBottom: '20px'
              }}>
                <Link to="/auth" style={{ color: 'var(--accent-color)', fontWeight: 700, textDecoration: 'none' }}>
                  Inicia sesión
                </Link> para dejar comentarios, fijas de simulacro o indexar clases.
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Aún no hay comentarios en este foro
                </p>
                <span style={{ fontSize: '0.84rem' }}>
                  Sé el primero en compartir qué temas o preguntas vinieron en tu simulacro.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {comments.map(c => {
                  const isMyComment = user && user.uid === c.authorUid;
                  const isUserAdmin = Boolean(
                    isAdmin || 
                    userData?.isAdmin || 
                    userData?.role === 'admin' ||
                    userData?.isCreator ||
                    (user?.email && isAuthorOfFirebase(user.email)) || 
                    (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
                  );
                  const canDelete = isMyComment || isUserAdmin;

                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '16px',
                        background: 'rgba(120, 120, 128, 0.04)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Link to={`/usuario/${c.authorUid}`} style={{ flexShrink: 0, textDecoration: 'none', display: 'inline-flex' }}>
                        <LiveUserAvatar 
                          uid={c.authorUid} 
                          fallbackName={c.authorName} 
                          fallbackPhoto={c.authorPhoto} 
                          size={36} 
                        />
                      </Link>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <Link to={`/usuario/${c.authorUid}`} style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                            {c.authorName}
                          </Link>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {formatDate(c.createdAt)}
                          </span>
                        </div>

                        {/* Comment text with Automatic Video Indexing */}
                        <div style={{ margin: '0 0 6px', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {renderParsedComment(c.text, indexableVideos)}
                        </div>

                        {/* Attached Indexed Video Mini-Card */}
                        {c.indexedVideo && c.indexedVideo.url && (
                          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                            <a 
                              href={c.indexedVideo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(234, 67, 53, 0.1), rgba(0, 122, 255, 0.1))',
                                border: '1px solid rgba(0, 122, 255, 0.25)',
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                transition: 'transform 0.15s ease'
                              }}
                            >
                              <PlayCircle size={16} color="#EA4335" />
                              <span>Clase indexada: <strong style={{ color: 'var(--accent-color)' }}>{c.indexedVideo.label || c.indexedVideo.title}</strong></span>
                              <ExternalLink size={12} style={{ opacity: 0.6 }} />
                            </a>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '4px' }}>
                          <button
                            onClick={() => handleLike(c.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <ThumbsUp size={12} /> {c.likes || 0} Útil
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ff3b30',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
