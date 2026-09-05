import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Folder, 
  Download, 
  Flag, 
  Users, 
  Eye, 
  EyeOff, 
  Plus, 
  ExternalLink, 
  UploadCloud,
  Sparkles,
  Search,
  CheckCircle,
  Share2,
  MessageSquare
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal';
import { UploadModal } from '../components/UploadModal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmModal, NoticeModal } from '../components/ConfirmModal';
import { InspirationalDailyBanner } from '../components/InspirationalDailyBanner';
import { ReactionsBar } from '../components/ReactionsBar';
import { CommentsSection } from '../components/CommentsSection';
import { BookmarkButton } from '../components/BookmarkButton';
import { LiveUserAvatar, LiveUserName } from '../components/LiveUserAvatar';
import { ADMIN_EMAILS, isAuthorOfFirebase } from '../context/AuthContext';
import { TOMOS, PRACTICAS } from '../data/legacyData';
import { searchMatches } from '../lib/searchHelper';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, increment, query, orderBy } from 'firebase/firestore';

export const Biblioteca = () => {
  const [mainTab, setMainTab] = useState('documentos'); // 'documentos' | 'comunidad'
  const [activeDocTab, setActiveDocTab] = useState('tomos'); // 'tomos' | 'practicas'
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, title: '' });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successContent, setSuccessContent] = useState({ title: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab === 'comunidad' || location.search.includes('tab=comunidad')) {
      setMainTab('comunidad');
    }
  }, [location]);

  // Preview toggle state: dictionary of id -> boolean
  const [expandedPreviews, setExpandedPreviews] = useState({});
  const [expandedFileComments, setExpandedFileComments] = useState({});

  const toggleFileComments = (id) => {
    setExpandedFileComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Live community uploads from Firestore
  const [communityUploads, setCommunityUploads] = useState([]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'uploads'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id, firestoreId: d.id }));
        // Filter out items with >= 3 reports or marked hidden / oculto
        const visibleDocs = docs.filter(item => (!item.oculto && !item.hidden && (item.reportsCount || 0) < 3));

        // 👑 PRIORIDAD MÁXIMA VIP PARA EL CREADOR / ADMINISTRADOR
        visibleDocs.sort((a, b) => {
          const aIsAdmin = a.isOfficial || a.uploadedBy?.isCreator || a.uploadedBy?.isAdmin || isAuthorOfFirebase(a.uploadedBy?.email) || (a.uploadedBy?.email && ADMIN_EMAILS.includes(a.uploadedBy.email.toLowerCase()));
          const bIsAdmin = b.isOfficial || b.uploadedBy?.isCreator || b.uploadedBy?.isAdmin || isAuthorOfFirebase(b.uploadedBy?.email) || (b.uploadedBy?.email && ADMIN_EMAILS.includes(b.uploadedBy.email.toLowerCase()));
          if (aIsAdmin && !bIsAdmin) return -1;
          if (!aIsAdmin && bIsAdmin) return 1;
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });

        setCommunityUploads(visibleDocs);
      }, (err) => {
        console.warn("Firestore uploads listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not subscribe to uploads:", e);
    }
  }, []);

  const togglePreview = (id) => {
    setExpandedPreviews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const handleReportCommunityItem = (itemId, title) => {
    setConfirmModal({
      isOpen: true,
      title: "Reportar Material",
      message: `¿Deseas reportar "${title}"? Al acumular reportes pasará a revisión de moderación.`,
      confirmText: "Sí, Reportar",
      onConfirm: async () => {
        try {
          const itemRef = doc(db, 'uploads', itemId);
          await updateDoc(itemRef, {
            reportsCount: increment(1),
            enRevision: true
          });

          setSuccessContent({
            title: '¡Reporte Enviado!',
            message: 'Gracias por tu reporte. El material ha pasado a revisión técnica.'
          });
          setIsSuccessOpen(true);
        } catch (e) {
          setNoticeModal({ isOpen: true, title: "Error", message: "Error al reportar: " + e.message, type: 'error' });
        }
      }
    });
  };

  // Convert Drive link or Folder link to embed preview link if possible
  const getPreviewUrl = (url) => {
    if (!url) return null;

    // 1. Google Drive Single File Preview (PDF, Docs, Sheets, etc.)
    const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveFileMatch && driveFileMatch[1]) {
      return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
    }

    // 2. Google Drive Folder Embedded View (List view of folder contents for full text readability)
    const folderMatch = url.match(/(?:\/folders\/|folderview\?id=|open\?id=)([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
    }

    // 3. Direct PDF url fallback
    if (url.match(/\.pdf$/i)) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return url;
  };

  const filteredCommunity = communityUploads.filter(item => {
    return searchMatches([item.title, item.author, item.desc, item.category], searchQuery);
  });

  const filteredTomos = TOMOS.filter(tomo => {
    return searchMatches([tomo[0], tomo[1]], searchQuery);
  });

  const filteredPracticas = PRACTICAS.filter(practica => {
    return searchMatches([practica.titulo || practica[0], practica.descripcion || practica[1]], searchQuery);
  });

  return (
    <div className="page-container" style={{ paddingBottom: '120px' }}>
      {/* Frase / Versículo del Día */}
      <InspirationalDailyBanner />

      {/* Hero Header */}
      <header className="library-hero" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
          Biblioteca Digital RUMBO
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
          Tomos, libros y bancos de preguntas oficiales compartidos por estudiantes y docentes.
        </p>

        {/* Main Tab Switcher */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMainTab('documentos')}
            style={{ 
              padding: '14px 28px', 
              borderRadius: '20px', 
              fontWeight: 800, 
              fontSize: '0.98rem',
              border: mainTab === 'documentos' ? 'none' : '1.5px solid var(--card-border)',
              background: mainTab === 'documentos' ? 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)' : 'var(--card-bg)',
              color: mainTab === 'documentos' ? '#FFFFFF' : 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: mainTab === 'documentos' ? '0 8px 24px rgba(0, 122, 255, 0.35)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            📚 Material Oficial ({filteredTomos.length + filteredPracticas.length})
          </motion.button>

          {/* BOTÓN IRRESISTIBLE: Aportes de la Comunidad */}
          <motion.button 
            whileHover={{ scale: 1.06, boxShadow: '0 12px 32px rgba(245, 158, 11, 0.55), 0 0 25px rgba(236, 72, 153, 0.55)' }}
            whileTap={{ scale: 0.95 }}
            animate={mainTab !== 'comunidad' ? { scale: [1, 1.03, 1] } : {}}
            transition={mainTab !== 'comunidad' ? { repeat: Infinity, duration: 2.8, ease: 'easeInOut' } : { duration: 0.2 }}
            onClick={() => setMainTab('comunidad')}
            style={{ 
              position: 'relative',
              padding: '14px 28px', 
              borderRadius: '20px', 
              fontWeight: 900, 
              fontSize: '1rem',
              border: mainTab === 'comunidad' ? 'none' : '2px solid #F59E0B',
              background: mainTab === 'comunidad' 
                ? 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%)' 
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(236, 72, 153, 0.18) 100%)',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: mainTab === 'comunidad' 
                ? '0 10px 30px rgba(245, 158, 11, 0.5), 0 4px 20px rgba(236, 72, 153, 0.4)' 
                : '0 6px 22px rgba(245, 158, 11, 0.3), inset 0 0 12px rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.25s ease',
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
              letterSpacing: '0.01em'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🤝</span>
            <span>Aportes de la Comunidad ({filteredCommunity.length})</span>
            <span style={{
              background: 'linear-gradient(135deg, #FFE066, #FF512F)',
              color: '#000000',
              fontSize: '0.72rem',
              fontWeight: 900,
              padding: '3px 9px',
              borderRadius: '12px',
              textShadow: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              letterSpacing: '0.03em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              🔥 APUNTES ✨
            </span>
          </motion.button>
        </div>

        {/* Banner Interactivo y Llamativo: Aportes de la Comunidad / Aliados */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(245, 158, 11, 0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMainTab('comunidad')}
          style={{
            maxWidth: '740px',
            margin: '20px auto 0',
            padding: '16px 22px',
            borderRadius: '22px',
            background: mainTab === 'comunidad' 
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.24) 0%, rgba(236, 72, 153, 0.24) 100%)' 
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
            border: '2px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            cursor: 'pointer',
            boxShadow: '0 6px 22px rgba(245, 158, 11, 0.2)',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
            <span style={{ fontSize: '1.6rem' }}>💡</span>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '0.96rem', color: 'var(--text-main)', display: 'block' }}>
                ¡Comunidad & Aliados activos compartiendo material! ✨
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Encuentra resúmenes, exámenes, guías de práctica y apuntes valiosos.
              </span>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setMainTab('comunidad'); }}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B, #EC4899)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)',
              letterSpacing: '0.02em'
            }}
          >
            🔥 Toca para ver Material ➔
          </button>
        </motion.div>

        {/* Global Accent-Insensitive Search Bar */}
        <div style={{ position: 'relative', maxWidth: '640px', margin: '24px auto 0' }}>
          <Search size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-color)' }} />
          <input
            type="text"
            placeholder="🔍 Buscar tomo, libro, práctica, tema o autor (sin importar tildes o mayúsculas)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '15px 44px 15px 48px',
              borderRadius: '20px',
              border: '1.5px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 6px 20px rgba(0,0,0,0.04)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(120,120,128,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* ──────────────── SECTION 1: MATERIAL OFICIAL ──────────────── */}
      {mainTab === 'documentos' && (
        <>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveDocTab('tomos')}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '999px', 
                fontWeight: 800, 
                border: activeDocTab === 'tomos' ? 'none' : '1px solid rgba(255, 59, 48, 0.3)',
                background: activeDocTab === 'tomos' ? 'linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%)' : 'var(--card-bg)',
                color: activeDocTab === 'tomos' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: activeDocTab === 'tomos' ? '0 6px 18px rgba(255, 59, 48, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              📕 Tomos Académicos ({filteredTomos.length})
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveDocTab('practicas')}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '999px', 
                fontWeight: 800, 
                border: activeDocTab === 'practicas' ? 'none' : '1px solid rgba(52, 199, 89, 0.3)',
                background: activeDocTab === 'practicas' ? 'linear-gradient(135deg, #34C759 0%, #30D158 100%)' : 'var(--card-bg)',
                color: activeDocTab === 'practicas' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: activeDocTab === 'practicas' ? '0 6px 18px rgba(52, 199, 89, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              📗 Prácticas y Exámenes ({filteredPracticas.length})
            </motion.button>
          </div>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '22px' }}>
            <AnimatePresence mode="popLayout">
              {activeDocTab === 'tomos' ? (
                filteredTomos.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                      No se encontraron tomos para "{searchQuery}". Puedes buscar en "Prácticas" o en "Aportes de la Comunidad".
                    </p>
                  </div>
                ) : (
                  filteredTomos.map((tomo, idx) => {
                    const title = tomo[0];
                    const tomoId = `official-tomo-${(title || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || idx}`;
                    const desc = tomo[1];
                    const link = tomo[2];
                    const previewUrl = getPreviewUrl(link);
                    const isPreviewOpen = !!expandedPreviews[tomoId];

                    return (
                      <motion.div 
                        key={tomoId} 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="glass-card" 
                        style={{ 
                          padding: '22px', 
                          borderRadius: '24px', 
                          position: 'relative', 
                          display: 'flex', 
                          flexDirection: 'column',
                          border: '1.5px solid rgba(255, 59, 48, 0.25)',
                          boxShadow: '0 10px 26px rgba(255, 59, 48, 0.08)',
                          gridColumn: isPreviewOpen ? '1 / -1' : 'auto'
                        }}
                      >
                        {/* Encabezado e Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255, 59, 48, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText color="#FF3B30" size={22} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              👑 Material Oficial CEPRE / UNSA
                            </span>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{title}</h3>
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px', lineHeight: 1.5, flex: 1 }}>{desc}</p>

                        {/* Banner Recuadro de Vista Previa Responsive */}
                        <div 
                          onClick={() => togglePreview(tomoId)}
                          style={{
                            width: '100%',
                            height: '140px',
                            borderRadius: '16px',
                            border: isPreviewOpen ? '2px solid #FF3B30' : '1.5px solid var(--card-border)',
                            background: 'rgba(0,0,0,0.85)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            marginBottom: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          title="Toca para ver / ocultar vista previa interactiva"
                        >
                          {previewUrl ? (
                            <iframe
                              src={previewUrl}
                              title={title}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                pointerEvents: 'none',
                                background: '#ffffff',
                                opacity: 0.9
                              }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
                              <FileText size={36} />
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            padding: '10px'
                          }}>
                            <span style={{
                              background: isPreviewOpen ? '#FF3B30' : 'rgba(0,0,0,0.85)',
                              color: '#ffffff',
                              padding: '5px 14px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                              backdropFilter: 'blur(8px)'
                            }}>
                              {isPreviewOpen ? '✕ Cerrar Vista Previa' : '👁️ Vista Previa Interactiva'}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción (Abrir en Drive + Guardar) */}
                        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                          <button 
                            onClick={() => window.open(link, '_blank')}
                            style={{ 
                              flex: 1,
                              padding: '12px 18px', 
                              background: 'linear-gradient(135deg, #FF3B30, #FF5252)', 
                              color: '#FFFFFF', 
                              border: 'none', 
                              borderRadius: '14px', 
                              fontWeight: 800, 
                              fontSize: '0.88rem',
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              gap: '8px', 
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(255, 59, 48, 0.3)'
                            }}
                          >
                            <ExternalLink size={16} /> Abrir en Drive
                          </button>
                          <BookmarkButton
                            item={{
                              id: tomoId,
                              title: title,
                              desc: desc,
                              driveUrl: link,
                              category: 'teoria',
                              author: 'CEPRE / UNSA'
                            }}
                            size="normal"
                            showText={false}
                          />
                        </div>

                        {/* Barra de Reacciones Instantánea */}
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 59, 48, 0.15)',
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <ReactionsBar
                            targetId={tomoId}
                            targetType="tomo"
                            size="small"
                          />
                        </div>

                        {/* Contenedor expandible de la Vista Previa completa */}
                        <AnimatePresence>
                          {isPreviewOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ overflow: 'hidden', marginTop: '16px' }}
                            >
                              <div style={{
                                borderRadius: '18px',
                                overflow: 'hidden',
                                border: '2px solid rgba(255, 59, 48, 0.4)',
                                height: '460px',
                                background: '#ffffff',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.18)'
                              }}>
                                {previewUrl ? (
                                  <iframe
                                    src={previewUrl}
                                    title={title}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                  />
                                ) : (
                                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    Vista previa no disponible directamente. Usa "Abrir en Drive".
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )
              ) : (
                filteredPracticas.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                      No se encontraron prácticas para "{searchQuery}". Puedes buscar en "Tomos Académicos" o en "Aportes de la Comunidad".
                    </p>
                  </div>
                ) : (
                  filteredPracticas.map((practica, idx) => {
                    const title = practica.titulo || practica[0];
                    const practicaId = `official-practica-${(title || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || idx}`;
                    const desc = practica.descripcion || practica[1];
                    const link = practica.carpeta || practica[2];
                    const previewUrl = getPreviewUrl(link);
                    const isPreviewOpen = !!expandedPreviews[practicaId];

                    return (
                      <motion.div 
                        key={practicaId} 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="glass-card" 
                        style={{ 
                          padding: '22px', 
                          borderRadius: '24px', 
                          position: 'relative', 
                          display: 'flex', 
                          flexDirection: 'column',
                          border: '1.5px solid rgba(52, 199, 89, 0.25)',
                          boxShadow: '0 10px 26px rgba(52, 199, 89, 0.08)',
                          gridColumn: isPreviewOpen ? '1 / -1' : 'auto'
                        }}
                      >
                        {/* Encabezado e Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(52, 199, 89, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText color="#34C759" size={22} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34C759', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              📗 Práctica Oficial / Banco de Preguntas
                            </span>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{title}</h3>
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px', lineHeight: 1.5, flex: 1 }}>{desc}</p>

                        {/* Banner Recuadro de Vista Previa Responsive */}
                        <div 
                          onClick={() => togglePreview(practicaId)}
                          style={{
                            width: '100%',
                            height: '140px',
                            borderRadius: '16px',
                            border: isPreviewOpen ? '2px solid #34C759' : '1.5px solid var(--card-border)',
                            background: 'rgba(0,0,0,0.85)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            marginBottom: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          title="Toca para ver / ocultar vista previa interactiva"
                        >
                          {previewUrl ? (
                            <iframe
                              src={previewUrl}
                              title={title}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                pointerEvents: 'none',
                                background: '#ffffff',
                                opacity: 0.9
                              }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759' }}>
                              <FileText size={36} />
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            padding: '10px'
                          }}>
                            <span style={{
                              background: isPreviewOpen ? '#34C759' : 'rgba(0,0,0,0.85)',
                              color: '#ffffff',
                              padding: '5px 14px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                              backdropFilter: 'blur(8px)'
                            }}>
                              {isPreviewOpen ? '✕ Cerrar Vista Previa' : '👁️ Vista Previa Interactiva'}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción (Abrir en Drive + Guardar) */}
                        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                          <button 
                            onClick={() => window.open(link, '_blank')}
                            style={{ 
                              flex: 1,
                              padding: '12px 18px', 
                              background: 'linear-gradient(135deg, #34C759, #30D158)', 
                              color: '#FFFFFF', 
                              border: 'none', 
                              borderRadius: '14px', 
                              fontWeight: 800, 
                              fontSize: '0.88rem',
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              gap: '8px', 
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(52, 199, 89, 0.3)'
                            }}
                          >
                            <ExternalLink size={16} /> Abrir en Drive
                          </button>
                          <BookmarkButton
                            item={{
                              id: practicaId,
                              title: title,
                              desc: desc,
                              driveUrl: link,
                              category: 'practicas',
                              author: 'CEPRE / UNSA'
                            }}
                            size="normal"
                            showText={false}
                          />
                        </div>

                        {/* Barra de Reacciones Instantánea */}
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(52, 199, 89, 0.15)',
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <ReactionsBar
                            targetId={practicaId}
                            targetType="practica"
                            size="small"
                          />
                        </div>

                        {/* Contenedor expandible de la Vista Previa completa */}
                        <AnimatePresence>
                          {isPreviewOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ overflow: 'hidden', marginTop: '16px' }}
                            >
                              <div style={{
                                borderRadius: '18px',
                                overflow: 'hidden',
                                border: '2px solid rgba(52, 199, 89, 0.4)',
                                height: '460px',
                                background: '#ffffff',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.18)'
                              }}>
                                {previewUrl ? (
                                  <iframe
                                    src={previewUrl}
                                    title={title}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                  />
                                ) : (
                                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    Vista previa no disponible directamente. Usa "Abrir en Drive".
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )
              )}
            </AnimatePresence>
          </section>
        </>
      )}

      {/* ──────────────── SECTION 2: APORTES DE LA COMUNIDAD ──────────────── */}
      {mainTab === 'comunidad' && (
        <section style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Top action banner */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main)' }}>
                Material Compartido por Aliados y Estudiantes 🌟
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Revisa los recursos con vista previa interactiva o aporta el tuyo.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsUploadOpen(true)}
              style={{
                padding: '14px 22px',
                borderRadius: '16px',
                border: 'none',
                background: 'var(--accent-color)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(0,122,255,0.25)'
              }}
            >
              <UploadCloud size={20} /> Aportar Material
            </motion.button>
          </div>


          {/* Uploads List */}
          {filteredCommunity.length === 0 ? (
            <div className="glass-card" style={{ padding: '50px 20px', textAlign: 'center', borderRadius: '24px' }}>
              <Sparkles size={40} style={{ color: 'var(--accent-color)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
                Sé el primero en compartir
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Aún no hay aportes con esa búsqueda. Comparte tus prácticas o notas para ayudar a otros.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'var(--accent-color)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Subir Aporte Ahora
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredCommunity.map((item) => {
                const isPreviewOpen = !!expandedPreviews[item.id];
                const previewUrl = getPreviewUrl(item.url);
                const isFolder = item.type === 'drive' || item.url?.includes('/folders/');

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="glass-card"
                    style={{
                      padding: '24px',
                      borderRadius: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {/* Layout de 2 columnas: Datos a la izquierda, Mini Recuadro de Vista Previa a la derecha */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      {/* Columna Izquierda: Información del Aporte */}
                      <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Header line */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isFolder ? (
                              <div style={{
                                padding: '10px',
                                borderRadius: '12px',
                                background: 'rgba(251, 188, 5, 0.15)',
                                color: '#FBBC05',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Folder size={22} />
                              </div>
                            ) : (
                              <div style={{
                                padding: '10px',
                                borderRadius: '12px',
                                background: 'rgba(0, 122, 255, 0.15)',
                                color: 'var(--accent-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FileText size={22} />
                              </div>
                            )}

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                                  {item.title}
                                </h3>
                                {(item.isOfficial || item.uploadedBy?.isCreator || item.uploadedBy?.isAdmin || isAuthorOfFirebase(item.uploadedBy?.email) || (item.uploadedBy?.email && ADMIN_EMAILS.includes(item.uploadedBy.email.toLowerCase()))) && (
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
                                    border: '1.5px solid #F59E0B',
                                    color: '#D97706',
                                    fontSize: '0.75rem',
                                    fontWeight: 800
                                  }}>
                                    👑 MATERIAL OFICIAL RUMBO / CREADOR
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                  <span>✍️ Subido por:</span>
                                  <LiveUserAvatar
                                    uid={item.uploadedBy?.uid}
                                    fallbackName={item.author || item.uploadedBy?.name || 'Comunidad'}
                                    fallbackPhoto={item.uploadedBy?.photoURL}
                                    fallbackFrame={(item.isOfficial || item.uploadedBy?.isCreator || item.uploadedBy?.isAdmin || isAuthorOfFirebase(item.uploadedBy?.email) || (item.uploadedBy?.email && ADMIN_EMAILS.includes(item.uploadedBy.email.toLowerCase()))) ? 'fuego_creador' : 'carmesi'}
                                    size={30}
                                  />
                                  {item.uploadedBy?.uid ? (
                                    <Link
                                      to={`/usuario/${item.uploadedBy.uid}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.85rem',
                                        color: 'var(--accent-color)',
                                        textDecoration: 'none',
                                        fontWeight: 700,
                                        background: 'rgba(0,122,255,0.1)',
                                        padding: '2px 10px',
                                        borderRadius: '10px'
                                      }}
                                      title="Ver perfil y muro de este usuario"
                                    >
                                      <LiveUserName uid={item.uploadedBy?.uid} fallbackName={item.author || item.uploadedBy?.name || 'Comunidad'} /> ↗
                                    </Link>
                                  ) : (
                                    <strong style={{ color: 'var(--text-main)' }}>
                                      <LiveUserName uid={item.uploadedBy?.uid} fallbackName={item.author || item.uploadedBy?.name || 'Comunidad'} />
                                    </strong>
                                  )}
                                </div>

                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  color: '#D97706',
                                  fontWeight: 700,
                                  background: 'rgba(245, 158, 11, 0.14)',
                                  padding: '3px 10px',
                                  borderRadius: '10px',
                                  border: '1.5px solid rgba(245, 158, 11, 0.25)'
                                }}>
                                  ⭐ Usuario con {item.uploadedBy?.totalReactionsReceived || (item.reactions ? Object.values(item.reactions).reduce((a, b) => a + (Array.isArray(b) ? b.length : (Number(b) || 0)), 0) : 15)} valoraciones
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Badges & Report */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.sourceMode === 'file' && (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: 'rgba(52, 199, 89, 0.15)',
                                color: '#28A745',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}>
                                💾 DISPOSITIVO {item.fileMeta?.size ? `(${item.fileMeta.size})` : ''}
                              </span>
                            )}

                            {isFolder && (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: 'rgba(251, 188, 5, 0.15)',
                                color: '#D97706',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}>
                                📁 CARPETA DRIVE
                              </span>
                            )}

                            <button
                              onClick={() => {
                                setReportTarget({ id: item.id, title: item.title });
                                setIsReportOpen(true);
                              }}
                              title="Reportar link caído o inapropiado"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#EF4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              <Flag size={13} /> Reportar
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {item.desc && (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                            "{item.desc}"
                          </p>
                        )}

                        {/* Action buttons (Preview & Open Link) */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '10px 18px',
                              borderRadius: '12px',
                              background: 'var(--accent-color)',
                              color: '#fff',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(0,122,255,0.2)'
                            }}
                          >
                            <ExternalLink size={16} /> {item.sourceMode === 'file' ? 'Descargar / Abrir Archivo' : 'Abrir Recurso'}
                          </a>

                          <button
                            onClick={() => togglePreview(item.id)}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '12px',
                              border: '1.5px solid var(--card-border)',
                              background: isPreviewOpen ? 'rgba(120, 120, 128, 0.12)' : 'var(--card-bg)',
                              color: 'var(--text-main)',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {isPreviewOpen ? <EyeOff size={16} /> : <Eye size={16} />}
                            {isPreviewOpen ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
                          </button>

                          <BookmarkButton item={item} size="small" />
                        </div>
                      </div>

                      {/* Columna Derecha: MINI RECUADRO CON LA VISTA PREVIA REAL (Iframe / Imagen real) */}
                      <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => togglePreview(item.id)}
                        style={{
                          width: '140px',
                          height: '175px',
                          borderRadius: '16px',
                          border: isPreviewOpen ? '2.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                          background: 'rgba(0,0,0,0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          margin: '0 auto'
                        }}
                        title="Toca para expandir / ocultar la vista previa completa"
                      >
                        {/* Etiqueta flotante superior si es una carpeta */}
                        {isFolder && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            zIndex: 12,
                            background: 'rgba(217, 119, 6, 0.95)',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backdropFilter: 'blur(4px)'
                          }}>
                            📁 CARPETA
                          </div>
                        )}

                        {/* Renderizado de la Vista Previa Real */}
                        {item.url?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : previewUrl ? (
                          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
                            <iframe
                              src={previewUrl}
                              title={item.title}
                              style={{
                                width: '560px',
                                height: '700px',
                                border: 'none',
                                transform: 'scale(0.25)',
                                transformOrigin: 'top left',
                                pointerEvents: 'none',
                                background: '#ffffff'
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#ffffff' }}>
                            {isFolder ? <Folder size={34} color="#F59E0B" /> : <FileText size={34} color="var(--accent-color)" />}
                            <div style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 700 }}>
                              {isFolder ? 'Carpeta Drive' : 'Vista Previa'}
                            </div>
                          </div>
                        )}

                        {/* Etiqueta flotante inferior para expandir / cerrar */}
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: isPreviewOpen ? 'var(--accent-color)' : 'rgba(0, 0, 0, 0.75)',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backdropFilter: 'blur(8px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          zIndex: 10
                        }}>
                          {isPreviewOpen ? <EyeOff size={11} /> : <Eye size={11} />}
                          {isPreviewOpen ? 'Ocultar' : 'Ampliar 🔍'}
                        </div>
                      </motion.div>
                    </div>

                    {/* Reactions Bar & File Comments Toggle on every community upload */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--card-border)'
                    }}>
                      <ReactionsBar
                        targetId={item.id}
                        targetType="upload"
                        authorUid={item.uploadedBy?.uid}
                        initialReactions={item.reactions}
                        size="small"
                      />

                      <button
                        onClick={() => toggleFileComments(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '12px',
                          border: expandedFileComments[item.id] ? '1.5px solid var(--accent-color)' : '1px solid var(--card-border)',
                          background: expandedFileComments[item.id] ? 'rgba(0,122,255,0.12)' : 'rgba(120, 120, 128, 0.08)',
                          color: expandedFileComments[item.id] ? 'var(--accent-color)' : 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Ver comentarios o preguntar sobre este archivo"
                      >
                        <MessageSquare size={14} color="var(--accent-color)" />
                        <span>Comentarios del archivo</span>
                        <span style={{
                          background: expandedFileComments[item.id] ? 'var(--accent-color)' : 'rgba(120,120,128,0.18)',
                          color: expandedFileComments[item.id] ? '#ffffff' : 'var(--text-secondary)',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {expandedFileComments[item.id] ? 'Ocultar ▲' : 'Comentar 👇'}
                        </span>
                      </button>
                    </div>

                    {/* Expandable File Comments Drawer */}
                    <AnimatePresence>
                      {expandedFileComments[item.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden', marginTop: '10px' }}
                        >
                          <CommentsSection
                            targetId={`upload-${item.id}`}
                            targetTitle={`Archivo: ${item.title}`}
                            targetType="upload"
                            promptHint={`¿Tienes alguna consulta o aporte sobre "${item.title}"? Escribe aquí 👇`}
                            initialOpen={true}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expandable Embedded Preview (Drive/PDF/Folders/Images) */}
                    <AnimatePresence>
                      {isPreviewOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            marginTop: '12px',
                            borderRadius: '18px',
                            overflow: 'hidden',
                            border: '1.5px solid var(--card-border)',
                            background: '#000000'
                          }}
                        >
                          <div style={{
                            padding: '10px 16px',
                            background: 'rgba(30, 30, 30, 0.9)',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>
                              {isFolder ? '📁 Explorador de Carpeta Google Drive' : 'Visualizador Seguro RUMBO'} {item.fileMeta?.size ? `• ${item.fileMeta.size}` : ''}
                            </span>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}>
                              {isFolder ? 'Abrir carpeta en Drive ↗' : 'Abrir pestaña completa ↗'}
                            </a>
                          </div>

                          {item.fileMeta?.mimeType?.includes('image') || item.type === 'imagen' ? (
                            <div style={{ padding: '16px', textAlign: 'center', background: '#0a0a0a' }}>
                              <img src={item.url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '12px' }} />
                            </div>
                          ) : (
                            <iframe
                              src={previewUrl}
                              title={item.title}
                              style={{
                                width: '100%',
                                height: isFolder ? '480px' : '420px',
                                border: 'none',
                                display: 'block',
                                background: '#ffffff'
                              }}
                              allow="autoplay"
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={() => {
          setIsSuccessOpen(true);
          setSuccessContent({
            title: '¡Aporte Publicado!',
            message: 'Tu material ya está disponible para toda la comunidad.'
          });
        }} 
      />

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
        targetType="material"
      />

      <SuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => setIsSuccessOpen(false)} 
        title={successContent.title} 
        message={successContent.message} 
      />

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
