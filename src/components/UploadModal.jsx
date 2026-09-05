import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  X, 
  FileText, 
  Link as LinkIcon, 
  User, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck,
  Loader2,
  HardDrive,
  BookOpen,
  CheckCircle2,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { uploadFileReliable } from '../lib/storageHelper';

const CATEGORIES = [
  { id: 'tomos', label: 'Tomos y Libros', icon: BookOpen },
  { id: 'practicas', label: 'Prácticas', icon: FileText },
  { id: 'examenes', label: 'Exámenes Pasados', icon: CheckCircle2 },
  { id: 'resumenes', label: 'Resúmenes y Apuntes', icon: Sparkles },
  { id: 'variado', label: 'Variado', icon: Layers }
];

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const UploadModal = ({ isOpen, onClose, onUploadSuccess, initialSourceMode = 'link' }) => {
  const { user } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'uploading' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Source selection: 'link' | 'file'
  const [sourceMode, setSourceMode] = useState(initialSourceMode || 'link');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Custom Dropdown state for category
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen && initialSourceMode) {
      setSourceMode(initialSourceMode);
    }
  }, [isOpen, initialSourceMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('tomos');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('tomos');
    setUrl('');
    setDesc('');
    setSelectedFile(null);
    setUploadProgress(0);
    setSourceMode(initialSourceMode || 'link');
    setError(null);
    setStep('form');
    setIsCategoryOpen(false);
  };

  const handleClose = () => {
    if (step !== 'uploading') {
      resetForm();
      onClose();
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Por favor completa el título del material.');
      return;
    }
    if (sourceMode === 'link' && !url.trim()) {
      setError('Por favor ingresa el enlace de Drive o Web.');
      return;
    }
    if (sourceMode === 'file' && !selectedFile) {
      setError('Por favor selecciona un archivo.');
      return;
    }
    setError(null);
    handleConfirmUpload();
  };

  const handleConfirmUpload = async () => {
    setStep('uploading');
    setLoading(true);
    setError(null);
    setUploadProgress(10);

    try {
      let finalUrl = url.trim();
      let fileMeta = null;

      // Handle Device File Upload
      if (sourceMode === 'file' && selectedFile) {
        setUploadProgress(25);
        fileMeta = {
          name: selectedFile.name,
          size: formatFileSize(selectedFile.size),
          mimeType: selectedFile.type
        };

        finalUrl = await uploadFileReliable(selectedFile, (progress) => {
          setUploadProgress(progress);
        }, category);
        setUploadProgress(90);
      } else {
        // Link mode smooth progress
        setUploadProgress(50);
        await new Promise(r => setTimeout(r, 300));
        setUploadProgress(90);
      }

      const categoriaObj = CATEGORIES.find(c => c.id === category);
      const categoriaLabel = categoriaObj ? categoriaObj.label : 'Tomos y Libros';

      // 1. Prepare data for Firestore
      const uploadData = {
        title: title.trim(),
        author: author.trim() || (user?.displayName || 'Anónimo'),
        category: category,
        categoriaLabel: categoriaLabel,
        type: sourceMode === 'file' 
          ? (selectedFile?.type?.includes('pdf') ? 'pdf' : (selectedFile?.type?.includes('image') ? 'imagen' : 'archivo')) 
          : 'drive',
        sourceMode: sourceMode,
        url: finalUrl,
        desc: desc.trim(),
        fileMeta: fileMeta,
        uploadedBy: {
          uid: user ? user.uid : 'anonimo',
          name: user ? (user.displayName || user.email || 'Aliado') : 'Usuario RUMBO',
          email: user?.email || '',
          photoURL: user?.photoURL || null
        },
        status: 'aprobado',
        reportsCount: 0,
        enRevision: false,
        oculto: false,
        createdAt: serverTimestamp()
      };

      // 2. Save in Firestore 'uploads' collection
      await addDoc(collection(db, 'uploads'), uploadData);
      setUploadProgress(100);

      // 3. Increment user's upload count if logged in
      if (user?.uid) {
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const newCount = (userSnap.data().uploadCount || 0) + 1;
          await updateDoc(userRef, {
            uploadCount: increment(1),
            isAlly: newCount >= 10 ? true : (userSnap.data().isAlly || false)
          });
        } else {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Aliado RUMBO',
            photoURL: user.photoURL || null,
            uploadCount: 1,
            isAlly: false,
            createdAt: serverTimestamp()
          });
        }
      }

      setTimeout(() => {
        setLoading(false);
        setStep('success');
        if (onUploadSuccess) onUploadSuccess();
      }, 500);

    } catch (err) {
      console.error("Error al publicar aporte:", err);
      setError(err.message || 'Error al guardar el aporte. Intenta de nuevo.');
      setStep('form');
      setLoading(false);
    }
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const CurrentCategoryIcon = currentCategoryObj.icon;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 11000,
          padding: '16px'
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          style={{
            width: '100%',
            maxWidth: '540px',
            maxHeight: '96vh',
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '28px',
            padding: '22px 24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.45)',
            color: 'var(--text-main)',
            position: 'relative',
            boxSizing: 'border-box'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {step !== 'uploading' && (
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(120, 120, 128, 0.15)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={16} />
            </button>
          )}

          {/* ──────────────── STEP 1: FORM (DISEÑO COMPACTO Y ALINEADO CON CUSTOM DROPDOWN) ──────────────── */}
          {step === 'form' && (
            <div>
              {/* Header super compacto */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-flex',
                  padding: '10px',
                  borderRadius: '16px',
                  background: 'rgba(0, 122, 255, 0.12)',
                  color: 'var(--accent-color)',
                  marginBottom: '8px'
                }}>
                  <UploadCloud size={24} />
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main)' }}>
                  Aportar Material a RUMBO
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                  Comparte libros, prácticas o carpetas con la comunidad
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 59, 48, 0.12)',
                  color: '#ff3b30',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px'
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleInitialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 📌 FILA 1: Título (Lado Izquierdo) + Custom Categoría Dropdown (Lado Derecho) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '10px', alignItems: 'start' }}>
                  {/* Título del Material */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Título del Material *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Banco Álgebra 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid var(--card-border)',
                        background: 'rgba(120, 120, 128, 0.08)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>

                  {/* 🌟 Custom Dropdown de Categoría Estilo Apple iOS */}
                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Categoría *
                    </label>
                    
                    {/* Selected Box */}
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        border: isCategoryOpen ? '1.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                        background: 'rgba(120, 120, 128, 0.08)',
                        color: 'var(--text-main)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        boxShadow: isCategoryOpen ? '0 0 0 3px rgba(0, 122, 255, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                        <CurrentCategoryIcon size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentCategoryObj.label}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isCategoryOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '4px' }}
                      >
                        <ChevronDown size={15} />
                      </motion.div>
                    </button>

                    {/* Animated Dropdown Menu */}
                    <AnimatePresence>
                      {isCategoryOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 4, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            left: 0,
                            zIndex: 200,
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '16px',
                            padding: '6px',
                            boxShadow: '0 16px 36px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setCategory(cat.id);
                                  setIsCategoryOpen(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '10px',
                                  border: 'none',
                                  background: isSelected ? 'rgba(0, 122, 255, 0.14)' : 'transparent',
                                  color: isSelected ? 'var(--accent-color)' : 'var(--text-main)',
                                  fontWeight: isSelected ? 700 : 600,
                                  fontSize: '0.84rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Icon size={15} style={{ color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)' }} />
                                  <span>{cat.label}</span>
                                </div>
                                {isSelected && <Check size={14} style={{ color: 'var(--accent-color)' }} />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 📌 FILA 2: Autor / Créditos */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Autor Original o Crédito (Opcional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Ej. Profesor Jaime / Academia / Tu Nombre"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '14px',
                        border: '1.5px solid var(--card-border)',
                        background: 'rgba(120, 120, 128, 0.08)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 📌 FILA 3: Relato o Descripción del Material */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Relato o Descripción del Material (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe qué contiene este aporte, temas clave, año..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'rgba(120, 120, 128, 0.08)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 📌 FILA 4: 🔁 Selector de Método de Aporte (ABAJO DE LA DESCRIPCIÓN) */}
                <div style={{ paddingTop: '4px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Método de Aporte *
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    padding: '4px',
                    background: 'rgba(120, 120, 128, 0.12)',
                    borderRadius: '16px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setSourceMode('link')}
                      style={{
                        padding: '9px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        background: sourceMode === 'link' ? 'var(--accent-color)' : 'transparent',
                        color: sourceMode === 'link' ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: sourceMode === 'link' ? '0 4px 12px rgba(0, 122, 255, 0.3)' : 'none'
                      }}
                    >
                      <LinkIcon size={15} /> Enlace de Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceMode('file')}
                      style={{
                        padding: '9px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        background: sourceMode === 'file' ? 'var(--accent-color)' : 'transparent',
                        color: sourceMode === 'file' ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: sourceMode === 'file' ? '0 4px 12px rgba(0, 122, 255, 0.3)' : 'none'
                      }}
                    >
                      <HardDrive size={15} /> Subir Archivo (Todo tipo)
                    </button>
                  </div>
                </div>

                {/* 📌 FILA 5: Campo dinámico según el Método Seleccionado */}
                {sourceMode === 'file' ? (
                  <div>
                    <div
                      style={{
                        position: 'relative',
                        border: selectedFile ? '2px solid var(--accent-color)' : '2px dashed var(--card-border)',
                        borderRadius: '16px',
                        padding: '14px 12px',
                        textAlign: 'center',
                        background: selectedFile ? 'rgba(0, 122, 255, 0.06)' : 'rgba(120, 120, 128, 0.05)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('device-file-input')?.click()}
                    >
                      <input
                        id="device-file-input"
                        type="file"
                        accept="*/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            if (!title.trim()) {
                              const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                              setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                            }
                          }
                        }}
                      />

                      {selectedFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          <FileText size={22} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {selectedFile.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {formatFileSize(selectedFile.size)} • <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Cambiar</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <UploadCloud size={20} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            Toca para subir cualquier tipo de archivo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      required={sourceMode === 'link'}
                      placeholder="https://drive.google.com/... o enlace de descarga"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid var(--card-border)',
                        background: 'rgba(120, 120, 128, 0.08)',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Botón de Publicar */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  style={{
                    marginTop: '4px',
                    padding: '13px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--accent-color)',
                    color: '#fff',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 18px rgba(0, 122, 255, 0.3)'
                  }}
                >
                  Subir y Publicar Material <UploadCloud size={17} />
                </motion.button>
              </form>

              {/* 🏆 Mini Anuncio Aliado ultracompacto */}
              <div style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(239, 148, 190, 0.1), rgba(168, 85, 247, 0.1))',
                border: '1px solid rgba(239, 148, 190, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Sparkles size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  <strong style={{ color: 'var(--text-main)' }}>¿Quieres ser Aliado Oficial?</strong> Sube 10 materiales para desbloquear tu tarjeta pública y canal de WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: CONFIRM MODAL ──────────────── */}
          {step === 'confirm' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '10px 0' }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(0, 122, 255, 0.12)',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <ShieldCheck size={30} />
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
                ¿Confirmas enviar este material?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
                Revisa los detalles antes de publicarlo:
              </p>

              {/* Summary Card */}
              <div style={{
                textAlign: 'left',
                background: 'rgba(120, 120, 128, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>Título:</strong>
                  <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>{title}</div>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>Categoría:</strong>
                  <div style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
                    {currentCategoryObj.label}
                  </div>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>Crédito / Autor:</strong>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{author || 'No especificado (Se asignará tu cuenta)'}</div>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>Modo:</strong>
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '6px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--accent-color)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {sourceMode === 'file' ? 'ARCHIVO LOCAL' : 'ENLACE / DRIVE'}
                  </span>
                </div>

                {sourceMode === 'file' && selectedFile ? (
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>Archivo:</strong>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-all' }}>
                      📄 {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>Enlace:</strong>
                    <div style={{ color: 'var(--accent-color)', wordBreak: 'break-all', fontSize: '0.82rem' }}>{url}</div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  Volver a editar
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleConfirmUpload}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'var(--accent-color)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    boxShadow: '0 6px 16px rgba(0, 122, 255, 0.25)'
                  }}
                >
                  Confirmar y Subir
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ──────────────── STEP 3: UPLOADING ANIMATION ──────────────── */}
          {step === 'uploading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '30px 10px' }}
            >
              <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 18px' }}>
                <Loader2 size={64} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
                {sourceMode === 'file' ? 'Subiendo archivo...' : 'Registrando enlace en RUMBO...'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                {sourceMode === 'file' 
                  ? `Guardando "${selectedFile?.name}" y sumando créditos.`
                  : 'Conectando con servidores RUMBO...'}
              </p>

              {/* Real percentage readout */}
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                color: 'var(--accent-color)', 
                marginBottom: '8px' 
              }}>
                {uploadProgress}% completado
              </div>

              {/* Solid Accent Color Progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(120, 120, 128, 0.15)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: '10%' }}
                  animate={{ width: `${Math.max(10, uploadProgress)}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                  style={{
                    height: '100%',
                    background: 'var(--accent-color)',
                    boxShadow: '0 0 12px var(--accent-color)',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* ──────────────── STEP 4: SUCCESS WITH ELABORATE ANIMATED CHECKMARK & CELEBRATION ──────────────── */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              style={{ textAlign: 'center', padding: '24px 10px', position: 'relative' }}
            >
              {/* Floating Sparkles & Particles Animation */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                  { top: '15%', left: '20%', delay: 0.2, color: '#34C759' },
                  { top: '10%', right: '22%', delay: 0.3, color: 'var(--accent-color)' },
                  { top: '45%', left: '12%', delay: 0.4, color: '#FF9500' },
                  { top: '40%', right: '15%', delay: 0.35, color: '#AF52DE' },
                  { bottom: '25%', left: '25%', delay: 0.5, color: '#34C759' },
                  { bottom: '20%', right: '25%', delay: 0.45, color: 'var(--accent-color)' }
                ].map((pt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, y: 15 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0.3, 1.2, 0.8], 
                      y: [-5, -20, -35],
                      x: [0, (i % 2 === 0 ? -10 : 10)]
                    }}
                    transition={{ 
                      duration: 1.8, 
                      delay: pt.delay, 
                      ease: 'easeOut',
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    style={{
                      position: 'absolute',
                      top: pt.top,
                      left: pt.left,
                      right: pt.right,
                      bottom: pt.bottom,
                      color: pt.color
                    }}
                  >
                    <Sparkles size={16} />
                  </motion.div>
                ))}
              </div>

              {/* Elaborate Multi-Layered Checkmark Circle */}
              <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 18px' }}>
                {/* Outer Expanding Pulse Ring 1 */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: [0.6, 1.45], opacity: [0.8, 0] }}
                  transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.8 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '3px solid #34C759',
                    pointerEvents: 'none'
                  }}
                />

                {/* Outer Expanding Pulse Ring 2 */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: [0.6, 1.7], opacity: [0.6, 0] }}
                  transition={{ duration: 1.4, delay: 0.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '2px dashed var(--accent-color)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Main Spring Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 220, delay: 0.1 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(48, 209, 88, 0.3))',
                    border: '2px solid rgba(52, 199, 89, 0.4)',
                    boxShadow: '0 12px 30px rgba(52, 199, 89, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="56" height="56" viewBox="0 0 90 90">
                    <motion.circle
                      cx="45"
                      cy="45"
                      r="38"
                      fill="none"
                      stroke="#34C759"
                      strokeWidth="5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M 28 46 L 39 57 L 62 34"
                      fill="none"
                      stroke="#34C759"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              </div>

              <motion.h3 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}
              >
                ¡Material Publicado con Éxito! 🎉
              </motion.h3>

              <motion.p 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.45 }}
              >
                Tu aporte ya está activo en RUMBO. Se han sumado tus créditos para convertirte en <strong>Aliado Oficial</strong>.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                style={{
                  padding: '13px 32px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'var(--accent-color)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0, 122, 255, 0.3)'
                }}
              >
                Cerrar y Ver Material
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
