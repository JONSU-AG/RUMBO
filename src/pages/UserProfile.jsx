import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  CheckCircle, 
  UploadCloud, 
  ExternalLink, 
  FileText, 
  Folder, 
  Share2, 
  Eye, 
  EyeOff, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  ArrowLeft,
  AlertTriangle,
  Lock,
  MessageCircle,
  Sparkles,
  Settings,
  LogOut,
  Copy,
  Check,
  Palette,
  Camera,
  GraduationCap,
  Award,
  BookOpen,
  Search,
  Instagram,
  Compass,
  FileCheck,
  MessageSquare,
  Image as ImageIcon,
  Flag,
  Maximize2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Bookmark
} from 'lucide-react';
import { searchMatches } from '../lib/searchHelper';
import { WhatsAppIconSVG } from '../components/AliadosCarousel';
import { db } from '../lib/firebase';
import { uploadFileReliable, getDirectImageUrl } from '../lib/storageHelper';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { useAuth, ADMIN_EMAILS, isAuthorOfFirebase } from '../context/AuthContext';
import { UploadModal } from '../components/UploadModal';
import { UserDirectChat } from '../components/UserDirectChat';
import { SuccessModal } from '../components/SuccessModal';
import { ReactionsBar } from '../components/ReactionsBar';
import { ProfileComments } from '../components/ProfileComments';
import { ReportModal } from '../components/ReportModal';
import { IOSModal } from '../components/IOSModal';
import { ConfirmModal, NoticeModal } from '../components/ConfirmModal';
import { fetchSavedMaterialsForUser, getLocalSavedMaterials } from '../lib/savedHelper';
import { BookmarkButton } from '../components/BookmarkButton';

// ─── MARCOS DE PERFIL (GAMER, CREADOR & COMUNIDAD ACADÉMICA / UNSA) ────────────
export const AVATAR_FRAMES = [
  {
    id: 'none',
    label: 'Clásico / Sin Marco',
    desc: 'Borde limpio estándar',
    ring: 'transparent',
    glow: 'none',
    badge: null,
    badgeColor: '#888888'
  },
  {
    id: 'fuego_creador',
    label: 'Fuego Creador 🔥 (Exclusivo)',
    desc: 'Fuego ardiente guinda ➔ rojo ➔ naranja ➔ amarillo animado',
    ringClass: 'frame-fuego-creador',
    ring: 'linear-gradient(135deg, #701A75 0%, #831843 30%, #DC2626 65%, #FF8A00 85%, #FBBF24 100%)',
    glow: '0 0 22px rgba(255, 85, 0, 0.75)',
    badge: '👑 CREADOR',
    badgeColor: '#831843',
    adminOnly: true
  },
  {
    id: 'carmesi',
    label: 'Carmesí Agustino 🍷',
    desc: 'Vino agustino, rojo profundo y destellos carmesí',
    ring: 'linear-gradient(135deg, #701A75 0%, #991B1B 40%, #BE123C 75%, #F59E0B 100%)',
    glow: '0 0 20px rgba(190, 18, 60, 0.6)',
    badge: '🍷 CARMESÍ',
    badgeColor: '#BE123C'
  },
  {
    id: 'celeste_unsa',
    label: 'Celeste Cielo UNSA 🩵',
    desc: 'Azul cielo radiante y cian preuniversitario',
    ring: 'linear-gradient(135deg, #00C6FF 0%, #007AFF 50%, #38BDF8 100%)',
    glow: '0 0 18px rgba(0, 198, 255, 0.55)',
    badge: '🩵 CELESTE',
    badgeColor: '#00C6FF'
  },
  {
    id: 'sol_dorado',
    label: 'Sol Dorado Cachimbo ⭐',
    desc: 'Oro deslumbrante y mérito académico',
    ring: 'linear-gradient(135deg, #D97706 0%, #F59E0B 40%, #FDE68A 75%, #B45309 100%)',
    glow: '0 0 22px rgba(245, 158, 11, 0.6)',
    badge: '⭐ DORADO',
    badgeColor: '#D97706'
  },
  {
    id: 'fuego',
    label: 'Marco Fuego Clásico 🔥',
    desc: 'Degradado llama viva naranja y escarlata',
    ring: 'linear-gradient(135deg, #FF5500 0%, #FF8A00 50%, #FF3D00 100%)',
    glow: '0 0 18px rgba(255, 85, 0, 0.5)',
    badge: '🔥 FUEGO',
    badgeColor: '#FF5500'
  },
  {
    id: 'esmeralda',
    label: 'Marco Esmeralda 🌿',
    desc: 'Verde esmeralda y brillo de la salud',
    ring: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #FBBF24 100%)',
    glow: '0 0 18px rgba(16, 185, 129, 0.5)',
    badge: '🌿 ESMERALDA',
    badgeColor: '#059669'
  },
  {
    id: 'neon_azul',
    label: 'Marco Neón Azul ⚡',
    desc: 'Azul ciberpunk y energía cuántica',
    ring: 'linear-gradient(135deg, #007AFF 0%, #3B82F6 50%, #60A5FA 100%)',
    glow: '0 0 18px rgba(0, 122, 255, 0.55)',
    badge: '⚡ NEÓN',
    badgeColor: '#007AFF'
  },
  {
    id: 'magico_purple',
    label: 'Púrpura Mágico ✨',
    desc: 'Violeta estelar y magenta místico',
    ring: 'linear-gradient(135deg, #7E22CE 0%, #A855F7 50%, #EC4899 100%)',
    glow: '0 0 18px rgba(168, 85, 247, 0.5)',
    badge: '✨ VIOLETA',
    badgeColor: '#9333EA'
  },
  {
    id: 'galaxia_neon',
    label: 'Galaxia Ciberpunk 🌌',
    desc: 'Cian, violeta y fucsia galáctico',
    ring: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 50%, #F43F5E 100%)',
    glow: '0 0 20px rgba(139, 92, 246, 0.55)',
    badge: '🌌 GALAXIA',
    badgeColor: '#8B5CF6'
  },
  {
    id: 'arcoiris_neon',
    label: 'Arcoíris Neón 🌈',
    desc: 'Multicolor animado en movimiento continuo',
    ringClass: 'frame-arcoiris',
    ring: 'linear-gradient(135deg, #FF0055, #FF5000, #FFCC00, #00FF66, #00CCFF, #7700FF, #FF0055)',
    glow: '0 0 20px rgba(0, 204, 255, 0.55)',
    badge: '🌈 ARCOÍRIS',
    badgeColor: '#EC4899'
  }
];

