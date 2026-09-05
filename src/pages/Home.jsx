import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Library, 
  Cpu, 
  Info, 
  FileText, 
  UploadCloud, 
  HardDrive, 
  Link as LinkIcon, 
  Sparkles,
  User,
  Shield,
  CheckCircle,
  Share2,
  ArrowRight,
  Loader2,
  MessageCircle,
  ExternalLink,
  Check,
  Folder,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  ChevronRight,
  Layers,
  Lock,
  Zap,
  Target,
  Trophy,
  Flame,
  Edit3,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { InspirationalDailyBanner } from '../components/InspirationalDailyBanner';
import { AliadosCarousel, WhatsAppIconSVG, TikTokIconSVG } from '../components/AliadosCarousel';
import { LiveUserAvatar } from '../components/LiveUserAvatar';
import { UploadModal } from '../components/UploadModal';
import { SuccessModal } from '../components/SuccessModal';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { useAuth, isAuthorOfFirebase } from '../context/AuthContext';
import { uploadFileReliable } from '../lib/storageHelper';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const Home = () => {
  const { user, isAdmin } = useAuth();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successContent, setSuccessContent] = useState({ title: '', message: '' });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Tabs: 'material' (Subida de Material) | 'aliado' (Ser Aliado)
  const [formTab, setFormTab] = useState('material');

  // Material Form State (del index anterior, enriquecido y fiel)
  const [matTitle, setMatTitle] = useState('');
  const [matCategory, setMatCategory] = useState('tomos'); // 'tomos' | 'practicas' | 'examenes' | 'resumenes'
  const [matAuthor, setMatAuthor] = useState('');
  const [matSourceMode, setMatSourceMode] = useState('link'); // 'link' | 'file'
  const [matUrl, setMatUrl] = useState('');
  const [matFile, setMatFile] = useState(null);
  const [matDesc, setMatDesc] = useState('');
  const [matLoading, setMatLoading] = useState(false);
  const [matProgress, setMatProgress] = useState(0);
  const [isMatConfirmOpen, setIsMatConfirmOpen] = useState(false);

  // Aliado Form State
  const [allyName, setAllyName] = useState(user?.displayName || '');
  const [allyWhatsapp, setAllyWhatsapp] = useState('');
  const [allyTiktok, setAllyTiktok] = useState('');
  const [allyPhone, setAllyPhone] = useState('');
  const [allySubject, setAllySubject] = useState('');
  const [allyDesc, setAllyDesc] = useState('');
  const [allyLoading, setAllyLoading] = useState(false);
  const [savedAllyCard, setSavedAllyCard] = useState(() => {
    try {
      const saved = localStorage.getItem('rumbo_ally_card');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userUploads, setUserUploads] = useState(() => {
    try {
      const saved = localStorage.getItem('rumbo_user_uploads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rumbo_user_uploads', JSON.stringify(userUploads));
  }, [userUploads]);

  // Dynamic motto animation: "al conocimiento", "a tu ingreso", "al éxito", "a tu meta", "al futuro"
  const MOTTO_PHRASES = [
    { text: 'conocimiento.', color: '#007AFF', bg: 'rgba(0, 122, 255, 0.12)' },
    { text: 'tu ingreso.', color: '#34C759', bg: 'rgba(52, 199, 89, 0.12)' },
    { text: 'tu éxito.', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.12)' },
    { text: 'tu meta.', color: '#AF52DE', bg: 'rgba(175, 82, 222, 0.12)' },
    { text: 'tu futuro.', color: '#FF2D55', bg: 'rgba(255, 45, 85, 0.12)' }
  ];
  const [mottoIndex, setMottoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMottoIndex((prev) => (prev + 1) % MOTTO_PHRASES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [MOTTO_PHRASES.length]);

  // Load user's saved Ally card from their Google/Firestore user account
  useEffect(() => {
    if (!user?.uid) return;
    const fetchUserAccountAlly = async () => {
      try {
        const userRef = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const u = snap.data();
          if (u.displayName && !allyName) setAllyName(u.displayName);
          if (u.whatsappChannel) setAllyWhatsapp(u.whatsappChannel);
          if (u.tiktokUrl) setAllyTiktok(u.tiktokUrl);
          if (u.phone) setAllyPhone(u.phone);
          if (u.specialty || u.subject) setAllySubject(u.specialty || u.subject);
          if (u.allyDesc || u.desc) setAllyDesc(u.allyDesc || u.desc);
          if (u.allyCard) setSavedAllyCard(u.allyCard);
        }
      } catch (e) {
        console.warn("User account ally fetch notice:", e);
      }
    };
    fetchUserAccountAlly();
  }, [user?.uid]);

  // Handlers
  const requestMaterialConfirmation = (e) => {
    e.preventDefault();
    if (!matTitle.trim()) {
      alert('Por favor completa el nombre del material.');
      return;
    }
    if (!matUrl.trim()) {
      alert('Por favor ingresa el enlace de Google Drive.');
      return;
    }
    setIsMatConfirmOpen(true);
  };

  const executeMaterialUpload = async () => {
    setIsMatConfirmOpen(false);
    setMatLoading(true);
    setMatProgress(15);

    try {
      let finalUrl = matUrl.trim();
      let fileMeta = null;

      if (matSourceMode === 'file' && matFile) {
        setMatProgress(25);
        fileMeta = {
          name: matFile.name,
          size: formatFileSize(matFile.size),
          mimeType: matFile.type
        };

        finalUrl = await uploadFileReliable(matFile, (progress) => {
          setMatProgress(progress);
        });
      }

      setMatProgress(95);

      const categoriaLabel = matCategory === 'tomos' 
        ? 'Tomos y Libros' 
        : (matCategory === 'practicas' 
          ? 'Prácticas' 
          : (matCategory === 'examenes' 
            ? 'Exámenes Pasados' 
            : (matCategory === 'variado' 
              ? 'Variado' 
              : 'Resúmenes y Apuntes')));

      const newUpload = {
        title: matTitle.trim(),
        author: matAuthor.trim() || (user?.displayName || 'Anónimo'),
        category: matCategory,
        categoriaLabel: categoriaLabel,
        url: finalUrl,
        desc: matDesc.trim(),
        sourceMode: matSourceMode,
        fileMeta: fileMeta,
        type: matSourceMode === 'file' 
          ? (matFile?.type?.includes('pdf') ? 'pdf' : (matFile?.type?.includes('image') ? 'imagen' : 'archivo')) 
          : 'drive',
        status: 'aprobado',
        reportsCount: 0,
        enRevision: false,
        oculto: false,
        uploadedBy: {
          uid: user ? user.uid : 'anonimo',
          name: user ? (user.displayName || user.email) : 'Usuario RUMBO'
        },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'uploads'), newUpload);
      setMatProgress(100);

      // Increment user counter
      if (user?.uid) {
        try {
          const userRef = doc(db, 'usuarios', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const newCount = (userSnap.data().uploadCount || 0) + 1;
            await updateDoc(userRef, {
              uploadCount: increment(1),
              isAlly: newCount >= 10 ? true : (userSnap.data().isAlly || false)
            });
          }
        } catch (e) {
          console.warn("User counter update:", e);
        }
      }

      setUserUploads([{
        title: matTitle.trim(),
        author: matAuthor.trim(),
        category: matCategory,
        driveUrl: finalUrl,
        desc: matDesc.trim()
      }, ...userUploads]);

      setMatTitle('');
      setMatAuthor('');
      setMatUrl('');
      setMatFile(null);
      setMatDesc('');

      setTimeout(() => {
        setMatLoading(false);
        setSuccessContent({
          title: '¡Aporte Publicado con Éxito! 🎉',
          message: 'Tu material ha sido subido a la biblioteca comunitaria de RUMBO con su respectiva confirmación y créditos.'
        });
        setIsSuccessOpen(true);
      }, 400);

    } catch (err) {
      console.warn("Save fallback locally:", err);
      setUserUploads([{
        title: matTitle.trim(),
        author: matAuthor.trim(),
        category: matCategory,
        driveUrl: matUrl.trim(),
        desc: matDesc.trim()
      }, ...userUploads]);
      setMatLoading(false);
      setSuccessContent({
        title: '¡Aporte Guardado!',
        message: 'Tu material ha sido registrado con éxito.'
      });
      setIsSuccessOpen(true);
    }
  };

  const handleEditPersonalAllyCard = () => {
    if (!savedAllyCard) return;
    setAllyName(savedAllyCard.name || '');
    setAllyWhatsapp(savedAllyCard.whatsappChannel || '');
    setAllyTiktok(savedAllyCard.tiktokUrl || '');
    setAllyPhone(savedAllyCard.phone || '');
    setAllySubject(savedAllyCard.subject || '');
    setAllyDesc(savedAllyCard.desc || '');
    setFormTab('aliado');
    const element = document.getElementById('home-forms-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAllySubmit = async (e) => {
    e.preventDefault();
    if (!allyName.trim() || !allyWhatsapp.trim()) {
      alert('Por favor ingresa tu nombre y tu canal de WhatsApp.');
      return;
    }

    const isUserAdmin = Boolean(isAdmin || isAuthorOfFirebase(user?.email) || user?.email?.includes('aguilar.jonsu'));

    let currentUploadCount = userUploads.length;
    if (user?.uid) {
      try {
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          currentUploadCount = Math.max(userSnap.data().uploadCount || 0, userUploads.length);
        }
      } catch (errSnap) {
        console.warn("User snap error:", errSnap);
      }
    }

    const isApproved = isUserAdmin || currentUploadCount >= 10;

    // Si NO es Admin/Creador y NO cumple con los 10 aportes, se notifica y NO se bloquea la UI en estado de carga
    if (!isUserAdmin && currentUploadCount < 10) {
      setSuccessContent({
        title: 'Aún no cumples la meta de +10 Aportes 📚',
        message: `Actualmente cuentas con ${currentUploadCount} de 10 materiales compartidos. Para activar y publicar tu Tarjeta de Aliado RUMBO en el carrusel principal, necesitas haber aportado al menos 10 materiales a la comunidad. ¡Sigue compartiendo contenido en la pestaña "Subir Material"!`
      });
      setIsSuccessOpen(true);
      return;
    }

    setAllyLoading(true);

    try {
      const allyData = {
        name: allyName.trim(),
        whatsappChannel: allyWhatsapp.trim(),
        tiktokUrl: allyTiktok.trim(),
        phone: allyPhone.trim(),
        subject: allySubject.trim(),
        desc: allyDesc.trim(),
        uid: user?.uid || 'admin-creator',
        email: user?.email || 'aguilar.jonsu@gmail.com',
        uploadCount: isUserAdmin ? 99 : currentUploadCount,
        status: 'aprobado',
        isCreator: isUserAdmin,
        updatedAt: serverTimestamp()
      };

      try {
        const solQuery = query(collection(db, 'solicitudes_aliados'), where('uid', '==', user?.uid || 'admin-creator'));
        const solSnap = await getDocs(solQuery);
        if (!solSnap.empty) {
          solSnap.docs.forEach(async (d) => {
            await updateDoc(doc(db, 'solicitudes_aliados', d.id), allyData);
          });
        } else {
          await addDoc(collection(db, 'solicitudes_aliados'), { ...allyData, createdAt: serverTimestamp() });
        }
      } catch (eAdd) {
        console.warn("Firestore add/update warning:", eAdd);
      }

      if (user?.uid) {
        try {
          const userRef = doc(db, 'usuarios', user.uid);
          await setDoc(userRef, {
            displayName: allyName.trim(),
            whatsappChannel: allyWhatsapp.trim(),
            tiktokUrl: allyTiktok.trim(),
            phone: allyPhone.trim(),
            allyDesc: allyDesc.trim(),
            specialty: allySubject.trim(),
            isAlly: true
          }, { merge: true });
        } catch (eSet) {
          console.warn("Firestore setDoc warning:", eSet);
        }
      }

      const cardData = {
        name: allyName.trim(),
        whatsappChannel: allyWhatsapp.trim(),
        tiktokUrl: allyTiktok.trim(),
        phone: allyPhone.trim(),
        subject: allySubject.trim(),
        desc: allyDesc.trim(),
        isApproved: true,
        uploadCount: isUserAdmin ? 99 : currentUploadCount
      };
      setSavedAllyCard(cardData);
      localStorage.setItem('rumbo_ally_card', JSON.stringify(cardData));

      setAllyLoading(false);

      setSuccessContent({
        title: isUserAdmin ? '¡Perfil de Creador / Aliado Guardado! 👑' : '¡Tarjeta de Aliado Activada! ⭐',
        message: isUserAdmin 
          ? 'Como Creador & Administrador de RUMBO, tu perfil de Aliado se ha activado inmediatamente con máxima prioridad en el carrusel de la página.'
          : `¡Felicitaciones! Cumples con la meta de +10 aportes comunitarios (${currentUploadCount} materiales compartidos). Tu tarjeta de Aliado RUMBO ya está activa y visible públicamente en el carrusel.`
      });
      setIsSuccessOpen(true);

    } catch (err) {
      console.warn("Ally registration catch:", err);
      const cardData = {
        name: allyName.trim(),
        whatsappChannel: allyWhatsapp.trim(),
        tiktokUrl: allyTiktok.trim(),
        phone: allyPhone.trim(),
        subject: allySubject.trim(),
        desc: allyDesc.trim(),
        isApproved: true,
        uploadCount: 99
      };
      setSavedAllyCard(cardData);
      localStorage.setItem('rumbo_ally_card', JSON.stringify(cardData));
      setAllyLoading(false);
      setSuccessContent({
        title: '¡Perfil de Creador Activado! 👑',
        message: 'Tu tarjeta de Creador / Aliado RUMBO ha sido guardada y activada con éxito.'
      });
      setIsSuccessOpen(true);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <header className="hero-section" style={{ padding: '40px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '980px', margin: '0 auto' }}
        >
          {/* Tarjeta de Bienvenida a RUMBO estilo referencia */}
          <div 
            className="home-hero-card"
            style={{
              background: 'var(--card-bg)',
              border: '1.5px solid var(--card-border)',
              borderRadius: '28px',
              padding: '36px 36px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* Gradiente sutil decorativo de fondo */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(239, 148, 190, 0.08) 60%, transparent 80%)',
              pointerEvents: 'none'
            }} />

            {/* Mascota / Logo RUMBO */}
            <motion.div 
              className="hero-mascot-wrapper"
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              style={{
                flexShrink: 0,
                width: '150px',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '30px',
                padding: '10px'
              }}
            >
              <img 
                src="./assets/LOGOR.png" 
                alt="RUMBO Mascota" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 24px rgba(0, 122, 255, 0.25))'
                }} 
              />
            </motion.div>

            {/* Contenido Textual */}
            <div className="hero-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px', width: '100%' }}>
              
              {/* Badge superior */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 16px',
                  borderRadius: '20px',
                  border: '1.5px solid rgba(239, 148, 190, 0.4)',
                  background: 'rgba(239, 148, 190, 0.12)',
                  color: '#EF94BE',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  ¡BIENVENIDO A RUMBO!
                </span>
              </div>

              {/* Título Principal con Frases Animadas en Colores Vibrantes */}
              <h1 style={{
                fontSize: 'clamp(1.7rem, 4vw, 2.5rem)',
                fontWeight: 900,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>Tu camino hacia</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center',
                  minHeight: '44px',
                  overflow: 'hidden'
                }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={mottoIndex}
                      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      style={{
                        color: MOTTO_PHRASES[mottoIndex].color,
                        background: MOTTO_PHRASES[mottoIndex].bg,
                        padding: '2px 12px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}
                    >
                      {MOTTO_PHRASES[mottoIndex].text}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>

              {/* Subtítulo descriptivo */}
              <p style={{
                margin: 0,
                fontSize: '0.94rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                maxWidth: '640px'
              }}>
                Plataforma creada para acompañar tu preparación académica preuniversitaria. Organizada y centralizada en un solo lugar.
              </p>

              {/* Recuadro Centrado de Términos y Condiciones / Aviso Legal */}
              <div style={{
                width: '100%',
                maxWidth: '680px',
                background: 'rgba(120, 120, 128, 0.06)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <Shield size={18} style={{ color: '#007AFF', flexShrink: 0 }} />
                  <span>
                    RUMBO organiza y recopila recursos académicos de libre acceso en un solo lugar.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <Check size={18} style={{ color: '#34C759', flexShrink: 0 }} />
                  <span>
                    Los materiales pertenecen a sus respectivos autores. <strong style={{ color: '#FF3B30' }}>Prohibido lucrar o comercializar.</strong>
                  </span>
                </div>
              </div>

              {/* Botones / Pastillas de Términos y Libre Uso Centrados */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 59, 48, 0.08)',
                  border: '1.5px solid rgba(255, 59, 48, 0.25)',
                  boxShadow: '0 4px 12px rgba(255, 59, 48, 0.06)'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    background: 'rgba(255, 59, 48, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF3B30',
                    flexShrink: 0
                  }}>
                    <Lock size={15} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Uso Libre y Gratuito
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: '#FF3B30', fontWeight: 800 }}>
                      Estrictamente Prohibido Lucrar
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('rumbo_open_terms'))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 18px',
                    borderRadius: '16px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.1)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <FileText size={16} color="var(--accent-color)" />
                  <span>Ver Términos & Privacidad</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </header>

      {/* Frase / Versículo del Día */}
      <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <InspirationalDailyBanner />
      </div>

      {/* Banner Informativo de la Comunidad RUMBO */}
      <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '20px auto 0' }}>
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(236, 72, 153, 0.14) 50%, rgba(139, 92, 246, 0.14) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '24px',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F59E0B, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)',
              flexShrink: 0
            }}>
              🤝
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  ¡Comunidad RUMBO en Acción! ✨
                </h3>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 900, 
                  padding: '3px 10px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #FFE066, #F59E0B)', 
                  color: '#000000',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                }}>
                  🔥 APUNTES Y RESÚMENES
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                En la plataforma hay una <strong>comunidad activa de estudiantes</strong> compartiendo sus <strong>apuntes de clase, resúmenes, exámenes y guías de práctica</strong>. ¡Explora todos los aportes o sube tus propios apuntes para ayudar a la comunidad! 📚🚀
              </p>
            </div>
          </div>

          <Link 
            to="/biblioteca?tab=comunidad"
            style={{ textDecoration: 'none' }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(236, 72, 153, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 22px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            >
              <span>Ver Apuntes de la Comunidad</span>
              <span>✨</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Carrusel de Tarjetas de Aliados RUMBO (Movibles) */}
      <AliadosCarousel />

      {/* Sección del Formulario Unificado: Subir Material & Ser Aliado */}
      <section id="home-forms-section" style={{ padding: '20px 16px 40px', maxWidth: '980px', margin: '0 auto', boxSizing: 'border-box' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card"
          style={{
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '28px',
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxSizing: 'border-box'
          }}
        >
          {/* Selector de Pestañas */}
          <div style={{
            display: 'flex',
            background: 'rgba(120, 120, 128, 0.12)',
            borderRadius: '18px',
            padding: '5px',
            marginBottom: '26px',
            gap: '6px'
          }}>
            <button
              onClick={() => setFormTab('material')}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '14px',
                border: 'none',
                background: formTab === 'material' ? 'var(--accent-color, #007AFF)' : 'transparent',
                color: formTab === 'material' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: formTab === 'material' ? '0 4px 14px rgba(0, 122, 255, 0.4)' : 'none'
              }}
            >
              <UploadCloud size={18} />
              <span>📤 Subir Material</span>
            </button>

            <button
              onClick={() => setFormTab('aliado')}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '14px',
                border: 'none',
                background: formTab === 'aliado' ? 'linear-gradient(135deg, #FF9500, #FF2D55)' : 'transparent',
                color: formTab === 'aliado' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: formTab === 'aliado' ? '0 4px 14px rgba(255, 149, 0, 0.4)' : 'none'
              }}
            >
              <Sparkles size={18} />
              <span>🤝 Ser Aliado / Creador</span>
            </button>
          </div>

          {/* CONTENIDO 1: SUBIR MATERIAL (ORDEN: Título -> Categoría -> Autor -> Descripción -> Enlace de Drive al final) */}
          {formTab === 'material' && (
            <form onSubmit={requestMaterialConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder color="var(--accent-color)" size={22} /> Compartir Aporte con la Comunidad
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Comparte tus apuntes, prácticas, exámenes o resúmenes mediante tu enlace de Google Drive.
                </p>
              </div>

              {/* 1. Título o Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Título o Nombre del Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Resumen Biología Celular y Genética"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.08)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 2. Categoría */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Categoría
                </label>
                <select
                  value={matCategory}
                  onChange={(e) => setMatCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.08)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="tomos" style={{ background: '#1c1c1e', color: '#fff' }}>📚 Tomos y Libros</option>
                  <option value="practicas" style={{ background: '#1c1c1e', color: '#fff' }}>📗 Prácticas y Bancos</option>
                  <option value="examenes" style={{ background: '#1c1c1e', color: '#fff' }}>📝 Exámenes Pasados</option>
                  <option value="resumenes" style={{ background: '#1c1c1e', color: '#fff' }}>📑 Resúmenes y Apuntes</option>
                  <option value="variado" style={{ background: '#1c1c1e', color: '#fff' }}>✨ Variado / Otros</option>
                </select>
              </div>

              {/* 3. Nombre del Autor o Créditos */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nombre del Autor o Créditos
                </label>
                <input
                  type="text"
                  placeholder={user?.displayName || "Ej: Ronaldo Aguilar / Grupo de Estudio"}
                  value={matAuthor}
                  onChange={(e) => setMatAuthor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.08)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 4. Descripción o Recomendaciones */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Descripción o Recomendaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: Contiene fórmulas y preguntas fijas tipo UNSA"
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.08)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 5. Enlace de Google Drive al FINAL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Enlace de Google Drive *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--accent-color, #007AFF)',
                    background: 'rgba(0, 122, 255, 0.05)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ display: 'block', marginTop: '4px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  💡 Recuerda que el enlace de Drive debe estar en modo "Cualquier persona con el enlace puede ver".
                </span>
              </div>

              {/* Barra de Progreso si está subiendo */}
              {matLoading && (
                <div style={{ width: '100%', background: 'rgba(120, 120, 128, 0.15)', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: 'var(--accent-color, #007AFF)', borderRadius: '10px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${matProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}

              {/* Botón Publicar */}
              <button
                type="submit"
                disabled={matLoading}
                style={{
                  padding: '14px 24px',
                  borderRadius: '16px',
                  background: 'var(--accent-color, #007AFF)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: matLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(0, 122, 255, 0.4)',
                  transition: 'all 0.2s ease',
                  opacity: matLoading ? 0.7 : 1,
                  marginTop: '6px'
                }}
              >
                {matLoading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Publicando aporte... {matProgress}%</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    <span>Publicar Aporte a la Comunidad</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* CONTENIDO 2: SER ALIADO / CREADOR (CON VISTA PREVIA PRIVADA DE SU TARJETA DEBAJO) */}
          {formTab === 'aliado' && (
            <form onSubmit={handleAllySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles color="#FF9500" size={22} /> Tarjeta de Aliado / Creador RUMBO
                  </h3>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: (isAdmin || isAuthorOfFirebase(user?.email)) ? 'rgba(255, 149, 0, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                    color: (isAdmin || isAuthorOfFirebase(user?.email)) ? '#FF9500' : '#34C759',
                    border: (isAdmin || isAuthorOfFirebase(user?.email)) ? '1px solid rgba(255, 149, 0, 0.3)' : '1px solid rgba(52, 199, 89, 0.3)'
                  }}>
                    {(isAdmin || isAuthorOfFirebase(user?.email)) ? '👑 Creador / Admin' : `📊 ${userUploads.length}/10 Aportes`}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Configura tu tarjeta pública. Se guardará vinculada a tu cuenta de Google para que puedas editarla cuando quieras.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Nombre o Seudónimo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre público o canal"
                    value={allyName}
                    onChange={(e) => setAllyName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'rgba(120, 120, 128, 0.08)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Materia o Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Álgebra, Biología, Filosofía"
                    value={allySubject}
                    onChange={(e) => setAllySubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'rgba(120, 120, 128, 0.08)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Enlace de Canal / Grupo de WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://chat.whatsapp.com/..."
                    value={allyWhatsapp}
                    onChange={(e) => setAllyWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'rgba(120, 120, 128, 0.08)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Canal de TikTok o Red Social
                  </label>
                  <input
                    type="text"
                    placeholder="https://tiktok.com/@tu_usuario"
                    value={allyTiktok}
                    onChange={(e) => setAllyTiktok(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'rgba(120, 120, 128, 0.08)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Mensaje o Descripción de tu Tarjeta
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Te invito a unirte a mi canal donde comparto resoluciones paso a paso y tips para el examen."
                  value={allyDesc}
                  onChange={(e) => setAllyDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.08)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* 🌟 VISTA PREVIA PRIVADA DE TU TARJETA (Solo el propio usuario puede verla y editarla en vivo) */}
              <div style={{
                marginTop: '10px',
                paddingTop: '20px',
                borderTop: '1.5px dashed var(--card-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 149, 0, 0.12)',
                  border: '1px solid rgba(255, 149, 0, 0.3)',
                  color: '#FF9500',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  <Eye size={14} />
                  <span>Vista Previa en Vivo · Solo tú puedes ver y editar tu tarjeta</span>
                </div>

                {/* Tarjeta Renderizada en Vivo */}
                <div
                  className="glass-card"
                  style={{
                    width: '100%',
                    maxWidth: '380px',
                    borderRadius: '26px',
                    padding: '22px 20px',
                    background: 'var(--card-bg)',
                    border: '1.5px solid rgba(255, 149, 0, 0.35)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 10px 30px rgba(255, 149, 0, 0.15)',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LiveUserAvatar
                      uid={user?.uid || 'preview-user'}
                      fallbackName={allyName || user?.displayName || 'Aliado RUMBO'}
                      fallbackPhoto={user?.photoURL || './assets/LOGOR.png'}
                      size={52}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.98rem',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          lineHeight: 1.25,
                          wordBreak: 'break-word'
                        }}>
                          {allyName || user?.displayName || 'Tu Nombre o Canal'}
                        </h4>
                        <CheckCircle2 size={16} style={{ color: '#34C759', flexShrink: 0 }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#A855F7',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {(isAdmin || isAuthorOfFirebase(user?.email)) ? '👑 Creador RUMBO' : '⭐ Aliado RUMBO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Especialidad */}
                  <div style={{
                    background: 'rgba(120, 120, 128, 0.08)',
                    borderRadius: '14px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>📍</span>
                    <span>{allySubject || 'Especialidad / Materia'}</span>
                  </div>

                  {/* Descripción */}
                  <p style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    "{allyDesc || 'Comparte material educativo gratuito y tips preuniversitarios.'}"
                  </p>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}
                    >
                      <WhatsAppIconSVG size={17} /> Canal de WhatsApp ↗
                    </div>

                    {allyTiktok && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 10px',
                          borderRadius: '12px',
                          background: '#000000',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.78rem'
                        }}
                      >
                        <TikTokIconSVG size={15} /> TikTok ↗
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón Guardar Aliado */}
              <button
                type="submit"
                disabled={allyLoading}
                style={{
                  padding: '14px 24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: allyLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(255, 149, 0, 0.4)',
                  transition: 'all 0.2s ease',
                  opacity: allyLoading ? 0.7 : 1
                }}
              >
                {allyLoading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Guardando en tu cuenta de Google...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Guardar y Activar Tarjeta de Aliado RUMBO</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </section>

      {/* Modal de Confirmación para Subida de Material */}
      {isMatConfirmOpen && (
        <div
          className="ios-modal-backdrop"
          onClick={() => setIsMatConfirmOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.88, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 15 }}
            className="glass-card"
            style={{
              background: 'var(--card-bg)',
              border: '1.5px solid var(--card-border)',
              borderRadius: '26px',
              padding: '28px 24px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 122, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent-color)'
            }}>
              <UploadCloud size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
              ¿Publicar este material?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Estás a punto de subir <strong>"{matTitle}"</strong> a la comunidad RUMBO. Quedará visible para todos los estudiantes.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsMatConfirmOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1.5px solid var(--card-border)',
                  background: 'rgba(120, 120, 128, 0.1)',
                  color: 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeMaterialUpload}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'var(--accent-color, #007AFF)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)'
                }}
              >
                Sí, Publicar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Subida de respaldo */}
      <UploadModal
        isOpen={isUploadModalOpen}
        initialSourceMode="file"
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
        }}
      />

      <SuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => setIsSuccessOpen(false)} 
        title={successContent.title} 
        message={successContent.message} 
      />
    </div>
  );
};