// ─── FOTOS DE PORTADA CURADAS (CAMPUS UNSA, BIBLIOTECA, ESTUDIO) ─────────────
const COVER_PHOTO_PRESETS = [
  { id: 'campus_unsa', label: 'Campus Universitario UNSA 🏛️', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80' },
  { id: 'library_agustina', label: 'Biblioteca & Sala de Estudio 📚', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80' },
  { id: 'study_desk', label: 'Mesa de Estudio y Apuntes ✍️', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&auto=format&fit=crop&q=80' },
  { id: 'chalkboard', label: 'Pizarra de Fórmulas y Ciencias 📐', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1600&auto=format&fit=crop&q=80' },
  { id: 'bookshelf', label: 'Libros y Sabiduría 📖', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&auto=format&fit=crop&q=80' },
  { id: 'coffee_focus', label: 'Café & Concentración Matutina ☕', url: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&auto=format&fit=crop&q=80' }
];

// ─── BANNER GRADIENT PRESETS NATURALES Y UNIVERSITARIOS ──────────────────────
const BANNER_PRESETS = [
  { id: 'unsa_burgundy', label: 'Granate Arequipa UNSA 🌋', style: 'linear-gradient(135deg, #701A75 0%, #831843 50%, #BE123C 100%)' },
  { id: 'rumbo_blue', label: 'Azul Preuniversitario 🎓', style: 'linear-gradient(135deg, #007AFF 0%, #0051A8 100%)' },
  { id: 'san_marcos', label: 'Azul San Marcos 🏛️', style: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)' },
  { id: 'uni_red', label: 'Escarlata UNI 📐', style: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #EF4444 100%)' },
  { id: 'med_emerald', label: 'Verde Ciencias Médicas 🩺', style: 'linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)' },
  { id: 'gold_academic', label: 'Oro Mérito Académico ⭐', style: 'linear-gradient(135deg, #B45309 0%, #D97706 50%, #F59E0B 100%)' },
  { id: 'dark_slate', label: 'Noche de Repaso 🌙', style: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)' },
  { id: 'focus_purple', label: 'Púrpura Concentración 💡', style: 'linear-gradient(135deg, #581C87 0%, #7E22CE 50%, #A855F7 100%)' }
];

// ─── AVATAR PRESETS (ANIMATED CARTOON ILLUSTRATIONS - NO REAL PERSONS) ─────────
const AVATAR_PRESETS = [
  { id: 'cosmo', label: 'Cosmo 🚀', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo&backgroundColor=b6e3f4,c0aede' },
  { id: 'luna', label: 'Luna 🌙', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffd5dc,ffdfbf' },
  { id: 'sparky', label: 'Sparky 🤖', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=d1d4f9,b6e3f4' },
  { id: 'felix', label: 'Félix 🎧', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=c0aede,b6e3f4' },
  { id: 'michi', label: 'Michi 🐱', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Michi&backgroundColor=ffdfbf,ffd5dc' },
  { id: 'aria', label: 'Aria ✨', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&backgroundColor=ffd5dc,c0aede' },
  { id: 'panda', label: 'Panda 🐼', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Panda&backgroundColor=b6e3f4,d1d4f9' },
  { id: 'oliver', label: 'Oliver 👓', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=c0aede,d1d4f9' },
  { id: 'pixel', label: 'Pixel 🎮', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel&backgroundColor=ffd5dc,ffdfbf' },
  { id: 'maya', label: 'Maya 🌿', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=b6e3f4,ffdfbf' },
  { id: 'star', label: 'Estrella ⭐', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star&backgroundColor=ffdfbf,ffd5dc' },
  { id: 'leo', label: 'Leo 🦁', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=d1d4f9,c0aede' }
];

const SUGGESTED_UNIVERSITIES = [
  'UNMSM (San Marcos)', 'UNI', 'UNSA', 'PUCP', 'UNAC', 'UNALM', 'UNFV', 'UNSCH', 'UNTRM', 'UNPRG', 'Otra'
];

const SUGGESTED_CAREERS = [
  'Medicina Humana', 'Ingeniería de Sistemas', 'Ingeniería Civil', 'Derecho', 'Psicología', 'Ingeniería Industrial', 'Arquitectura', 'Contabilidad', 'Administración', 'Enfermería', 'Otra'
];

const SUGGESTED_ACADEMIES = [
  'CepreUNI', 'Pre San Marcos', 'Ciclo Semestral', 'Ciclo Anual', 'Repaso Intensivo', 'Autoaprendizaje'
];

export const UserProfile = () => {
  const { uid: paramUid } = useParams();
  const { user, userData, isAdmin, isBanned, logout } = useAuth();
  const navigate = useNavigate();

  const targetUid = paramUid || user?.uid;

  const [profileUser, setProfileUser] = useState(null);
  const [userUploads, setUserUploads] = useState([]);
  const [savedMaterials, setSavedMaterials] = useState(() => getLocalSavedMaterials());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('muro'); // 'muro' | 'guardados' | 'chat'
  const [isDirectChatModalOpen, setIsDirectChatModalOpen] = useState(false);
  const [isPersonalizarOpen, setIsPersonalizarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [expandedPreviews, setExpandedPreviews] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '' });

  const showNotice = (title, message) => setNoticeModal({ isOpen: true, title, message });

  // Report modal state
  const [reportData, setReportData] = useState({ isOpen: false, targetId: null, targetTitle: '', targetType: 'material' });

  // Customization State
  const [customizerStep, setCustomizerStep] = useState('marco'); // 'marco' | 'portada' | 'metas'
  const [coverType, setCoverType] = useState('preset'); // 'preset' | 'photo' | 'custom'
  const [selectedGradient, setSelectedGradient] = useState(BANNER_PRESETS[0].style);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [academicStatus, setAcademicStatus] = useState('postulante'); // 'postulante' | 'estudiante_unsa' | 'cachimbo' | 'egresado'
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [coverHeight, setCoverHeight] = useState(250);
  const [coverFitMode, setCoverFitMode] = useState('contain'); // 'cover' | 'contain'

  // Exclusive Creator 4-Color Gradient Customizer (Admin / Creator Exclusive)
  const [creatorColors, setCreatorColors] = useState(() => {
    try {
      const saved = localStorage.getItem('rumbo_creator_custom_colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
      }
    } catch (e) {}
    return ['#701A75', '#DC2626', '#FF8A00', '#FBBF24'];
  });

  const updateCreatorColorsLive = (newColors) => {
    setCreatorColors(newColors);
    try {
      localStorage.setItem('rumbo_creator_custom_colors', JSON.stringify(newColors));
      window.dispatchEvent(new CustomEvent('rumbo_creator_colors_updated', { detail: newColors }));
    } catch (e) {}
  };

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCarrera, setEditCarrera] = useState('');
  const [editUniversidad, setEditUniversidad] = useState('');
  const [editAcademia, setEditAcademia] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editInstagram, setEditInstagram] = useState('');

  // File upload handlers for Avatar & Portada
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadFileReliable(file, null, 'perfil', profileUser?.photoURL);
      if (url) {
        const directUrl = getDirectImageUrl(url);
        setAvatarUrl(directUrl);
        setProfileUser(prev => ({ ...prev, photoURL: directUrl }));
        if (targetUid) {
          const userDocRef = doc(db, 'usuarios', targetUid);
          await setDoc(userDocRef, { photoURL: directUrl }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error subiendo foto de perfil:", err);
      showNotice("Error", "No se pudo subir la foto. Intenta con una imagen más liviana.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadFileReliable(file, null, 'portada', profileUser?.coverUrl);
      if (url) {
        const directUrl = getDirectImageUrl(url);
        setCustomCoverUrl(directUrl);
        setCoverType('custom');
        setProfileUser(prev => ({ ...prev, coverUrl: directUrl }));
        if (targetUid) {
          const userDocRef = doc(db, 'usuarios', targetUid);
          await setDoc(userDocRef, { coverUrl: directUrl }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error subiendo portada:", err);
      showNotice("Error", "No se pudo subir la imagen de portada.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Endorsements for each profile data point
  const [endorsements, setEndorsements] = useState({
    carrera: { count: 8, users: [] },
    universidad: { count: 15, users: [] },
    bio: { count: 12, users: [] }
  });

  const isOwnProfile = user && targetUid === user.uid;
  const isUserAdmin = Boolean(
    (user?.email && (ADMIN_EMAILS.includes(user.email.toLowerCase()) || isAuthorOfFirebase(user?.email))) || 
    profileUser?.isAdmin || 
    profileUser?.isCreator || 
    isAdmin
  );

  // Handle endorsing individual profile data points
  const handleEndorse = async (field) => {
    if (!user) {
      showNotice("Sesión requerida", "Inicia sesión para valorar y apoyar este dato del perfil.");
      return;
    }
    const currentField = endorsements[field] || { count: 0, users: [] };
    const hasEndorsed = currentField.users?.includes(user.uid);
    const newUsers = hasEndorsed 
      ? currentField.users.filter(u => u !== user.uid)
      : [...(currentField.users || []), user.uid];
    const newCount = hasEndorsed ? Math.max(0, currentField.count - 1) : currentField.count + 1;

    const updated = {
      ...endorsements,
      [field]: { count: newCount, users: newUsers }
    };
    setEndorsements(updated);

    try {
      const userRef = doc(db, 'usuarios', targetUid);
      await setDoc(userRef, { endorsements: updated }, { merge: true });
    } catch (e) {
      console.warn("Error updating endorsement:", e);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    if (!targetUid) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const isFounderOrAdmin = Boolean(
        targetUid === 'josnu-admin' ||
        targetUid === 'josnu-founder' ||
        (isOwnProfile && user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
      );
      const founderBio = 'SOY CREADOR DE LA PAGINA, brindo material preuniversitario gratis, además de plasmar sus ideas en la pagina para que sea nuestra herramienta de estudio.';
      const founderWhatsapp = 'https://www.whatsapp.com/channel/0029VbDFAEu7YScyVZBNul0X';
      const founderTiktok = 'https://www.tiktok.com/@futurocachimbounsa?_r=1&_t=ZS-99SjSQle78P';

      try {
        const userDocRef = doc(db, 'usuarios', targetUid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const isJosnuUser = isFounderOrAdmin ||
            (data.email && ADMIN_EMAILS.includes(data.email.toLowerCase())) ||
            (data.displayName && (data.displayName.toLowerCase().includes('josnu') || data.displayName.toLowerCase().includes('futuro cachimbo')));

          const displayName = data.displayName || (isJosnuUser ? 'FUTURO CACHIMBO UNSA (JOSNU)' : 'Estudiante RUMBO');
          const bio = data.bio || (isJosnuUser ? 'Fundador & Creador de la plataforma RUMBO.' : 'Estudiante enfocado en alcanzar la meta universitaria con la comunidad RUMBO.');
          const carrera = data.carrera || (isJosnuUser ? 'Fundador & Creador RUMBO' : 'Postulante Universitario');
          const whatsappChannel = data.whatsappChannel || (isJosnuUser ? founderWhatsapp : '');
          const instagram = data.instagram || (isJosnuUser ? founderTiktok : '');
          const isAlly = isJosnuUser ? true : Boolean(data.isAlly);
          const academicStatus = isJosnuUser ? 'estudiante_unsa' : (data.academicStatus || 'postulante');

          const merged = {
            ...data,
            displayName,
            bio,
            carrera,
            whatsappChannel,
            instagram,
            isAlly,
            academicStatus
          };

          setProfileUser(merged);
          setEditName(displayName);
          setEditBio(bio);
          setEditCarrera(carrera);
          setEditUniversidad(data.universidad || (isJosnuUser ? 'UNSA (Arequipa)' : ''));
          setEditAcademia(data.academia || (isJosnuUser ? 'Creador de RUMBO' : ''));
          setEditWhatsapp(whatsappChannel);
          setEditInstagram(instagram);
          setAvatarUrl(data.photoURL || '');
          setSelectedFrame(data.avatarFrame || 'none');
          setAcademicStatus(academicStatus);
          setSelectedGradient(data.coverGradient || BANNER_PRESETS[0].style);
          setCustomCoverUrl(data.coverUrl || '');
          setCoverType(data.coverUrl ? 'custom' : 'preset');
          setCoverPositionY(data.coverPositionY !== undefined ? data.coverPositionY : 50);
          setCoverHeight(data.coverHeight !== undefined ? data.coverHeight : 250);
          setCoverFitMode(data.coverFitMode || (data.coverUrl ? 'contain' : 'cover'));
          if (data.creatorCustomFrame?.colors && Array.isArray(data.creatorCustomFrame.colors) && data.creatorCustomFrame.colors.length >= 4) {
            setCreatorColors(data.creatorCustomFrame.colors);
          }
          if (data.endorsements) {
            setEndorsements(data.endorsements);
          }
        } else {
          const isJosnuUser = isFounderOrAdmin || (targetUid && (targetUid.includes('josnu') || targetUid.includes('founder')));

          const fallbackData = {
            uid: targetUid,
            displayName: isJosnuUser 
              ? 'FUTURO CACHIMBO UNSA (JOSNU)'
              : (localAllyName || (isOwnProfile ? (userData?.displayName || 'Mi Perfil') : 'Estudiante RUMBO')),
            email: isOwnProfile ? user?.email : '',
            photoURL: isOwnProfile ? user?.photoURL : null,
            uploadCount: 0,
            totalReactionsReceived: 99,
            isAlly: isJosnuUser || (isOwnProfile ? ADMIN_EMAILS.includes(user?.email?.toLowerCase()) : false),
            banned: false,
            bio: isJosnuUser 
              ? founderBio 
              : (localAllyBio || 'Estudiante enfocado en alcanzar la meta universitaria con la comunidad RUMBO.'),
            carrera: isJosnuUser ? 'Fundador & Creador RUMBO' : 'Postulante Universitario',
            universidad: 'UNSA (Arequipa)',
            academia: isJosnuUser ? 'Creador de RUMBO' : 'Preparación Preuniversitaria',
            avatarFrame: 'none',
            academicStatus: isJosnuUser ? 'estudiante_unsa' : 'postulante',
            coverGradient: BANNER_PRESETS[0].style,
            coverUrl: '',
            coverPositionY: 50,
            coverHeight: 250,
            coverFitMode: 'contain',
            wallpaperUrl: '',
            whatsappChannel: isJosnuUser ? founderWhatsapp : (localAllyWhatsapp || ''),
            instagram: isJosnuUser ? founderTiktok : (localAllyTiktok || '')
          };

          setProfileUser(fallbackData);
          setEditName(fallbackData.displayName);
          setEditBio(fallbackData.bio);
          setEditCarrera(fallbackData.carrera);
          setEditUniversidad(fallbackData.universidad);
          setEditAcademia(fallbackData.academia);
          setEditWhatsapp(fallbackData.whatsappChannel);
          setEditInstagram(fallbackData.instagram);
          setAvatarUrl(fallbackData.photoURL || '');
          setSelectedFrame(fallbackData.avatarFrame || 'none');
          setAcademicStatus(fallbackData.academicStatus || 'postulante');
        }
      } catch (err) {
        console.warn("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUid, isOwnProfile, user]);

  // Subscribe to this user's uploads
  useEffect(() => {
    if (!targetUid) return;

    try {
      const q = query(
        collection(db, 'uploads'),
        where('uploadedBy.uid', '==', targetUid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(item => (!item.oculto && !item.hidden && (item.reportsCount || 0) < 3));
        // Sort descending by createdAt
        docs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        setUserUploads(docs);
      }, (err) => {
        console.warn("Error listening to user uploads:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not setup uploads listener:", e);
    }
  }, [targetUid]);

  // Subscribe/Fetch saved materials for this profile user
  useEffect(() => {
    if (!targetUid) return;

    fetchSavedMaterialsForUser(targetUid).then(items => {
      if (items && Array.isArray(items)) {
        setSavedMaterials(items);
      }
    });

    const handleSavedUpdate = () => {
      setSavedMaterials(getLocalSavedMaterials());
    };

    window.addEventListener('rumbo_saved_updated', handleSavedUpdate);
    return () => window.removeEventListener('rumbo_saved_updated', handleSavedUpdate);
  }, [targetUid]);

  // Save Social Profile Customization
  const handleSaveProfile = async () => {
    if (!isOwnProfile && !isAdmin) return;
    setSaveStatus('saving');
    try {
      const userDocRef = doc(db, 'usuarios', targetUid);
      const updatedFields = {
        displayName: editName.trim() || profileUser.displayName || 'Estudiante RUMBO',
        bio: editBio.trim(),
        carrera: editCarrera.trim(),
        universidad: editUniversidad.trim(),
        academia: editAcademia.trim(),
        whatsappChannel: editWhatsapp.trim(),
        instagram: editInstagram.trim(),
        photoURL: avatarUrl.trim() || profileUser.photoURL || null,
        coverGradient: selectedGradient,
        coverUrl: customCoverUrl ? customCoverUrl.trim() : '',
        coverPositionY: coverPositionY !== undefined ? coverPositionY : 50,
        coverHeight: coverHeight !== undefined ? coverHeight : 250,
        coverFitMode: coverFitMode || 'cover',
        avatarFrame: selectedFrame,
        academicStatus: academicStatus,
        wallpaperUrl: '',
        ...(isUserAdmin ? {
          creatorCustomFrame: {
            enabled: true,
            colors: creatorColors,
            speed: 1.3
          }
        } : {})
      };

      await setDoc(userDocRef, updatedFields, { merge: true });

      // Save real admin UID and sync creator profile configuration for all views
      if (isUserAdmin) {
        try {
          localStorage.setItem('rumbo_admin_real_uid', targetUid);
          await setDoc(doc(db, 'configuracion_general', 'creator_profile'), {
            uid: targetUid,
            displayName: updatedFields.displayName,
            photoURL: updatedFields.photoURL,
            avatarFrame: selectedFrame,
            creatorCustomFrame: {
              enabled: true,
              colors: creatorColors,
              speed: 1.3
            },
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (eConf) {
          console.warn("Creator config save notice:", eConf);
        }
      }

      // Sync name, avatar and frame across user's ally card if exists
      try {
        await setDoc(doc(db, 'solicitudes_aliados', targetUid), {
          name: updatedFields.displayName,
          avatar: updatedFields.photoURL,
          avatarFrame: selectedFrame
        }, { merge: true });
      } catch (eSol) {
        // quiet fallback
      }

      setProfileUser(prev => ({
        ...prev,
        ...updatedFields
      }));

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus(null);
        setActiveTab('muro');
        setIsPersonalizarOpen(false);
        setIsSettingsOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/#/usuario/${targetUid}`;
    navigator.clipboard.writeText(url);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  const togglePreview = (id) => {
    setExpandedPreviews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getPreviewUrl = (url) => {
    if (!url) return null;
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    const folderMatch = url.match(/(?:\/folders\/|folderview\?id=|open\?id=)([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
    }
    return url;
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || url.startsWith('data:image/');
  };

  // Filter uploads by category and search
  const filteredUploads = userUploads.filter(item => {
    const matchesCategory = selectedCategory === 'todos' || 
      (selectedCategory === 'teoria' && (item.category === 'teoria' || item.category === 'tomos' || item.title?.toLowerCase().includes('teoria') || item.title?.toLowerCase().includes('tomo') || item.title?.toLowerCase().includes('libro'))) ||
      (selectedCategory === 'practicas' && (item.category === 'practica' || item.category === 'practicas' || item.title?.toLowerCase().includes('practica') || item.title?.toLowerCase().includes('guia'))) ||
      (selectedCategory === 'examenes' && (item.category === 'examen' || item.category === 'examenes' || item.title?.toLowerCase().includes('examen') || item.title?.toLowerCase().includes('parcial'))) ||
      (selectedCategory === 'resumenes' && (item.category === 'resumen' || item.category === 'resumenes' || item.title?.toLowerCase().includes('resumen') || item.title?.toLowerCase().includes('apunte'))) ||
      (selectedCategory === 'variado' && (item.category === 'variado' || item.title?.toLowerCase().includes('variado') || item.title?.toLowerCase().includes('miscelanea')));

    const matchesSearch = searchMatches([item.title, item.author, item.desc, item.category], searchQuery);

    return matchesCategory && matchesSearch;
  });

  // Filter saved materials by category and search
  const filteredSavedMaterials = savedMaterials.filter(item => {
    if (!item) return false;
    const matchesCategory = selectedCategory === 'todos' || 
      (selectedCategory === 'teoria' && (item.category === 'teoria' || item.category === 'tomos' || item.title?.toLowerCase().includes('teoria') || item.title?.toLowerCase().includes('tomo') || item.title?.toLowerCase().includes('libro'))) ||
      (selectedCategory === 'practicas' && (item.category === 'practica' || item.category === 'practicas' || item.title?.toLowerCase().includes('practica') || item.title?.toLowerCase().includes('guia'))) ||
      (selectedCategory === 'examenes' && (item.category === 'examen' || item.category === 'examenes' || item.title?.toLowerCase().includes('examen') || item.title?.toLowerCase().includes('parcial'))) ||
      (selectedCategory === 'resumenes' && (item.category === 'resumen' || item.category === 'resumenes' || item.title?.toLowerCase().includes('resumen') || item.title?.toLowerCase().includes('apunte'))) ||
      (selectedCategory === 'variado' && (item.category === 'variado' || item.title?.toLowerCase().includes('variado') || item.title?.toLowerCase().includes('miscelanea')));

    const matchesSearch = searchMatches([item.title, item.author, item.desc, item.category], searchQuery);

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0,122,255,0.1)', borderRadius: '50%', marginBottom: '16px' }}>
          <Sparkles size={32} className="spinning-icon" style={{ color: 'var(--accent-color)' }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cargando perfil social...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="page-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-main)', fontWeight: 800 }}>Usuario no encontrado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Este perfil no existe o aún no ha sido configurado.</p>
        <Link to="/" style={{ color: 'var(--accent-color)', fontWeight: 700, textDecoration: 'none' }}>Volver al Inicio</Link>
      </div>
    );
  }

  const rawCoverUrl = isOwnProfile 
    ? (customCoverUrl || profileUser?.coverUrl || '')
    : (profileUser?.coverUrl || '');

  const activeCoverUrl = getDirectImageUrl(rawCoverUrl);

  const activeCoverGradient = isOwnProfile 
    ? (selectedGradient || profileUser?.coverGradient || BANNER_PRESETS[0].style)
    : (profileUser?.coverGradient || BANNER_PRESETS[0].style);

  const currentBannerStyle = activeCoverUrl
    ? { backgroundImage: `url("${activeCoverUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: activeCoverGradient };

  const frameIdToMatch = isOwnProfile ? selectedFrame : (profileUser.avatarFrame || 'none');
  const currentFrameConfig = AVATAR_FRAMES.find(f => 
    f.id === frameIdToMatch ||
    (f.id === 'fuego' && frameIdToMatch === 'postulante') ||
    (f.id === 'carmesi' && frameIdToMatch === 'unsa_student') ||
    (f.id === 'esmeralda' && frameIdToMatch === 'cachimbo') ||
    (f.id === 'neon_azul' && frameIdToMatch === 'aportante') ||
    (f.id === 'dorado_oro' && frameIdToMatch === 'merito_oro') ||
    (f.id === 'magico_purple' && frameIdToMatch === 'focus_purple')
  ) || AVATAR_FRAMES[0];

  return (
    <div 
      className="page-container" 
      style={{ 
        paddingBottom: '140px',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ──────────────── PORTADA / COVER BANNER (Estilo Red Social) ──────────────── */}
        <div 
          className="profile-cover-banner"
          style={{
            width: '100%',
            height: `${profileUser?.coverHeight || coverHeight || 250}px`,
            position: 'relative',
            borderRadius: '0 0 40px 40px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            transition: 'all 0.4s ease',
            background: activeCoverGradient
          }}
        >
          {activeCoverUrl ? (
            (profileUser?.coverFitMode || coverFitMode) === 'contain' ? (
              <>
                <img
                  src={activeCoverUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(32px) brightness(0.96)',
                    transform: 'scale(1.15)',
                    zIndex: 0
                  }}
                />
                <img
                  src={activeCoverUrl}
                  alt="Portada de perfil"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const driveMatch = rawCoverUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                                       rawCoverUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                                       rawCoverUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (driveMatch && driveMatch[1]) {
                      const fallbackUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
                      if (e.target.src !== fallbackUrl) {
                        e.target.src = fallbackUrl;
                      }
                    }
                  }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    zIndex: 1
                  }}
                />
              </>
            ) : (
              <img
                src={activeCoverUrl}
                alt="Portada de perfil"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const driveMatch = rawCoverUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                                     rawCoverUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                                     rawCoverUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                  if (driveMatch && driveMatch[1]) {
                    const fallbackUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
                    if (e.target.src !== fallbackUrl) {
                      e.target.src = fallbackUrl;
                    }
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: `center ${profileUser?.coverPositionY !== undefined ? profileUser.coverPositionY : (coverPositionY !== undefined ? coverPositionY : 50)}%`,
                  zIndex: 0
                }}
              />
            )
          ) : null}

          {/* Gradiente superior súper sutil para mantener el color rosa/original 100% brillante y limpio */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.12) 100%)', pointerEvents: 'none', zIndex: 1 }} />

          {/* Back Button (Top Left of Banner, below navbar on desktop) */}
          <button
            onClick={() => navigate(-1)}
            className="profile-banner-back"
            style={{
              padding: '9px 16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={16} /> Volver
          </button>

          {/* Quick action buttons on banner overlay (Top Right, attached to right edge) */}
          <div className="profile-banner-actions">
            {isOwnProfile && (
              <>
                {/* Upload to Wall (Instant) */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsUploadOpen(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    background: 'linear-gradient(135deg, #007AFF 0%, #A855F7 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(0, 122, 255, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <UploadCloud size={16} /> Subir Aporte
                </motion.button>

                {/* Personalizar Perfil */}
                <button
                  onClick={() => setIsPersonalizarOpen(true)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Palette size={15} /> Personalizar
                </button>

                {/* Configuración */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  title="Configuración de Perfil"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Settings size={17} />
                </button>

                {/* Compartir Perfil */}
                <button
                  onClick={copyProfileLink}
                  title="Compartir perfil"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: copiedProfile ? '#4ADE80' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedProfile ? <Check size={17} /> : <Share2 size={17} />}
                </button>
              </>
            )}

            {!isOwnProfile && (
              <>
                <button
                  onClick={() => setIsDirectChatModalOpen(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0, 122, 255, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MessageSquare size={15} /> Enviar Mensaje
                </button>

                <button
                  onClick={copyProfileLink}
                  style={{
                    padding: '9px 15px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: copiedProfile ? '#4ADE80' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedProfile ? <Check size={15} /> : <Share2 size={15} />}
                  {copiedProfile ? '¡Copiado!' : 'Compartir Perfil'}
                </button>

                {profileUser.whatsappChannel && (
                  <a
                    href={profileUser.whatsappChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Canal WhatsApp"
                    style={{
                      padding: '9px 12px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <WhatsAppIconSVG size={16} />
                  </a>
                )}

                <button
                  onClick={() => setReportData({
                    isOpen: true,
                    targetId: targetUid,
                    targetTitle: profileUser.displayName || 'Usuario',
                    targetType: 'user'
                  })}
                  style={{
                    padding: '9px 15px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 59, 48, 0.4)',
                    background: 'rgba(239, 68, 68, 0.4)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                  }}
                >
                  <Flag size={14} /> Reportar Perfil
                </button>
              </>
            )}
          </div>
        </div>

        {/* ──────────────── TARJETA PRINCIPAL DEL PERFIL ──────────────── */}
        <div style={{ maxWidth: '880px', margin: '-75px auto 28px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div className="ios-glass-card" style={{
            padding: '28px 32px',
            borderRadius: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.16)'
          }}>
            {/* Header Row: Avatar & User Name + Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {/* Avatar Container with Frame */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {(() => {
                  const effectiveCreatorColors = (isOwnProfile ? creatorColors : profileUser?.creatorCustomFrame?.colors) || ['#701A75', '#DC2626', '#FF8A00', '#FBBF24'];
                  const headerConicBg = `conic-gradient(from 0deg, ${effectiveCreatorColors[0]}, ${effectiveCreatorColors[1]}, ${effectiveCreatorColors[2]}, ${effectiveCreatorColors[3]}, ${effectiveCreatorColors[0]})`;
                  const headerGlow = `0 0 22px ${effectiveCreatorColors[1]}AA, 0 0 42px ${effectiveCreatorColors[2]}88, 0 0 60px ${effectiveCreatorColors[3]}55`;

                  return (
                    <div 
                      className={currentFrameConfig.id === 'fuego_creador' ? 'frame-fuego-creador-container' : (currentFrameConfig.ringClass || '')}
                      style={{
                        position: 'relative',
                        width: '124px',
                        height: '124px',
                        borderRadius: '50%',
                        padding: currentFrameConfig.id !== 'none' && currentFrameConfig.id !== 'fuego_creador' && currentFrameConfig.id !== 'arcoiris_neon' ? '6px' : '0px',
                        background: currentFrameConfig.id === 'fuego_creador' || currentFrameConfig.id === 'arcoiris_neon' ? 'transparent' : currentFrameConfig.ring,
                        boxShadow: currentFrameConfig.id === 'fuego_creador' ? headerGlow : currentFrameConfig.glow,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Dynamic rotating conic frame rings for VIP frames */}
                      {currentFrameConfig.id === 'fuego_creador' && (
                        <div 
                          className="frame-fuego-creador-spin" 
                          style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 1, background: headerConicBg }} 
                        />
                      )}
                      {currentFrameConfig.id === 'arcoiris_neon' && (
                        <div className="frame-arcoiris-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 1 }} />
                      )}

                      {profileUser.photoURL ? (
                        <img
                          src={profileUser.photoURL}
                          alt="Avatar"
                          style={{
                            width: '110px',
                            height: '110px',
                            borderRadius: '50%',
                            border: '3px solid #0e0b16',
                            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
                            objectFit: 'cover',
                            background: '#FFFFFF',
                            position: 'relative',
                            zIndex: 2
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '110px',
                          height: '110px',
                          borderRadius: '50%',
                          border: '3px solid #0e0b16',
                          background: 'linear-gradient(135deg, var(--accent-color), #A855F7)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3.1rem',
                          fontWeight: 800,
                          position: 'relative',
                          zIndex: 2
                        }}>
                          {(profileUser.displayName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })()}

                  {/* Floating mini badge at bottom center if frame has one */}
                  {currentFrameConfig.badge && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-7px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'rgba(15, 15, 20, 0.95)',
                      border: `1.5px solid ${currentFrameConfig.badgeColor}`,
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      zIndex: 6
                    }}>
                      {currentFrameConfig.badge}
                    </div>
                  )}

                {/* Edit Avatar quick button */}
                {isOwnProfile && (
                  <button
                    onClick={() => setIsPersonalizarOpen(true)}
                    title="Cambiar foto o marco de perfil"
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      border: '2px solid var(--card-bg)',
                      background: 'var(--accent-color)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                      zIndex: 7
                    }}
                  >
                    <Camera size={15} />
                  </button>
                )}
              </div>

              {/* User Name & High Level Badges side by side */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {profileUser.displayName || 'Estudiante RUMBO'}
                  </h1>

                {/* Academic Status Badge (UNSA / Postulante / Cachimbo / Egresado) */}
                {profileUser.academicStatus === 'estudiante_unsa' && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(190, 18, 60, 0.18), rgba(245, 158, 11, 0.18))',
                    border: '1.5px solid #BE123C',
                    color: '#BE123C',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🏛️ Estudiante UNSA • Comparte Material
                  </span>
                )}

                {profileUser.academicStatus === 'cachimbo' && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1.5px solid #10B981',
                    color: '#059669',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🎓 Cachimbo UNSA
                  </span>
                )}

                {profileUser.academicStatus === 'postulante' && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 85, 0, 0.14)',
                    border: '1.5px solid #FF5500',
                    color: '#FF5500',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🔥 Postulante Preuniversitario
                  </span>
                )}

                {profileUser.academicStatus === 'egresado' && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'rgba(100, 116, 139, 0.15)',
                    border: '1.5px solid #64748B',
                    color: 'var(--text-main)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    💼 Egresado / Profesional
                  </span>
                )}

                {/* Role Badges */}
                {isUserAdmin && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
                    border: '1.5px solid #A855F7',
                    color: '#A855F7',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    👑 ADMINISTRADOR
                  </span>
                )}

                {profileUser.isAlly && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'rgba(52, 168, 83, 0.15)',
                    border: '1.5px solid #34A853',
                    color: '#34A853',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🌟 ALIADO OFICIAL
                  </span>
                )}

                {(profileUser.hasWarning || profileUser.banned) && (
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1.5px solid #F59E0B',
                    color: '#D97706',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⚠️ AVISO DE MODERACIÓN
                  </span>
                )}
              </div>

              {/* University & Career Pills (Social Pre-U info) con Valoraciones */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,122,255,0.08)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(0,122,255,0.18)' }}>
                  <span style={{
                    padding: '3px 6px',
                    color: 'var(--accent-color)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <GraduationCap size={15} /> {profileUser.carrera || 'Postulante Universitario'}
                  </span>
                  <button
                    onClick={() => handleEndorse('carrera')}
                    title="Valorar vocación de este estudiante"
                    style={{
                      border: 'none',
                      background: endorsements.carrera?.users?.includes(user?.uid) ? 'var(--accent-color)' : 'rgba(0,122,255,0.15)',
                      color: endorsements.carrera?.users?.includes(user?.uid) ? '#FFF' : 'var(--accent-color)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🔥 {endorsements.carrera?.count || 0}
                  </button>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(168, 85, 247, 0.08)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.18)' }}>
                  <span style={{
                    padding: '3px 6px',
                    color: '#A855F7',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Award size={15} /> Meta: {profileUser.universidad || 'Rumbo a la Universidad'}
                  </span>
                  <button
                    onClick={() => handleEndorse('universidad')}
                    title="Valorar meta universitaria de este estudiante"
                    style={{
                      border: 'none',
                      background: endorsements.universidad?.users?.includes(user?.uid) ? '#A855F7' : 'rgba(168, 85, 247, 0.15)',
                      color: endorsements.universidad?.users?.includes(user?.uid) ? '#FFF' : '#A855F7',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🎯 {endorsements.universidad?.count || 0}
                  </button>
                </div>

                {profileUser.academia && (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '10px',
                    background: 'rgba(120, 120, 128, 0.1)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Compass size={14} /> {profileUser.academia}
                  </span>
                )}
              </div>
            </div>
          </div>

            {/* Social Bio / Motivation Phrase con Valoración de Perfil */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{
                background: 'rgba(120, 120, 128, 0.05)',
                padding: '16px 20px',
                borderRadius: '18px',
                border: '1px solid var(--card-border)'
              }}>
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.98rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word'
                }}>
                  "{profileUser.bio || 'Preparándome para ingresar a la universidad con RUMBO. Compartiendo material para sumar a la comunidad.'}"
                </p>

                {/* Rating button & Social SVG icons near description */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {profileUser.whatsappChannel ? (
                    <a
                      href={profileUser.whatsappChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Canal de WhatsApp Oficial"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 10px rgba(37, 211, 102, 0.35)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <WhatsAppIconSVG size={16} /> Canal WhatsApp
                    </a>
                  ) : <div />}

                  <button
                    onClick={() => handleEndorse('bio')}
                    title="Valorar y enviar ánimos a este estudiante"
                    style={{
                      border: 'none',
                      background: endorsements.bio?.users?.includes(user?.uid) ? 'rgba(239, 68, 68, 0.18)' : 'rgba(120, 120, 128, 0.1)',
                      color: endorsements.bio?.users?.includes(user?.uid) ? '#EF4444' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ❤️ Valorar Ánimo y Motivación ({endorsements.bio?.count || 0})
                  </button>
                </div>
              </div>
            </div>

            {/* Modern Glass KPI Metrics Cards (Ultra-Compact on Mobile) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid var(--card-border)'
            }}>
              {/* Card 1: Aportes en el Muro */}
              <div style={{
                background: 'rgba(0, 122, 255, 0.05)',
                border: '1.5px solid rgba(0, 122, 255, 0.16)',
                borderRadius: '16px',
                padding: '8px 10px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(0, 122, 255, 0.12)',
                  color: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={15} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-color)', lineHeight: 1.1 }}>
                  {userUploads.length}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Aportes Muro
                </div>
              </div>

              {/* Card 2: Reputación Comunitaria */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1.5px solid rgba(245, 158, 11, 0.18)',
                borderRadius: '16px',
                padding: '8px 10px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={15} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B', lineHeight: 1.1 }}>
                  ⭐ {profileUser.totalReactionsReceived || (userUploads.length * 3) || 0}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Reputación
                </div>
              </div>

              {/* Card 3: Rango de Comunidad */}
              <div style={{
                background: profileUser.isAlly ? 'rgba(52, 168, 83, 0.06)' : 'rgba(120, 120, 128, 0.06)',
                border: profileUser.isAlly ? '1.5px solid rgba(52, 168, 83, 0.25)' : '1.5px solid var(--card-border)',
                borderRadius: '16px',
                padding: '8px 10px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: profileUser.isAlly ? 'rgba(52, 168, 83, 0.15)' : 'rgba(120, 120, 128, 0.1)',
                  color: profileUser.isAlly ? '#34A853' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={15} />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: profileUser.isAlly ? '#34A853' : 'var(--text-main)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                  {profileUser.isAlly ? 'Aliado Oficial' : 'Estudiante'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Rango
                </div>
              </div>

              {/* Card 4: Meta Universitaria */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1.5px solid rgba(168, 85, 247, 0.18)',
                borderRadius: '16px',
                padding: '8px 10px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.14)',
                  color: '#A855F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <GraduationCap size={15} />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#A855F7', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {profileUser.universidad ? profileUser.universidad.split(' ')[0] : 'UNSA'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Meta
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────── CONTENEDOR Y TABS DEL PERFIL ──────────────── */}
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 20px' }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('muro')}
              style={{
                padding: '12px 22px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '0.92rem',
                border: activeTab === 'muro' ? 'none' : '1px solid var(--card-border)',
                background: activeTab === 'muro' ? 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)' : 'var(--card-bg)',
                color: activeTab === 'muro' ? '#FFFFFF' : 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: activeTab === 'muro' ? '0 6px 20px rgba(0, 122, 255, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={17} /> Muro Social & Aportes ({userUploads.length})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '12px 22px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '0.92rem',
                border: activeTab === 'chat' ? 'none' : '1px solid var(--card-border)',
                background: activeTab === 'chat' ? 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)' : 'var(--card-bg)',
                color: activeTab === 'chat' ? '#FFFFFF' : 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: activeTab === 'chat' ? '0 6px 20px rgba(168, 85, 247, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageSquare size={17} /> Mensajes Directos
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('guardados')}
              style={{
                padding: '12px 22px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '0.92rem',
                border: activeTab === 'guardados' ? 'none' : '1px solid var(--card-border)',
                background: activeTab === 'guardados' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'var(--card-bg)',
                color: activeTab === 'guardados' ? '#FFFFFF' : 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: activeTab === 'guardados' ? '0 6px 20px rgba(245, 158, 11, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Bookmark size={17} /> Materiales Guardados ({savedMaterials.length})
            </motion.button>
          </div>

          {activeTab === 'guardados' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Filter & Search Bar for Guardados */}
              <div className="ios-glass-card" style={{ padding: '18px 20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                {/* Search Input */}
                <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="🔍 Buscar en mis guardados por título o descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Category Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'teoria', label: 'Teoría / Tomos' },
                    { id: 'practicas', label: 'Prácticas' },
                    { id: 'examenes', label: 'Exámenes' },
                    { id: 'resumenes', label: 'Resúmenes' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: selectedCategory === cat.id ? '1.5px solid #F59E0B' : '1px solid var(--card-border)',
                        background: selectedCategory === cat.id ? 'rgba(245, 158, 11, 0.18)' : 'var(--card-bg)',
                        color: selectedCategory === cat.id ? '#D97706' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Materials Grid / List */}
              {filteredSavedMaterials.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredSavedMaterials.map((item) => {
                    const isExpanded = Boolean(expandedPreviews[item.id]);
                    const previewUrl = getPreviewUrl(item.driveUrl);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="ios-glass-card"
                        style={{
                          padding: '22px',
                          borderRadius: '24px',
                          border: '1.5px solid rgba(245, 158, 11, 0.3)',
                          background: 'var(--card-bg)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)'
                        }}
                      >
                        {/* Header & Bookmark */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: '10px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#D97706',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                textTransform: 'uppercase'
                              }}>
                                ⚡ {item.category || 'MATERIAL GUARDADO'}
                              </span>
                              {item.author && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                  Compartido por {item.author}
                                </span>
                              )}
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {item.title}
                            </h3>
                            {item.desc && (
                              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {item.desc}
                              </p>
                            )}
                          </div>

                          <BookmarkButton item={item} size="normal" showText={true} />
                        </div>

                        {/* Recuadro Mini Vista Previa (140px) */}
                        {item.driveUrl && (
                          <div
                            onClick={() => togglePreview(item.id)}
                            style={{
                              width: '100%',
                              height: '140px',
                              borderRadius: '16px',
                              border: isExpanded ? '2px solid #F59E0B' : '1.5px solid var(--card-border)',
                              background: '#FFFFFF',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Toca para desplegar vista previa interactiva"
                          >
                            {previewUrl ? (
                              <iframe
                                src={previewUrl}
                                title={item.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                  pointerEvents: 'none',
                                  background: '#FFFFFF',
                                  opacity: 0.95
                                }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', background: '#1A1A1E' }}>
                                <FileText size={36} />
                              </div>
                            )}

                            {/* Click Overlay Banner */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              padding: '10px'
                            }}>
                              <span style={{
                                background: isExpanded ? '#F59E0B' : 'rgba(0,0,0,0.85)',
                                color: '#FFFFFF',
                                padding: '6px 16px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(8px)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                {isExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                {isExpanded ? '✕ Ocultar Vista Previa' : 'Ver Vista Previa Interactiva'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Despliegue de Vista Previa Completa (Alta Definición & Fondo Blanco Claro) */}
                        <AnimatePresence>
                          {isExpanded && previewUrl && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{
                                borderRadius: '18px',
                                overflow: 'hidden',
                                border: '2px solid rgba(245, 158, 11, 0.5)',
                                height: '520px',
                                background: '#FFFFFF',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.18)'
                              }}>
                                <iframe
                                  src={previewUrl}
                                  title={item.title}
                                  style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action Buttons Bar */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--card-border)' }}>
                          {item.driveUrl && (
                            <a
                              href={item.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '10px 18px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #007AFF 0%, #0051A8 100%)',
                                color: '#FFF',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)'
                              }}
                            >
                              <ExternalLink size={16} /> Abrir Material en Drive ↗
                            </a>
                          )}

                          {item.driveUrl && (
                            <button
                              onClick={() => togglePreview(item.id)}
                              style={{
                                padding: '10px 16px',
                                borderRadius: '14px',
                                border: '1px solid var(--card-border)',
                                background: isExpanded ? 'rgba(245, 158, 11, 0.18)' : 'rgba(120, 120, 128, 0.08)',
                                color: isExpanded ? '#D97706' : 'var(--text-main)',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                              {isExpanded ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="ios-glass-card" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '28px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#F59E0B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <Bookmark size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    No tienes materiales guardados
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5, fontSize: '0.92rem' }}>
                    Puedes guardar cualquier libro, resumen o examen de la comunidad o la biblioteca haciendo clic en el botón 🔖 <strong>Guardar</strong> para tener tu propia colección personalizada.
                  </p>
                  <Link
                    to="/biblioteca"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      textDecoration: 'none',
                      fontSize: '0.92rem',
                      boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)'
                    }}
                  >
                    <BookOpen size={18} /> Explorar Biblioteca Digital ↗
                  </Link>
                </div>
              )}
            </div>
          ) : activeTab === 'chat' ? (
            <UserDirectChat
              profileUid={targetUid}
              profileName={profileUser.displayName || 'este usuario'}
              isOwnProfile={isOwnProfile}
            />
          ) : (
            <ProfileComments
              profileUid={targetUid}
              profileName={profileUser.displayName || 'este usuario'}
              userUploads={userUploads}
              onReport={(id, title, type) => setReportData({ isOpen: true, targetId: id, targetTitle: title, targetType: type })}
            />
          )}
        </div>
      </div>

      {/* 💬 Modal Flotante para Chat Directo */}
      <IOSModal
        isOpen={isDirectChatModalOpen}
        onClose={() => setIsDirectChatModalOpen(false)}
        title={`💬 Mensajes Directos con ${profileUser.displayName || 'este usuario'}`}
      >
        <UserDirectChat
          profileUid={targetUid}
          profileName={profileUser.displayName || 'este usuario'}
          isOwnProfile={isOwnProfile}
        />
      </IOSModal>

      <IOSModal
        isOpen={isPersonalizarOpen}
        onClose={() => setIsPersonalizarOpen(false)}
        title="🎨 Personalizar Perfil"
        onSave={handleSaveProfile}
        saveText="Guardar Cambios"
        isSaving={saveStatus === 'saving'}
        closeText="Entendido"
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '8px 0'
        }}>
          {/* 1. PORTADA BANNER */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '20px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖼️ 1. Banner de Portada
            </h3>
            
            {/* Live Banner Preview */}
            <div style={{
              height: `${Math.round((coverHeight / 250) * 140)}px`,
              minHeight: '90px',
              maxHeight: '240px',
              transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: '16px',
              border: '1.5px solid var(--card-border)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
              position: 'relative',
              overflow: 'hidden',
              background: selectedGradient || 'linear-gradient(135deg, #10B981, #007AFF)'
            }}>
              {customCoverUrl ? (
                coverFitMode === 'contain' ? (
                  <>
                    <img
                      src={getDirectImageUrl(customCoverUrl)}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(24px) brightness(0.96)',
                        transform: 'scale(1.15)',
                        zIndex: 0
                      }}
                    />
                    <img
                      src={getDirectImageUrl(customCoverUrl)}
                      alt="Vista previa de portada"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const driveMatch = customCoverUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                                           customCoverUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                                           customCoverUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (driveMatch && driveMatch[1]) {
                          const fallbackUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
                          if (e.target.src !== fallbackUrl) {
                            e.target.src = fallbackUrl;
                          }
                        }
                      }}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center center',
                        zIndex: 1,
                        display: 'block'
                      }}
                    />
                  </>
                ) : (
                  <img
                    src={getDirectImageUrl(customCoverUrl)}
                    alt="Vista previa de portada"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const driveMatch = customCoverUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                                         customCoverUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                                         customCoverUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                      if (driveMatch && driveMatch[1]) {
                        const fallbackUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
                        if (e.target.src !== fallbackUrl) {
                          e.target.src = fallbackUrl;
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `center ${coverPositionY}%`,
                      display: 'block'
                    }}
                  />
                )
              ) : (
                <div style={{ width: '100%', height: '100%', background: selectedGradient }} />
              )}
            </div>

            {/* Height & Position Adjustment Controls */}
            <div style={{
              background: 'rgba(120, 120, 128, 0.06)',
              padding: '14px 16px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid var(--card-border)'
            }}>
              {/* Height Control */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📏 Altura del Banner:
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-color)', background: 'rgba(0,122,255,0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                    {coverHeight} px
                  </span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="420"
                  step="10"
                  value={coverHeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCoverHeight(val);
                    setProfileUser(prev => ({ ...prev, coverHeight: val }));
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Compacto', val: 180 },
                    { label: 'Normal', val: 250 },
                    { label: 'Alto', val: 320 },
                    { label: 'Maxi', val: 380 }
                  ].map(h => (
                    <button
                      key={h.val}
                      type="button"
                      onClick={() => {
                        setCoverHeight(h.val);
                        setProfileUser(prev => ({ ...prev, coverHeight: h.val }));
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: coverHeight === h.val ? '1.5px solid var(--accent-color)' : '1px solid var(--card-border)',
                        background: coverHeight === h.val ? 'var(--accent-color)' : 'var(--card-bg)',
                        color: coverHeight === h.val ? '#FFF' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {h.label} ({h.val}px)
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Position Control */}
              {customCoverUrl && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ↕️ Encuadre Vertical (Centrado de foto):
                    </label>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-color)', background: 'rgba(0,122,255,0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                      {coverPositionY}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="2"
                    value={coverPositionY}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCoverPositionY(val);
                      setProfileUser(prev => ({ ...prev, coverPositionY: val }));
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: '⬆️ Arriba', val: 0 },
                      { label: '↕️ Centro', val: 50 },
                      { label: '⬇️ Abajo', val: 100 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => {
                          setCoverPositionY(p.val);
                          setProfileUser(prev => ({ ...prev, coverPositionY: p.val }));
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: coverPositionY === p.val ? '1.5px solid var(--accent-color)' : '1px solid var(--card-border)',
                          background: coverPositionY === p.val ? 'var(--accent-color)' : 'var(--card-bg)',
                          color: coverPositionY === p.val ? '#FFF' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modo de Ajuste / Relleno Inteligente de Bordes */}
              {customCoverUrl && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--card-border)' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                    🖼️ Modo de Ajuste de Imagen:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFitMode('contain');
                        setProfileUser(prev => ({ ...prev, coverFitMode: 'contain' }));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: coverFitMode === 'contain' ? '1.5px solid var(--accent-color)' : '1px solid var(--card-border)',
                        background: coverFitMode === 'contain' ? 'rgba(0,122,255,0.12)' : 'var(--card-bg)',
                        color: coverFitMode === 'contain' ? 'var(--accent-color)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      ✨ Relleno Inteligente de Bordes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFitMode('cover');
                        setProfileUser(prev => ({ ...prev, coverFitMode: 'cover' }));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: coverFitMode === 'cover' ? '1.5px solid var(--accent-color)' : '1px solid var(--card-border)',
                        background: coverFitMode === 'cover' ? 'rgba(0,122,255,0.12)' : 'var(--card-bg)',
                        color: coverFitMode === 'cover' ? 'var(--accent-color)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      🖼️ Llenar Completo (Recortar)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cover Type Selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCoverType('photo')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: coverType === 'photo' ? '1.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                  background: coverType === 'photo' ? 'rgba(0,122,255,0.12)' : 'var(--card-bg)',
                  color: coverType === 'photo' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                📸 Fotos Destacadas
              </button>

              <button
                type="button"
                onClick={() => {
                  setCoverType('preset');
                  setCustomCoverUrl('');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: coverType === 'preset' ? '1.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                  background: coverType === 'preset' ? 'rgba(0,122,255,0.12)' : 'var(--card-bg)',
                  color: coverType === 'preset' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ✨ Gradientes
              </button>

              <button
                type="button"
                onClick={() => setCoverType('custom')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: coverType === 'custom' ? '1.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                  background: coverType === 'custom' ? 'rgba(0,122,255,0.12)' : 'var(--card-bg)',
                  color: coverType === 'custom' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                📁 Subir Imagen / URL
              </button>
            </div>

            {/* Photo Presets Grid */}
            {coverType === 'photo' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px'
              }}>
                {COVER_PHOTO_PRESETS.map(preset => {
                  const isSelected = customCoverUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setCustomCoverUrl(preset.url);
                        setCoverType('photo');
                        setProfileUser(prev => ({ ...prev, coverUrl: preset.url }));
                      }}
                      style={{
                        height: '70px',
                        borderRadius: '14px',
                        backgroundImage: `url(${preset.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: isSelected ? '3px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '6px 8px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
                      <span style={{ position: 'relative', zIndex: 2, color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}>
                        {preset.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gradient Presets Grid */}
            {coverType === 'preset' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px'
              }}>
                {BANNER_PRESETS.map(preset => {
                  const isSelected = selectedGradient === preset.style && !customCoverUrl;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedGradient(preset.style);
                        setCustomCoverUrl('');
                        setCoverType('preset');
                        setProfileUser(prev => ({ ...prev, coverUrl: '', coverGradient: preset.style }));
                      }}
                      style={{
                        height: '60px',
                        borderRadius: '14px',
                        background: preset.style,
                        border: isSelected ? '3px solid #FFFFFF' : '2px solid transparent',
                        boxShadow: isSelected ? '0 0 0 2px var(--accent-color)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 8px',
                        textAlign: 'center',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                      }}
                    >
                      {preset.label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom File / URL Upload */}
            {coverType === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'rgba(0,122,255,0.08)',
                  border: '1.5px dashed var(--accent-color)',
                  color: 'var(--accent-color)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isUploadingCover ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {isUploadingCover ? (
                    <Loader2 size={16} className="spinning-icon" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  {isUploadingCover ? 'Subiendo portada...' : 'Elegir archivo desde mi dispositivo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    disabled={isUploadingCover}
                    style={{ display: 'none' }}
                  />
                </label>

                <input
                  type="url"
                  placeholder="O pega la URL de la imagen..."
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120,120,128,0.06)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Portadas Recientes (Máximo 3) */}
            {profileUser?.recentCovers && profileUser.recentCovers.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  🖼️ Portadas Recientes (Máx 3):
                </span>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {profileUser.recentCovers.map((cUrl, idx) => {
                    const isCurrent = customCoverUrl === cUrl;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectRecentCover(cUrl)}
                        style={{
                          width: '74px',
                          height: '42px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          flexShrink: 0,
                          border: isCurrent ? '2.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                          boxShadow: isCurrent ? '0 0 0 2px rgba(0,122,255,0.25)' : 'none'
                        }}
                        title="Usar esta portada"
                      >
                        <img src={cUrl} alt={`Portada Reciente ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. FOTO DE PERFIL & MARCO */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '20px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎓 2. Foto de Perfil & Marco
            </h3>

            {/* Avatar Preview & Upload */}
            {(() => {
              const activeFrame = AVATAR_FRAMES.find(f => f.id === selectedFrame) || AVATAR_FRAMES[0];
              const modalConicBg = `conic-gradient(from 0deg, ${creatorColors[0]}, ${creatorColors[1]}, ${creatorColors[2]}, ${creatorColors[3]}, ${creatorColors[0]})`;
              const modalGlow = `0 0 20px ${creatorColors[1]}AA, 0 0 36px ${creatorColors[2]}88, 0 0 50px ${creatorColors[3]}55`;

              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  background: 'rgba(0,122,255,0.04)',
                  padding: '16px',
                  borderRadius: '18px',
                  border: '1px solid var(--card-border)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div 
                      className={activeFrame.id === 'fuego_creador' ? 'frame-fuego-creador-container' : (activeFrame.ringClass || '')}
                      style={{
                        position: 'relative',
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        padding: activeFrame.id !== 'none' && activeFrame.id !== 'fuego_creador' && activeFrame.id !== 'arcoiris_neon' ? '5px' : '0px',
                        background: activeFrame.id === 'fuego_creador' || activeFrame.id === 'arcoiris_neon' ? 'transparent' : activeFrame.ring,
                        boxShadow: activeFrame.id === 'fuego_creador' ? modalGlow : activeFrame.glow,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {activeFrame.id === 'fuego_creador' && (
                        <div 
                          className="frame-fuego-creador-spin" 
                          style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 1, background: modalConicBg }} 
                        />
                      )}
                      {activeFrame.id === 'arcoiris_neon' && (
                        <div className="frame-arcoiris-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 1 }} />
                      )}

                      {avatarUrl || profileUser.photoURL ? (
                        <img
                          src={avatarUrl || profileUser.photoURL}
                          alt="Previa"
                          style={{
                            width: '74px',
                            height: '74px',
                            borderRadius: '50%',
                            border: '2.5px solid #0e0b16',
                            objectFit: 'cover',
                            background: '#FFFFFF',
                            position: 'relative',
                            zIndex: 2
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '50%',
                          border: '2.5px solid #0e0b16',
                          background: 'linear-gradient(135deg, var(--accent-color), #A855F7)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2.2rem',
                          fontWeight: 800,
                          position: 'relative',
                          zIndex: 2
                        }}>
                          {(editName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <label style={{
                      padding: '10px 16px',
                      borderRadius: '14px',
                      background: 'var(--accent-color)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: isUploadingAvatar ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0,122,255,0.25)'
                    }}>
                      {isUploadingAvatar ? (
                        <Loader2 size={16} className="spinning-icon" />
                      ) : (
                        <Camera size={16} />
                      )}
                      {isUploadingAvatar ? 'Subiendo foto...' : 'Subir Foto de Perfil'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        disabled={isUploadingAvatar}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Fotos Recientes (Máximo 3) */}
                    {profileUser?.recentPhotos && profileUser.recentPhotos.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          📷 Fotos Recientes (Máx 3):
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                          {profileUser.recentPhotos.map((photoUrl, idx) => {
                            const isCurrent = (avatarUrl || profileUser.photoURL) === photoUrl;
                            return (
                              <div
                                key={idx}
                                onClick={() => handleSelectRecentPhoto(photoUrl)}
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  border: isCurrent ? '2.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                                  boxShadow: isCurrent ? '0 0 0 2px rgba(0,122,255,0.25)' : 'none',
                                  transition: 'transform 0.15s ease'
                                }}
                                title="Usar esta foto"
                              >
                                <img src={photoUrl} alt={`Reciente ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Frame Selector Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                Selecciona tu Marco:
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '10px'
              }}>
                {AVATAR_FRAMES.map(frame => {
                  const isSelected = selectedFrame === frame.id;
                  const isLocked = Boolean(frame.adminOnly && !isAdmin && !isAuthorOfFirebase(user?.email));
                  const gridConicBg = `conic-gradient(from 0deg, ${creatorColors[0]}, ${creatorColors[1]}, ${creatorColors[2]}, ${creatorColors[3]}, ${creatorColors[0]})`;
                  return (
                    <div
                      key={frame.id}
                      onClick={() => {
                        if (isLocked) {
                          showNotice("Marco Exclusivo 👑", "El Marco Fuego Creador es exclusivo para el Creador / Administrador RUMBO.");
                          return;
                        }
                        setSelectedFrame(frame.id);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid var(--accent-color)' : '1.5px solid var(--card-border)',
                        background: isSelected ? 'rgba(0,122,255,0.08)' : (isLocked ? 'rgba(120,120,128,0.06)' : 'var(--card-bg)'),
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.75 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div 
                        className={frame.id === 'fuego_creador' ? 'frame-fuego-creador-container' : (frame.ringClass || '')}
                        style={{
                          position: 'relative',
                          width: '42px',
                          height: '42px',
                          padding: frame.id !== 'none' && frame.id !== 'fuego_creador' && frame.id !== 'arcoiris_neon' ? '3px' : '0px',
                          borderRadius: '50%',
                          background: frame.id === 'fuego_creador' || frame.id === 'arcoiris_neon' ? 'transparent' : frame.ring,
                          boxShadow: frame.glow,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {frame.id === 'fuego_creador' && (
                          <div 
                            className="frame-fuego-creador-spin" 
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 1, background: gridConicBg }} 
                          />
                        )}
                        {frame.id === 'arcoiris_neon' && (
                          <div className="frame-arcoiris-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 1 }} />
                        )}
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'var(--accent-color)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          position: 'relative',
                          zIndex: 2
                        }}>
                          {(editName || 'U')[0].toUpperCase()}
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? 'var(--accent-color)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {frame.label}
                          {isLocked && <span style={{ fontSize: '0.72rem' }}>🔒</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {frame.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 👑 EXCLUSIVO CREADOR / ADMIN: ESTUDIO DE 4 COLORES EN GRADIENTE GIRATORIO */}
            {isUserAdmin && (
              <div style={{
                marginTop: '10px',
                background: 'linear-gradient(135deg, rgba(112, 26, 117, 0.16) 0%, rgba(220, 38, 38, 0.14) 40%, rgba(251, 191, 36, 0.12) 100%)',
                border: '2px solid rgba(251, 191, 36, 0.45)',
                borderRadius: '20px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 30px rgba(251, 191, 36, 0.12)',
                position: 'relative'
              }}>
                {/* Header VIP Secret Menu */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderBottom: '1px solid rgba(251, 191, 36, 0.25)',
                  paddingBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #F59E0B, #DC2626)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                    }}>
                      👑
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Estudio Exclusivo Creador (4 Colores 360°)
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: '#DC2626', color: '#fff', fontWeight: 800 }}>SOLO TÚ</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Personaliza los 4 colores exactos que rotan en tu marco animado en toda la plataforma
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFrame('fuego_creador')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '12px',
                      background: selectedFrame === 'fuego_creador' ? '#10B981' : 'rgba(251, 191, 36, 0.18)',
                      color: selectedFrame === 'fuego_creador' ? '#FFFFFF' : '#FDE68A',
                      border: selectedFrame === 'fuego_creador' ? '1.5px solid #10B981' : '1px solid rgba(251, 191, 36, 0.4)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {selectedFrame === 'fuego_creador' ? '✓ Marco Fuego Activo' : '⚡ Activar mi Marco'}
                  </button>
                </div>

                {/* Live Preview Bar of the 4 Colors with animated conic gradient */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  {/* Mini spinning avatar with current 4 colors */}
                  <div 
                    className="frame-fuego-creador-container"
                    style={{
                      width: '54px',
                      height: '54px',
                      boxShadow: `0 0 16px ${creatorColors[1]}AA, 0 0 30px ${creatorColors[2]}88`,
                      flexShrink: 0
                    }}
                  >
                    <div 
                      className="frame-fuego-creador-spin" 
                      style={{ background: `conic-gradient(from 0deg, ${creatorColors[0]}, ${creatorColors[1]}, ${creatorColors[2]}, ${creatorColors[3]}, ${creatorColors[0]})` }} 
                    />
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      position: 'relative',
                      zIndex: 2,
                      overflow: 'hidden',
                      background: '#0e0b16',
                      border: '1.5px solid rgba(15, 8, 25, 0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1rem'
                    }}>
                      {avatarUrl || profileUser?.photoURL ? (
                        <img src={avatarUrl || profileUser.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (editName || 'U')[0].toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* 4-color gradient ribbon bar */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#FDE68A', marginBottom: '6px' }}>
                      Tira de Gradiente Conectado:
                    </div>
                    <div style={{
                      height: '14px',
                      borderRadius: '8px',
                      background: `linear-gradient(to right, ${creatorColors[0]}, ${creatorColors[1]}, ${creatorColors[2]}, ${creatorColors[3]}, ${creatorColors[0]})`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }} />
                  </div>
                </div>

                {/* 4 Interactive Color Pickers */}
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                    🎨 Configura los 4 Colores del Gradiente:
                  </span>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px'
                  }}>
                    {['Color 1 (Inicio)', 'Color 2 (Cuerpo)', 'Color 3 (Fuego)', 'Color 4 (Destello)'].map((label, cIdx) => (
                      <div 
                        key={cIdx}
                        style={{
                          background: 'rgba(120,120,128,0.08)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '14px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="color"
                            value={creatorColors[cIdx] || '#FF5500'}
                            onChange={(e) => {
                              const newColors = [...creatorColors];
                              newColors[cIdx] = e.target.value;
                              updateCreatorColorsLive(newColors);
                            }}
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              background: 'transparent'
                            }}
                          />
                          <input
                            type="text"
                            value={creatorColors[cIdx] || ''}
                            onChange={(e) => {
                              const newColors = [...creatorColors];
                              newColors[cIdx] = e.target.value;
                              updateCreatorColorsLive(newColors);
                            }}
                            placeholder="#HEX"
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              border: '1px solid var(--card-border)',
                              background: 'var(--card-bg)',
                              color: 'var(--text-main)',
                              fontSize: '0.78rem',
                              fontFamily: 'monospace',
                              fontWeight: 700
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Presets for Instant 4-color palettes */}
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    ⚡ Paletas Predefinidas Recomendadas:
                  </span>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '8px'
                  }}>
                    {[
                      { name: '🔥 Carmesí & Fuego', colors: ['#701A75', '#DC2626', '#FF8A00', '#FBBF24'] },
                      { name: '🌌 Galaxia Ciberpunk', colors: ['#06B6D4', '#8B5CF6', '#EC4899', '#3B82F6'] },
                      { name: '👑 Oro & Esmeralda', colors: ['#059669', '#10B981', '#F59E0B', '#FEF08A'] },
                      { name: '💜 Amatista Mística', colors: ['#581C87', '#9333EA', '#BE123C', '#FB7185'] },
                      { name: '❄️ Hielo & Neón', colors: ['#0284C7', '#38BDF8', '#06B6D4', '#E0F2FE'] },
                      { name: '🌋 Volcán Misti', colors: ['#450A0A', '#991B1B', '#EA580C', '#FDE047'] }
                    ].map((preset, pIdx) => {
                      const isMatching = creatorColors.every((c, i) => c.toLowerCase() === preset.colors[i].toLowerCase());
                      return (
                        <div
                          key={pIdx}
                          onClick={() => {
                            updateCreatorColorsLive(preset.colors);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '12px',
                            background: isMatching ? 'rgba(251, 191, 36, 0.25)' : 'rgba(120,120,128,0.06)',
                            border: isMatching ? '1.5px solid #F59E0B' : '1px solid var(--card-border)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: isMatching ? '#FDE68A' : 'var(--text-main)' }}>
                            {preset.name}
                          </span>
                          <div style={{
                            height: '8px',
                            borderRadius: '4px',
                            background: `linear-gradient(to right, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]}, ${preset.colors[3]})`
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. DESCRIPCIÓN & NOMBRE */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '20px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✍️ 3. Nombre & Descripción
            </h3>

            {/* Display Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nombre visible
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tu nombre o alias"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--card-border)',
                  background: 'rgba(120,120,128,0.06)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Frase / Bio / Descripción */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Descripción / Frase de Perfil
              </label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Ej. Preparándome para ingresar a la UNSA 🩺🎯 Compartiendo resúmenes agustinos."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--card-border)',
                  background: 'rgba(120,120,128,0.06)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                  lineHeight: 1.4
                }}
              />
            </div>
          </div>

          {/* PERSISTENT BOTTOM SAVE BAR */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderTop: '1px solid var(--card-border)',
            paddingTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveProfile}
                disabled={saveStatus === 'saving'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#34A853',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(52, 168, 83, 0.35)'
                }}
              >
                <Save size={18} />
                {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
              </motion.button>

              {saveStatus === 'success' && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ color: '#34A853', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={16} /> ¡Guardado!
                </motion.span>
              )}

              {saveStatus === 'error' && (
                <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '0.88rem' }}>
                  ⚠️ Error al guardar.
                </span>
              )}
            </div>

            <button
              onClick={() => setIsPersonalizarOpen(false)}
              style={{
                padding: '10px 18px',
                borderRadius: '14px',
                border: '1.5px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </IOSModal>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: CONFIGURACIÓN & CUENTA (CERRAR SESIÓN)                    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <IOSModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="⚙️ Configuración & Ajustes"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 16px' }}>
            Gestiona tus datos de acceso, credenciales de Firebase y sesión de tu cuenta RUMBO.
          </p>

          {/* Account Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {user && (
              <>
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: 'rgba(120, 120, 128, 0.06)',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                      Identificador de Usuario (UID Firebase)
                    </div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
                      {user.uid}
                    </div>
                  </div>
                  <button
                    onClick={copyUid}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: copiedUid ? '#34A853' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {copiedUid ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUid ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>

                <div style={{
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: 'rgba(120, 120, 128, 0.06)',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                      Correo Electrónico
                    </div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
                      {user.email || 'Sin correo asociado'}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: 'rgba(120, 120, 128, 0.06)',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                      Proveedor de Autenticación
                    </div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
                      {user.providerData?.[0]?.providerId === 'google.com' ? '🌐 Google OAuth 2.0' : '📧 Correo & Contraseña'}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={{
              padding: '16px 20px',
              borderRadius: '18px',
              background: 'rgba(120, 120, 128, 0.06)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Rango en la Plataforma
                </div>
                <div style={{ color: 'var(--accent-color)', fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
                  {isUserAdmin ? '👑 Administrador Principal' : (profileUser.isAlly ? '🌟 Aliado Oficial Verificado' : '🎓 Estudiante RUMBO')}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Button */}
          {isUserAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsSettingsOpen(false);
                navigate('/admin');
              }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '18px',
                border: 'none',
                background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '10px',
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)'
              }}
            >
              <Shield size={20} />
              Abrir Panel de Administrador RUMBO 🛠️
            </motion.button>
          )}

          {/* LOGOUT */}
          <div style={{ borderTop: '1.5px dashed var(--card-border)', paddingTop: '20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Zona de Sesión
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Cierra la sesión activa en este navegador. Tus aportes y configuraciones se mantendrán guardados.
              </p>
            </div>

            {!showLogoutConfirm ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(255,59,48,0.3)',
                  background: 'rgba(255,59,48,0.08)',
                  color: '#ff3b30',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={18} />
                Cerrar Sesión
              </motion.button>
            ) : (
              <div style={{
                padding: '18px',
                borderRadius: '18px',
                background: 'rgba(255,59,48,0.1)',
                border: '1.5px solid rgba(255,59,48,0.3)',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#ff3b30', fontSize: '0.95rem' }}>
                  ¿Estás seguro de que deseas cerrar sesión?
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#ff3b30',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Sí, Cerrar Sesión
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </IOSModal>

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsSuccessOpen(true);
        }}
      />

      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="¡Aporte Publicado en Tu Muro!"
        message="Tu material ya está disponible en tu perfil y en la Biblioteca comunitaria."
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportData.isOpen}
        onClose={() => setReportData({ isOpen: false, targetId: null, targetTitle: '', targetType: 'material' })}
        targetId={reportData.targetId}
        targetTitle={reportData.targetTitle}
        targetType={reportData.targetType}
      />

      {/* NoticeModal replacing browser alerts */}
      <NoticeModal
        isOpen={noticeModal.isOpen}
        title={noticeModal.title}
        message={noticeModal.message}
        onClose={() => setNoticeModal({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};
