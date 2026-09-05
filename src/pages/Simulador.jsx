import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Layers, 
  Calculator, 
  ChevronRight, 
  ChevronLeft, 
  Minus, 
  Plus, 
  Sparkles, 
  PlusCircle, 
  X, 
  CheckCircle, 
  BookOpen,
  RotateCcw,
  Target,
  Award,
  Zap,
  Flame,
  Check,
  Flag,
  Trash2,
  Edit3,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  Maximize2
} from 'lucide-react';
import { InspirationalDailyBanner } from '../components/InspirationalDailyBanner';
import { datosSimulador } from '../data/simuladorData';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';
import { uploadFileReliable } from '../lib/storageHelper';

export const cleanOptionText = (text) => {
  if (!text) return '';
  return String(text).replace(/^[A-Ea-e][\)\.\:\-]\s*|^\([A-Ea-e]\)\s*/, '').trim();
};

export const normalizeAnswerIndex = (ans, options = null) => {
  if (ans === undefined || ans === null) return 0;

  // 1. Si se pasa el arreglo de opciones y ans coincide con el texto de alguna opción
  if (Array.isArray(options) && typeof ans === 'string') {
    const cleanAns = cleanOptionText(ans).toLowerCase();
    const foundIdx = options.findIndex(opt => {
      const cleanOpt = cleanOptionText(opt).toLowerCase();
      return cleanOpt === cleanAns || cleanOpt === String(ans).trim().toLowerCase();
    });
    if (foundIdx !== -1) return foundIdx;
  }

  // 2. Si ya es un número
  if (typeof ans === 'number') {
    if (Array.isArray(options) && ans > options.length - 1 && ans <= options.length) {
      return ans - 1; // Ajuste si se guardó 1-indexado (ej. 1 a 5)
    }
    return Math.max(0, ans);
  }

  const str = String(ans).trim().toUpperCase();

  // 3. Buscar letra A, B, C, D, E
  const letterMatch = str.match(/([A-E])/);
  if (letterMatch && (str.length <= 8 || str.includes('CLAVE') || str.includes('OPCI') || str.includes('RESPUESTA'))) {
    const char = letterMatch[1];
    if (char === 'A') return 0;
    if (char === 'B') return 1;
    if (char === 'C') return 2;
    if (char === 'D') return 3;
    if (char === 'E') return 4;
  }

  // 4. Buscar número directo en string '0', '1', '2', '3', '4'
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed)) {
    if (Array.isArray(options) && parsed > options.length - 1 && parsed <= options.length) {
      return parsed - 1;
    }
    return Math.max(0, parsed);
  }

  return 0;
};

const DEFAULT_FLASHCARDS = [
  { id: '1', q: "¿Qué es la Mitosis?", a: "Proceso de división celular que da como resultado dos células hijas genéticamente idénticas a la célula madre.", subject: "Biología", authorName: "Comunidad RUMBO" },
  { id: '2', q: "¿Quién postuló la Teoría de la Relatividad?", a: "Albert Einstein en 1905 (Especial) y 1915 (General).", subject: "Física", authorName: "Comunidad RUMBO" },
  { id: '3', q: "¿Cuál es la capital del Imperio Incaico?", a: "El Cusco (Qosqo), considerado el 'Ombligo del mundo'.", subject: "Historia", authorName: "Comunidad RUMBO" },
  { id: '4', q: "¿Cuál es la ley periódica de Mendeleiev?", a: "Las propiedades de los elementos son función periódica de sus masas atómicas.", subject: "Química", authorName: "Comunidad RUMBO" }
];

const examData = [
  { id: 1, q: "En la anatomía humana, ¿cuál es el hueso más largo?", options: ["Fémur", "Tibia", "Húmero", "Peroné"], answer: 0 },
  { id: 2, q: "¿Cuál es la obra cumbre de César Vallejo?", options: ["Los Heraldos Negros", "Trilce", "Poemas Humanos", "Tungsteno"], answer: 1 },
];

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(4)).toString();
}

const AREA_CONFIG = {
  'Sociales': {
    name: 'Ciencias Sociales',
    badge: '🏛️ Sociales',
    activeGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    activeShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
    border: 'rgba(245, 158, 11, 0.45)',
    tint: 'rgba(245, 158, 11, 0.1)',
    accent: '#F59E0B',
    accentDark: '#B45309'
  },
  'Ingenierías': {
    name: 'Ingenierías',
    badge: '⚙️ Ingenierías',
    activeGradient: 'linear-gradient(135deg, #007AFF 0%, #2563EB 100%)',
    activeShadow: '0 8px 24px rgba(0, 122, 255, 0.4)',
    border: 'rgba(0, 122, 255, 0.45)',
    tint: 'rgba(0, 122, 255, 0.1)',
    accent: '#007AFF',
    accentDark: '#1D4ED8'
  },
  'Biomédicas': {
    name: 'Biomédicas',
    badge: '🧬 Biomédicas',
    activeGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    activeShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
    border: 'rgba(16, 185, 129, 0.45)',
    tint: 'rgba(16, 185, 129, 0.1)',
    accent: '#10B981',
    accentDark: '#047857'
  }
};

const getCategoryStyle = (curso) => {
  const c = curso.toLowerCase();
  if (c.includes('aptitud') || c.includes('lógico') || c.includes('verbal')) {
    return {
      icon: '🧠',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      lightBg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.35)',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      color: '#2563EB'
    };
  }
  if (c.includes('mate') || c.includes('álgebra') || c.includes('geom') || c.includes('trig') || c.includes('arit')) {
    return {
      icon: '📐',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      lightBg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.35)',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      color: '#7C3AED'
    };
  }
  if (c.includes('cien') || c.includes('físic') || c.includes('quím') || c.includes('bio') || c.includes('anat')) {
    return {
      icon: '🧪',
      gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      lightBg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.35)',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      color: '#059669'
    };
  }
  return {
    icon: '📚',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    lightBg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.35)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    color: '#D97706'
  };
};

export const Simulador = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('puntaje'); // Default to puntaje to show user
  const [reportData, setReportData] = useState({ isOpen: false, targetId: null, targetTitle: '', targetType: 'flashcard' });
  
  // Flashcards state
  const [communityCards, setCommunityCards] = useState(DEFAULT_FLASHCARDS);
  const [selectedSubject, setSelectedSubject] = useState('Todos');
  const [cardSearch, setCardSearch] = useState('');
  const [cardAuthorFilter, setCardAuthorFilter] = useState('todos');
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [newCard, setNewCard] = useState({ q: '', a: '', subject: 'Biología', imageUrl: '' });
  const [cardImageUploading, setCardImageUploading] = useState(false);
  const [cardImageProgress, setCardImageProgress] = useState(0);
  const [creating, setCreating] = useState(false);

  // Subscribe to community flashcards
  useEffect(() => {
    try {
      const q = query(collection(db, 'flashcards'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setCommunityCards([...docs, ...DEFAULT_FLASHCARDS]);
        }
      }, (err) => {
        console.warn("Flashcards listener error:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not subscribe to flashcards:", e);
    }
  }, []);

  const handleSaveFlashcard = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCard.q.trim() || !newCard.a.trim() || creating) return;
    setCreating(true);
    try {
      const cardPayload = {
        q: newCard.q.trim(),
        a: newCard.a.trim(),
        subject: newCard.subject,
        imageUrl: (newCard.imageUrl || '').trim()
      };

      if (editingCardId) {
        // Edit existing card
        await updateDoc(doc(db, 'flashcards', editingCardId), cardPayload);
      } else {
        // Create new card
        await addDoc(collection(db, 'flashcards'), {
          ...cardPayload,
          authorName: user?.displayName || 'Estudiante RUMBO',
          authorUid: user?.uid || null,
          createdAt: serverTimestamp()
        });
      }
      setNewCard({ q: '', a: '', subject: 'Biología', imageUrl: '' });
      setEditingCardId(null);
      setIsCreateOpen(false);
    } catch (err) {
      alert("Error al guardar tarjeta: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditFlashcard = (card) => {
    if (!card.id || card.id === '1' || card.id === '2' || card.id === '3' || card.id === '4') {
      alert("Esta es una tarjeta predeterminada del sistema.");
      return;
    }
    setEditingCardId(card.id);
    setNewCard({ 
      q: card.q || '', 
      a: card.a || '', 
      subject: card.subject || 'Biología',
      imageUrl: card.imageUrl || card.img || ''
    });
    setIsCreateOpen(true);
  };

  // Group Flashcards Authors for filtering
  const flashcardAuthors = useMemo(() => {
    const map = {};
    communityCards.forEach(c => {
      const name = c.authorName || 'Comunidad RUMBO';
      const key = c.authorUid ? c.authorUid : name;
      if (!map[key]) {
        map[key] = { key, name };
      }
    });
    return Object.values(map);
  }, [communityCards]);

  const filteredCards = useMemo(() => {
    return communityCards.filter(c => {
      const matchSubject = selectedSubject === 'Todos' || c.subject === selectedSubject;
      const qText = (c.q || '').toLowerCase();
      const aText = (c.a || '').toLowerCase();
      const sText = (c.subject || '').toLowerCase();
      const authorText = (c.authorName || '').toLowerCase();
      const search = cardSearch.toLowerCase().trim();
      const matchSearch = !search || qText.includes(search) || aText.includes(search) || sText.includes(search) || authorText.includes(search);
      
      const authorKey = c.authorUid ? c.authorUid : (c.authorName || 'Comunidad RUMBO');
      const matchAuthor = cardAuthorFilter === 'todos' || authorKey === cardAuthorFilter;

      return matchSubject && matchSearch && matchAuthor;
    });
  }, [communityCards, selectedSubject, cardSearch, cardAuthorFilter]);

  const activeCardIndex = Math.min(currentCard, Math.max(0, filteredCards.length - 1));

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % Math.max(1, filteredCards.length));
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + filteredCards.length) % Math.max(1, filteredCards.length));
  };

  // Exam Questions State (Community + Default)
  const [communityExamQuestions, setCommunityExamQuestions] = useState(examData);
  const [examSearch, setExamSearch] = useState('');
  const [examAuthorFilter, setExamAuthorFilter] = useState('todos');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userExamAnswers, setUserExamAnswers] = useState({}); // { [qIndex]: optionIndex }
  const [examResultsModal, setExamResultsModal] = useState({ isOpen: false, score: 0, total: 0, details: [] });
  const [isExamCreateOpen, setIsExamCreateOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examImageUploading, setExamImageUploading] = useState(false);
  const [examImageProgress, setExamImageProgress] = useState(0);
  const [newExamQuestion, setNewExamQuestion] = useState({
    q: '',
    opt0: '',
    opt1: '',
    opt2: '',
    opt3: '',
    opt4: '',
    answer: 0,
    imageUrl: ''
  });

  // Subscribe to community exam questions
  useEffect(() => {
    try {
      const q = query(collection(db, 'preguntas_examen'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setCommunityExamQuestions([...docs, ...examData]);
        }
      }, (err) => {
        console.warn("Exam questions listener notice:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not subscribe to exam questions:", e);
    }
  }, []);

  const handleSaveExamQuestion = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newExamQuestion.q.trim() || !newExamQuestion.opt0.trim() || !newExamQuestion.opt1.trim() || creating) return;
    setCreating(true);
    try {
      // Build options array cleanly (supporting up to 5 options A..E)
      const rawOptions = [
        newExamQuestion.opt0.trim(),
        newExamQuestion.opt1.trim(),
        newExamQuestion.opt2.trim(),
        newExamQuestion.opt3.trim(),
        newExamQuestion.opt4.trim()
      ].filter((op, i) => op.length > 0 || i < 2);

      const payload = {
        q: newExamQuestion.q.trim(),
        options: rawOptions,
        answer: normalizeAnswerIndex(newExamQuestion.answer, rawOptions),
        imageUrl: (newExamQuestion.imageUrl || '').trim(),
        authorName: user?.displayName || 'Estudiante RUMBO',
        authorUid: user?.uid || null,
        createdAt: serverTimestamp()
      };

      if (editingExamId) {
        await updateDoc(doc(db, 'preguntas_examen', editingExamId), payload);
      } else {
        await addDoc(collection(db, 'preguntas_examen'), payload);
      }

      setNewExamQuestion({ q: '', opt0: '', opt1: '', opt2: '', opt3: '', opt4: '', answer: 0, imageUrl: '' });
      setEditingExamId(null);
      setIsExamCreateOpen(false);
    } catch (err) {
      alert("Error al guardar pregunta: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditExam = (qItem) => {
    if (!qItem.id || qItem.id === 1 || qItem.id === 2) {
      alert("Esta es una pregunta predeterminada del sistema.");
      return;
    }
    setEditingExamId(qItem.id);
    setNewExamQuestion({
      q: qItem.q || '',
      opt0: qItem.options?.[0] || '',
      opt1: qItem.options?.[1] || '',
      opt2: qItem.options?.[2] || '',
      opt3: qItem.options?.[3] || '',
      opt4: qItem.options?.[4] || '',
      answer: normalizeAnswerIndex(qItem.answer, qItem.options),
      imageUrl: qItem.imageUrl || qItem.img || ''
    });
    setIsExamCreateOpen(true);
  };

  // Group Exam Questions Authors for filtering
  const examAuthors = useMemo(() => {
    const map = {};
    communityExamQuestions.forEach(q => {
      const name = q.authorName || 'Comunidad RUMBO';
      const key = q.authorUid ? q.authorUid : name;
      if (!map[key]) {
        map[key] = { key, name };
      }
    });
    return Object.values(map);
  }, [communityExamQuestions]);

  const filteredExamQuestions = useMemo(() => {
    return communityExamQuestions.filter(item => {
      const qText = (item.q || '').toLowerCase();
      const optionsText = (item.options || []).join(' ').toLowerCase();
      const authorText = (item.authorName || '').toLowerCase();
      const search = examSearch.toLowerCase().trim();
      const matchSearch = !search || qText.includes(search) || optionsText.includes(search) || authorText.includes(search);

      const authorKey = item.authorUid ? item.authorUid : (item.authorName || 'Comunidad RUMBO');
      const matchAuthor = examAuthorFilter === 'todos' || authorKey === examAuthorFilter;

      return matchSearch && matchAuthor;
    });
  }, [communityExamQuestions, examSearch, examAuthorFilter]);

  // Simulador Puntaje State
  const [simArea, setSimArea] = useState('Sociales');
  const [aciertos, setAciertos] = useState({}); // { [asignatura_name]: number }
  
  // Reset aciertos when area changes
  useEffect(() => {
    setAciertos({});
  }, [simArea]);

  const handleAciertosChange = (asignatura, maxPreguntas, value) => {
    let num = parseInt(value, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > maxPreguntas) num = maxPreguntas;
    
    setAciertos(prev => ({
      ...prev,
      [asignatura]: num
    }));
  };

  const handleResetAciertos = () => {
    setAciertos({});
  };

  const currentSimData = datosSimulador[simArea] || [];
  
  // Group by curso
  const groupedSimData = useMemo(() => {
    const groups = {};
    const order = [];
    currentSimData.forEach(item => {
      if (!groups[item.curso]) {
        groups[item.curso] = [];
        order.push(item.curso);
      }
      groups[item.curso].push(item);
    });
    return { groups, order };
  }, [currentSimData]);

  const totalPuntaje = useMemo(() => {
    let total = 0;
    currentSimData.forEach(item => {
      const val = aciertos[item.asignatura] || 0;
      total += val * item.valor;
    });
    return total;
  }, [aciertos, currentSimData]);

  const totalAciertosCount = useMemo(() => {
    return Object.values(aciertos).reduce((acc, v) => acc + (v || 0), 0);
  }, [aciertos]);

  const totalPreguntasMax = useMemo(() => {
    return currentSimData.reduce((acc, item) => acc + (item.preguntas || 0), 0);
  }, [currentSimData]);

  const currentAreaConfig = AREA_CONFIG[simArea] || AREA_CONFIG['Sociales'];

  return (
    <div className="page-container" style={{ paddingBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Frase / Versículo del Día */}
      <InspirationalDailyBanner />
      
      {/* Header with vibrant design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px', maxWidth: '700px' }}>
        
        {/* Glow pill badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(168, 85, 247, 0.15))',
          border: '1px solid rgba(0, 122, 255, 0.25)',
          color: 'var(--accent-color)',
          fontSize: '0.85rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '16px',
          boxShadow: '0 4px 14px rgba(0, 122, 255, 0.12)'
        }}>
          <Sparkles size={15} /> SIMULADOR & EXAMEN OFICIAL UNSA
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2rem, 4vw, 2.8rem)', 
          fontWeight: 900, 
          color: 'var(--text-main)', 
          marginBottom: '12px',
          letterSpacing: '-0.03em',
          lineHeight: 1.15
        }}>
          Simulador Académico
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
          Calcula con precisión tu puntaje ponderado oficial, practica con flashcards interactivas y pon a prueba tu preparación para el examen de admisión.
        </p>
      </motion.div>

      {/* Tabs with high-contrast vibrant styles */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '36px', 
          background: 'var(--card-bg)', 
          padding: '8px', 
          borderRadius: '24px', 
          backdropFilter: 'blur(20px)', 
          border: '1.5px solid var(--card-border)', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)'
        }}>
        <button 
          onClick={() => setActiveTab('flashcards')}
          style={{ 
            padding: '12px 22px', 
            borderRadius: '16px', 
            border: activeTab === 'flashcards' ? 'none' : '1px solid transparent', 
            background: activeTab === 'flashcards' ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : 'transparent',
            color: activeTab === 'flashcards' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'flashcards' ? '0 8px 20px rgba(99, 102, 241, 0.35)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}>
          <Layers size={18} />
          Flashcards
        </button>

        <button 
          onClick={() => setActiveTab('examen')}
          style={{ 
            padding: '12px 22px', 
            borderRadius: '16px', 
            border: activeTab === 'examen' ? 'none' : '1px solid transparent', 
            background: activeTab === 'examen' ? 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)' : 'transparent',
            color: activeTab === 'examen' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'examen' ? '0 8px 20px rgba(244, 63, 94, 0.35)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}>
          <Brain size={18} />
          Examen Rápido
        </button>

        <button 
          onClick={() => setActiveTab('puntaje')}
          style={{ 
            padding: '12px 22px', 
            borderRadius: '16px', 
            border: activeTab === 'puntaje' ? 'none' : '1px solid transparent', 
            background: activeTab === 'puntaje' ? 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)' : 'transparent',
            color: activeTab === 'puntaje' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'puntaje' ? '0 8px 20px rgba(0, 122, 255, 0.35)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}>
          <Calculator size={18} />
          Calculadora de Puntaje
        </button>
      </motion.div>

      {/* Content Area */}
      <div style={{ width: '100%', maxWidth: '840px' }}>
        
        <AnimatePresence mode="wait">
          {activeTab === 'flashcards' && (
            <motion.div 
              key="flashcards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
            >
              {/* Header with search, subject dropdown, author filter and "+ Crear Tarjeta" */}
              <div style={{
                width: '100%',
                maxWidth: '600px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                  <input
                    type="text"
                    value={cardSearch}
                    onChange={(e) => { setCardSearch(e.target.value); setCurrentCard(0); }}
                    placeholder="🔍 Buscar tema, pregunta o creador..."
                    style={{
                      flex: '1 1 200px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  />

                  {/* Dropdown de Temas/Materias (ideal para móviles y evitar colapso) */}
                  <select
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); setCurrentCard(0); setIsFlipped(false); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <option value="Todos">📚 Todos los Temas</option>
                    {['Biología', 'Anatomía', 'Química', 'Física', 'Historia', 'Geografía', 'Lenguaje', 'Literatura', 'Matemática', 'Filosofía', 'Psicología'].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>

                  {/* Dropdown de Filtrado por Usuario Creador */}
                  <select
                    value={cardAuthorFilter}
                    onChange={(e) => { setCardAuthorFilter(e.target.value); setCurrentCard(0); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <option value="todos">👤 Todos los Creadores</option>
                    {flashcardAuthors.map(auth => (
                      <option key={auth.key} value={auth.key}>
                        👤 {auth.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsCreateOpen(true)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
                      transition: 'all 0.2s ease',
                      marginLeft: 'auto'
                    }}
                  >
                    <PlusCircle size={16} /> + Crear Tarjeta
                  </button>
                </div>
              </div>

              {/* Flashcard 3D Scene */}
              {filteredCards.length > 0 ? (
                <div style={{ perspective: '1000px', width: '100%', maxWidth: '600px', height: '340px', marginBottom: '28px' }}>
                  <motion.div
                    onClick={() => setIsFlipped(!isFlipped)}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Front */}
                    <div className="ios-glass-card" style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '24px 28px',
                      textAlign: 'center',
                      borderRadius: '26px',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(0,122,255,0.1)', color: 'var(--accent-color)', padding: '4px 12px', borderRadius: '10px', fontWeight: 800 }}>
                          {filteredCards[activeCardIndex]?.subject || 'General'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(isAdmin || (user && user.uid === filteredCards[activeCardIndex]?.authorUid)) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditFlashcard(filteredCards[activeCardIndex]);
                                }}
                                title="Editar Tarjeta"
                                style={{ background: 'rgba(0,122,255,0.12)', border: 'none', color: 'var(--accent-color)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cardToDelete = filteredCards[activeCardIndex];
                                  if (!cardToDelete.id || cardToDelete.id === '1' || cardToDelete.id === '2' || cardToDelete.id === '3' || cardToDelete.id === '4') {
                                    alert("Esta es una tarjeta predeterminada del sistema.");
                                    return;
                                  }
                                  if (window.confirm("¿Deseas eliminar esta tarjeta de repaso?")) {
                                    deleteDoc(doc(db, 'flashcards', cardToDelete.id)).catch(err => alert("Error al eliminar: " + err.message));
                                  }
                                }}
                                title="Eliminar Tarjeta"
                                style={{ background: 'rgba(239, 68, 68, 0.12)', border: 'none', color: '#EF4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportData({
                                isOpen: true,
                                targetId: filteredCards[activeCardIndex]?.id || 'flashcard_item',
                                targetTitle: filteredCards[activeCardIndex]?.q || 'Tarjeta Flashcard',
                                targetType: 'flashcard'
                              });
                            }}
                            title="Reportar Tarjeta"
                            style={{ background: 'rgba(120,120,128,0.12)', border: 'none', color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <Flag size={15} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Image if present */}
                      {filteredCards[activeCardIndex]?.imageUrl && (
                        <div style={{ margin: '10px 0', textAlign: 'center', width: '100%' }}>
                          <img
                            src={filteredCards[activeCardIndex].imageUrl}
                            alt="Gráfico de la tarjeta"
                            style={{
                              maxHeight: '140px',
                              maxWidth: '100%',
                              borderRadius: '14px',
                              objectFit: 'contain',
                              border: '1.5px solid var(--card-border)',
                              background: 'rgba(0,0,0,0.02)'
                            }}
                          />
                        </div>
                      )}
                      
                      <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', fontWeight: 700, lineHeight: 1.45, margin: '12px 0', wordBreak: 'break-word' }}>
                        {filteredCards[activeCardIndex]?.q}
                      </h2>
                      
                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        👆 Toca para ver la respuesta
                      </p>
                    </div>

                    {/* Back */}
                    <div className="ios-glass-card" style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '24px 28px',
                      textAlign: 'center',
                      transform: 'rotateY(180deg)',
                      background: 'linear-gradient(135deg, #007aff, #6366F1)',
                      border: 'none',
                      borderRadius: '26px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 800 }}>
                          Respuesta & Fundamento
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(isAdmin || (user && user.uid === filteredCards[activeCardIndex]?.authorUid)) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cardToDelete = filteredCards[activeCardIndex];
                                if (!cardToDelete.id || cardToDelete.id === '1' || cardToDelete.id === '2' || cardToDelete.id === '3' || cardToDelete.id === '4') {
                                  alert("Esta es una tarjeta predeterminada del sistema.");
                                  return;
                                }
                                if (window.confirm("¿Deseas eliminar esta tarjeta de repaso?")) {
                                  deleteDoc(doc(db, 'flashcards', cardToDelete.id)).catch(err => alert("Error al eliminar: " + err.message));
                                }
                              }}
                              title="Eliminar Tarjeta"
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportData({
                                isOpen: true,
                                targetId: filteredCards[activeCardIndex]?.id || 'flashcard_item',
                                targetTitle: filteredCards[activeCardIndex]?.q || 'Tarjeta Flashcard',
                                targetType: 'flashcard'
                              });
                            }}
                            title="Reportar Tarjeta"
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <Flag size={15} />
                          </button>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600, lineHeight: 1.5, margin: '14px 0', wordBreak: 'break-word' }}>
                        {filteredCards[activeCardIndex]?.a}
                      </h3>
                      
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                        ✍️ Aportado por: {filteredCards[activeCardIndex]?.authorName || 'Comunidad RUMBO'}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="ios-glass-card" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '24px', maxWidth: '500px' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No hay tarjetas para este curso aún. ¡Sé el primero en crear una!</p>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <button onClick={prevCard} className="ios-glass-card" style={{ border: 'none', padding: '16px', borderRadius: '50%', cursor: 'pointer', display: 'flex', color: 'var(--text-main)' }}>
                  <ChevronLeft />
                </button>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.95rem' }}>
                  {activeCardIndex + 1} / {Math.max(1, filteredCards.length)}
                </span>
                <button onClick={nextCard} className="ios-glass-card" style={{ border: 'none', padding: '16px', borderRadius: '50%', cursor: 'pointer', display: 'flex', color: 'var(--text-main)' }}>
                  <ChevronRight />
                </button>
              </div>

              {/* Create Card Modal */}
              <AnimatePresence>
                {isCreateOpen && (
                  <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="ios-glass-card"
                      style={{ width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '26px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ✨ Crear Tarjeta de Repaso Comunitaria
                        </h3>
                        <button onClick={() => setIsCreateOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveFlashcard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Materia o Curso
                          </label>
                          <select
                            value={newCard.subject}
                            onChange={(e) => setNewCard(prev => ({ ...prev, subject: e.target.value }))}
                            style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                          >
                            {['Biología', 'Anatomía', 'Química', 'Física', 'Historia', 'Geografía', 'Lenguaje', 'Literatura', 'Matemática', 'Filosofía', 'Psicología'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Pregunta o Concepto Clave
                          </label>
                          <textarea
                            rows={2}
                            value={newCard.q}
                            onChange={(e) => setNewCard(prev => ({ ...prev, q: e.target.value }))}
                            placeholder="Ej. ¿Cuáles son las fases de la fotosíntesis?"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.06)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                            required
                          />
                        </div>

                        {/* 🖼️ Imagen opcional para la tarjeta */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            🖼️ Imagen o Esquema (Opcional)
                          </label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={newCard.imageUrl}
                              onChange={(e) => setNewCard(prev => ({ ...prev, imageUrl: e.target.value }))}
                              placeholder="URL de imagen o sube un archivo..."
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: '1px solid var(--card-border)',
                                background: 'rgba(120,120,128,0.06)',
                                color: 'var(--text-main)',
                                fontSize: '0.82rem'
                              }}
                            />
                            <label
                              style={{
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: 'rgba(0,122,255,0.12)',
                                color: 'var(--accent-color)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: cardImageUploading ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Upload size={14} />
                              {cardImageUploading ? `${cardImageProgress}%` : 'Subir'}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                disabled={cardImageUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setCardImageUploading(true);
                                  setCardImageProgress(0);
                                  try {
                                    const downloadUrl = await uploadFileReliable(
                                      file,
                                      (prog) => setCardImageProgress(prog),
                                      'flashcards'
                                    );
                                    if (downloadUrl) {
                                      setNewCard(prev => ({ ...prev, imageUrl: downloadUrl }));
                                    }
                                  } catch (err) {
                                    alert("Error al subir imagen: " + err.message);
                                  } finally {
                                    setCardImageUploading(false);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {newCard.imageUrl && (
                            <div style={{ position: 'relative', marginTop: '8px', display: 'inline-block' }}>
                              <img
                                src={newCard.imageUrl}
                                alt="Vista previa"
                                style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid var(--card-border)' }}
                              />
                              <button
                                type="button"
                                onClick={() => setNewCard(prev => ({ ...prev, imageUrl: '' }))}
                                style={{
                                  position: 'absolute',
                                  top: '-6px',
                                  right: '-6px',
                                  background: '#EF4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Respuesta & Explicación
                          </label>
                          <textarea
                            rows={3}
                            value={newCard.a}
                            onChange={(e) => setNewCard(prev => ({ ...prev, a: e.target.value }))}
                            placeholder="Ej. Fase luminosa (ocurre en los tilacoides) y fase oscura o ciclo de Calvin (en el estroma)."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.06)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={creating}
                            style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 800, cursor: creating ? 'wait' : 'pointer' }}
                          >
                            {creating ? 'Publicando...' : 'Publicar Tarjeta'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'examen' && (
            <motion.div 
              key="examen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
            >
              {/* Header bar for Examen Rápido with search, author filter and "+ Crear Pregunta" button */}
              <div style={{
                width: '100%',
                maxWidth: '680px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    📝 Examen Rápido de Práctica
                  </span>
                  <button
                    onClick={() => {
                      setEditingExamId(null);
                      setNewExamQuestion({ q: '', opt0: '', opt1: '', opt2: '', opt3: '', answer: 0, imageUrl: '' });
                      setIsExamCreateOpen(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'
                    }}
                  >
                    <PlusCircle size={15} /> + Crear Pregunta
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => { setExamSearch(e.target.value); setCurrentQuestion(0); }}
                    placeholder="🔍 Buscar pregunta o autor del examen..."
                    style={{
                      flex: '1 1 200px',
                      padding: '9px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />

                  <select
                    value={examAuthorFilter}
                    onChange={(e) => { setExamAuthorFilter(e.target.value); setCurrentQuestion(0); }}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="todos">👤 Todos los Creadores</option>
                    {examAuthors.map(auth => (
                      <option key={auth.key} value={auth.key}>
                        👤 {auth.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredExamQuestions.length > 0 ? (
                <div
                  className="ios-glass-card"
                  style={{ 
                    padding: '32px 24px', 
                    width: '100%',
                    maxWidth: '720px', 
                    margin: '0 auto',
                    border: '1.5px solid rgba(236, 72, 153, 0.3)',
                    boxShadow: '0 20px 40px rgba(236, 72, 153, 0.1)'
                  }}
                >
                  {(() => {
                    const safeQIndex = Math.min(currentQuestion, filteredExamQuestions.length - 1);
                    const currentQItem = filteredExamQuestions[safeQIndex];
                    const isAuthorOrAdmin = isAdmin || (user && user.uid === currentQItem?.authorUid);

                    return (
                      <>
                        {/* Question Navigator Strip */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflowX: 'auto',
                          paddingBottom: '12px',
                          marginBottom: '16px',
                          borderBottom: '1px solid var(--card-border)'
                        }}>
                          {filteredExamQuestions.map((q, qIndex) => {
                            const isAnswered = userExamAnswers[qIndex] !== undefined && userExamAnswers[qIndex] !== null;
                            const isCurrent = safeQIndex === qIndex;

                            return (
                              <button
                                key={qIndex}
                                type="button"
                                onClick={() => {
                                  setCurrentQuestion(qIndex);
                                  setSelectedOption(userExamAnswers[qIndex] !== undefined ? userExamAnswers[qIndex] : null);
                                }}
                                style={{
                                  minWidth: '34px',
                                  height: '34px',
                                  borderRadius: '10px',
                                  border: isCurrent ? '2px solid #EC4899' : '1px solid var(--card-border)',
                                  background: isCurrent 
                                    ? 'linear-gradient(135deg, #EC4899, #F43F5E)' 
                                    : (isAnswered ? 'rgba(16, 185, 129, 0.18)' : 'rgba(120,120,128,0.08)'),
                                  color: isCurrent ? '#FFFFFF' : (isAnswered ? '#059669' : 'var(--text-secondary)'),
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  flexShrink: 0
                                }}
                                title={`Ir a Pregunta ${qIndex + 1}${isAnswered ? ' (Respondida)' : ''}`}
                              >
                                {qIndex + 1}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              background: 'rgba(236, 72, 153, 0.12)', 
                              color: '#EC4899', 
                              padding: '6px 14px', 
                              borderRadius: '999px', 
                              fontSize: '0.85rem', 
                              fontWeight: 800 
                            }}>
                              🎯 Pregunta {safeQIndex + 1} de {filteredExamQuestions.length}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isAuthorOrAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditExam(currentQItem)}
                                  title="Editar Pregunta"
                                  style={{ background: 'rgba(0,122,255,0.12)', border: 'none', color: 'var(--accent-color)', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Edit3 size={14} /> Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!currentQItem.id || currentQItem.id === 1 || currentQItem.id === 2) {
                                      alert("Esta es una pregunta predeterminada del sistema.");
                                      return;
                                    }
                                    if (window.confirm("¿Deseas eliminar esta pregunta del examen rápido?")) {
                                      deleteDoc(doc(db, 'preguntas_examen', currentQItem.id)).catch(err => alert("Error al eliminar: " + err.message));
                                    }
                                  }}
                                  title="Eliminar Pregunta"
                                  style={{ background: 'rgba(239, 68, 68, 0.12)', border: 'none', color: '#EF4444', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setReportData({ isOpen: true, targetId: currentQItem?.id || 'exam_q', targetTitle: currentQItem?.q || 'Pregunta Examen', targetType: 'examen' })}
                              title="Reportar Pregunta"
                              style={{ background: 'rgba(120,120,128,0.12)', border: 'none', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                            >
                              <Flag size={14} />
                            </button>
                          </div>
                        </div>

                        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '14px', fontWeight: 800, lineHeight: 1.45 }}>
                          {currentQItem?.q}
                        </h2>

                        {/* Image for question if present */}
                        {(currentQItem?.imageUrl || currentQItem?.img) && (
                          <div style={{ textAlign: 'center', margin: '14px 0 20px' }}>
                            <img
                              src={currentQItem.imageUrl || currentQItem.img}
                              alt="Gráfico de la pregunta"
                              style={{
                                maxHeight: '320px',
                                maxWidth: '100%',
                                borderRadius: '16px',
                                border: '1.5px solid var(--card-border)',
                                objectFit: 'contain',
                                background: 'rgba(0,0,0,0.02)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                              }}
                            />
                          </div>
                        )}

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '22px', fontWeight: 600 }}>
                          ✍️ Pregunta creada por: <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{currentQItem?.authorName || 'Comunidad RUMBO'}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(currentQItem?.options || []).map((opt, i) => {
                            const isSelected = selectedOption === i;
                            const letter = ['A', 'B', 'C', 'D', 'E'][i] || String.fromCharCode(65 + i);
                            return (
                              <motion.button 
                                key={i}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                  setSelectedOption(i);
                                  setUserExamAnswers(prev => ({ ...prev, [safeQIndex]: i }));
                                }}
                                style={{
                                  padding: '14px 18px',
                                  borderRadius: '16px',
                                  border: isSelected ? '2px solid #EC4899' : '1.5px solid var(--card-border)',
                                  background: isSelected ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(244, 63, 94, 0.08))' : 'var(--card-bg)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.98rem',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  boxShadow: isSelected ? '0 8px 20px rgba(236, 72, 153, 0.15)' : 'none'
                                }}
                              >
                                <div style={{ 
                                  width: '30px', 
                                  height: '30px', 
                                  borderRadius: '50%', 
                                  border: isSelected ? 'none' : '2px solid var(--text-secondary)',
                                  background: isSelected ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'rgba(120,120,128,0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                  flexShrink: 0,
                                  marginTop: '2px'
                                }}>
                                  {isSelected ? <Check size={16} strokeWidth={3} /> : letter}
                                </div>
                                <span style={{ fontWeight: isSelected ? 700 : 500, flex: 1, lineHeight: 1.5 }}>
                                  {cleanOptionText(opt)}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {safeQIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const prevIdx = safeQIndex - 1;
                                  setCurrentQuestion(prevIdx);
                                  setSelectedOption(userExamAnswers[prevIdx] !== undefined ? userExamAnswers[prevIdx] : null);
                                }}
                                style={{
                                  padding: '12px 18px',
                                  borderRadius: '16px',
                                  border: '1.5px solid var(--card-border)',
                                  background: 'var(--card-bg)',
                                  color: 'var(--text-main)',
                                  fontWeight: 700,
                                  fontSize: '0.88rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                ◀ Anterior
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                // Calculate score and build detailed summary with normalization
                                const allAnswers = { ...userExamAnswers, [safeQIndex]: selectedOption };
                                let correctCount = 0;
                                const details = filteredExamQuestions.map((q, idx) => {
                                  const userChoice = allAnswers[idx];
                                  const userChoiceNorm = userChoice !== undefined && userChoice !== null ? normalizeAnswerIndex(userChoice, q.options) : null;
                                  const correctChoiceNorm = normalizeAnswerIndex(q.answer, q.options);
                                  
                                  let isCorrect = false;
                                  if (userChoiceNorm !== null) {
                                    if (userChoiceNorm === correctChoiceNorm) {
                                      isCorrect = true;
                                    } else if (Array.isArray(q.options) && q.options[userChoiceNorm] && q.options[correctChoiceNorm]) {
                                      const textUser = cleanOptionText(q.options[userChoiceNorm]).toLowerCase();
                                      const textCorrect = cleanOptionText(q.options[correctChoiceNorm]).toLowerCase();
                                      if (textUser === textCorrect && textUser.length > 0) {
                                        isCorrect = true;
                                      }
                                    }
                                  }
                                  if (isCorrect) correctCount++;
                                  return {
                                    question: q.q,
                                    imageUrl: q.imageUrl || q.img || '',
                                    options: q.options || [],
                                    userChoice: userChoiceNorm,
                                    correctChoice: correctChoiceNorm,
                                    isCorrect,
                                    authorName: q.authorName || 'Comunidad RUMBO'
                                  };
                                });

                                setExamResultsModal({
                                  isOpen: true,
                                  score: correctCount,
                                  total: filteredExamQuestions.length,
                                  details
                                });
                              }}
                              style={{
                                padding: '12px 18px',
                                borderRadius: '16px',
                                border: '1.5px solid rgba(236, 72, 153, 0.4)',
                                background: 'rgba(236, 72, 153, 0.12)',
                                color: '#EC4899',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              📋 Ver Claves & Explicación
                            </button>
                          </div>

                          <button 
                            onClick={() => {
                              const updatedAnswers = { ...userExamAnswers, [safeQIndex]: selectedOption };
                              if (safeQIndex < filteredExamQuestions.length - 1) {
                                const nextIdx = safeQIndex + 1;
                                setCurrentQuestion(nextIdx);
                                setSelectedOption(updatedAnswers[nextIdx] !== undefined ? updatedAnswers[nextIdx] : null);
                              } else {
                                // Finalize exam and open popup modal automatically
                                let correctCount = 0;
                                const details = filteredExamQuestions.map((q, idx) => {
                                  const userChoice = updatedAnswers[idx];
                                  const userChoiceNorm = userChoice !== undefined && userChoice !== null ? normalizeAnswerIndex(userChoice, q.options) : null;
                                  const correctChoiceNorm = normalizeAnswerIndex(q.answer, q.options);
                                  
                                  let isCorrect = false;
                                  if (userChoiceNorm !== null) {
                                    if (userChoiceNorm === correctChoiceNorm) {
                                      isCorrect = true;
                                    } else if (Array.isArray(q.options) && q.options[userChoiceNorm] && q.options[correctChoiceNorm]) {
                                      const textUser = cleanOptionText(q.options[userChoiceNorm]).toLowerCase();
                                      const textCorrect = cleanOptionText(q.options[correctChoiceNorm]).toLowerCase();
                                      if (textUser === textCorrect && textUser.length > 0) {
                                        isCorrect = true;
                                      }
                                    }
                                  }
                                  if (isCorrect) correctCount++;
                                  return {
                                    question: q.q,
                                    imageUrl: q.imageUrl || q.img || '',
                                    options: q.options || [],
                                    userChoice: userChoiceNorm,
                                    correctChoice: correctChoiceNorm,
                                    isCorrect,
                                    authorName: q.authorName || 'Comunidad RUMBO'
                                  };
                                });

                                setExamResultsModal({
                                  isOpen: true,
                                  score: correctCount,
                                  total: filteredExamQuestions.length,
                                  details
                                });
                              }
                            }}
                            disabled={selectedOption === null}
                            style={{
                              padding: '14px 28px',
                              borderRadius: '16px',
                              border: 'none',
                              background: selectedOption === null ? 'var(--card-border)' : 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
                              color: selectedOption === null ? 'var(--text-muted)' : '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              cursor: selectedOption === null ? 'not-allowed' : 'pointer',
                              boxShadow: selectedOption === null ? 'none' : '0 8px 22px rgba(236, 72, 153, 0.35)',
                              transition: 'all 0.25s ease'
                            }}
                          >
                            {safeQIndex < filteredExamQuestions.length - 1 ? 'Siguiente Pregunta ➔' : 'Finalizar Examen & Ver Resultados 🏁'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="ios-glass-card" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '24px', maxWidth: '500px' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No hay preguntas disponibles por el momento.</p>
                </div>
              )}

              {/* Modal Crear / Editar Pregunta Examen Rápido */}
              <AnimatePresence>
                {isExamCreateOpen && (
                  <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="ios-glass-card"
                      style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', borderRadius: '26px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{editingExamId ? '✏️' : '✨'}</span>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {editingExamId ? 'Editar Pregunta del Examen' : 'Nueva Pregunta para Examen Rápido'}
                          </h3>
                        </div>
                        <button onClick={() => setIsExamCreateOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveExamQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Enunciado */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Pregunta o Enunciado:
                          </label>
                          <textarea
                            rows={2}
                            value={newExamQuestion.q}
                            onChange={(e) => setNewExamQuestion(prev => ({ ...prev, q: e.target.value }))}
                            placeholder="Ej. En la fotosíntesis, ¿dónde se lleva a cabo la fase luminosa?"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.06)', color: 'var(--text-main)', fontSize: '0.88rem', boxSizing: 'border-box' }}
                            required
                          />
                        </div>

                        {/* Subir Imagen para la Pregunta */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            📷 Imagen o Esquema para la Pregunta (Opcional):
                          </label>

                          {newExamQuestion.imageUrl ? (
                            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid var(--card-border)', background: 'rgba(0,0,0,0.04)', textAlign: 'center', padding: '10px' }}>
                              <img
                                src={newExamQuestion.imageUrl}
                                alt="Previsualización"
                                style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                              />
                              <button
                                type="button"
                                onClick={() => setNewExamQuestion(prev => ({ ...prev, imageUrl: '' }))}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                                title="Quitar Imagen"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '12px 16px',
                                  borderRadius: '12px',
                                  border: '1.5px dashed rgba(236, 72, 153, 0.45)',
                                  background: 'rgba(236, 72, 153, 0.05)',
                                  color: '#EC4899',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  cursor: examImageUploading ? 'wait' : 'pointer'
                                }}
                              >
                                {examImageUploading ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" /> Subiendo imagen ({examImageProgress}%)...
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud size={16} /> Subir Imagen desde el dispositivo
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={examImageUploading}
                                  style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setExamImageUploading(true);
                                    setExamImageProgress(0);
                                    try {
                                      const downloadUrl = await uploadFileReliable(file, (p) => setExamImageProgress(p), 'preguntas_examen');
                                      if (downloadUrl) {
                                        setNewExamQuestion(prev => ({ ...prev, imageUrl: downloadUrl }));
                                      }
                                    } catch (upErr) {
                                      alert("Error al subir imagen: " + upErr.message);
                                    } finally {
                                      setExamImageUploading(false);
                                    }
                                  }}
                                />
                              </label>

                              <input
                                type="url"
                                value={newExamQuestion.imageUrl}
                                onChange={(e) => setNewExamQuestion(prev => ({ ...prev, imageUrl: e.target.value }))}
                                placeholder="O pega aquí una URL directa de imagen (https://...)"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.06)', color: 'var(--text-main)', fontSize: '0.82rem', boxSizing: 'border-box' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Opciones y Asignación de Clave Correcta (A, B, C, D, E) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              Opciones de Respuesta:
                            </label>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10B981' }}>
                              * Toca "Elegir Clave" para marcar la respuesta correcta
                            </span>
                          </div>

                          {[0, 1, 2, 3, 4].map((idx) => {
                            const letter = ['A', 'B', 'C', 'D', 'E'][idx];
                            const isThisCorrect = normalizeAnswerIndex(newExamQuestion.answer) === idx;

                            return (
                              <div 
                                key={idx}
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderRadius: '14px',
                                  border: isThisCorrect ? '2px solid #10B981' : '1px solid var(--card-border)',
                                  background: isThisCorrect ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <span style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: isThisCorrect ? '#10B981' : 'var(--card-border)',
                                  color: isThisCorrect ? '#fff' : 'var(--text-main)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  flexShrink: 0
                                }}>
                                  {letter}
                                </span>

                                <input
                                  type="text"
                                  value={newExamQuestion[`opt${idx}`] || ''}
                                  onChange={(e) => setNewExamQuestion(prev => ({ ...prev, [`opt${idx}`]: e.target.value }))}
                                  placeholder={idx === 4 ? `Texto de la Opción ${letter} (Opcional)` : `Texto de la Opción ${letter}`}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--card-border)',
                                    background: 'rgba(120,120,128,0.06)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    boxSizing: 'border-box'
                                  }}
                                  required={idx < 2}
                                />

                                <button
                                  type="button"
                                  onClick={() => setNewExamQuestion(prev => ({ ...prev, answer: idx }))}
                                  style={{
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: isThisCorrect ? '#10B981' : 'rgba(120,120,128,0.12)',
                                    color: isThisCorrect ? '#FFFFFF' : 'var(--text-secondary)',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {isThisCorrect ? (
                                    <>
                                      <Check size={14} strokeWidth={3} /> Correcta
                                    </>
                                  ) : (
                                    'Elegir Clave'
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Confirmation Card of Selected Key */}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '0.85rem' }}>🎯</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                            Clave asignada: <strong>Opción {['A', 'B', 'C', 'D', 'E'][normalizeAnswerIndex(newExamQuestion.answer)] || 'A'}</strong>
                            {newExamQuestion[`opt${normalizeAnswerIndex(newExamQuestion.answer)}`] ? ` ("${newExamQuestion[`opt${normalizeAnswerIndex(newExamQuestion.answer)}`]}")` : ''}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setIsExamCreateOpen(false)}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={creating || examImageUploading}
                            style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)', color: '#fff', fontWeight: 800, cursor: (creating || examImageUploading) ? 'wait' : 'pointer' }}
                          >
                            {creating ? 'Guardando...' : (editingExamId ? 'Actualizar Pregunta' : 'Publicar Pregunta')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'puntaje' && (
            <motion.div 
              key="puntaje"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}
            >
               {/* Area Selector with distinct vibrant colors */}
               <div style={{ 
                 display: 'flex', 
                 gap: '12px', 
                 justifyContent: 'center', 
                 flexWrap: 'wrap',
                 background: 'var(--card-bg)',
                 padding: '12px',
                 borderRadius: '24px',
                 border: '1.5px solid var(--card-border)',
                 boxShadow: '0 6px 20px rgba(0,0,0,0.04)'
               }}>
                 {Object.keys(datosSimulador).map(area => {
                   const config = AREA_CONFIG[area] || AREA_CONFIG['Sociales'];
                   const isSelected = simArea === area;
                   return (
                     <motion.button
                       key={area}
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => setSimArea(area)}
                       style={{
                         padding: '12px 24px',
                         borderRadius: '16px',
                         border: isSelected ? 'none' : `1.5px solid ${config.border}`,
                         background: isSelected ? config.activeGradient : config.tint,
                         color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                         fontWeight: 800,
                         fontSize: '0.98rem',
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '8px',
                         boxShadow: isSelected ? config.activeShadow : 'none',
                         transition: 'all 0.25s ease'
                       }}
                     >
                       <span>{config.badge}</span>
                       <span style={{ 
                         fontSize: '0.75rem', 
                         opacity: isSelected ? 0.9 : 0.7, 
                         background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                         padding: '2px 8px',
                         borderRadius: '8px'
                       }}>
                         60 preg.
                       </span>
                     </motion.button>
                   );
                 })}
               </div>
               
               {/* Pro Scoreboard HUD Sticky Card */}
               <div 
                 className="ios-glass-card" 
                 style={{ 
                   position: 'sticky', 
                   top: '90px', 
                   zIndex: 20, 
                   padding: '22px 28px', 
                   border: `2px solid ${currentAreaConfig.accent}`, 
                   background: 'var(--card-bg)',
                   backdropFilter: 'blur(24px)',
                   borderRadius: '26px',
                   boxShadow: `0 16px 36px rgba(0, 0, 0, 0.08), 0 0 24px ${currentAreaConfig.tint}`
                 }}
               >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                       <span style={{ 
                         background: currentAreaConfig.activeGradient, 
                         color: '#FFFFFF', 
                         padding: '4px 12px', 
                         borderRadius: '999px', 
                         fontSize: '0.8rem', 
                         fontWeight: 800,
                         boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                       }}>
                         {currentAreaConfig.badge}
                       </span>
                       <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                         {totalAciertosCount} de {totalPreguntasMax} aciertos
                       </span>
                     </div>
                     <span style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                       Puntaje Oficial Proyectado
                     </span>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ 
                         fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
                         fontWeight: 900, 
                         color: currentAreaConfig.accent,
                         lineHeight: 1,
                         letterSpacing: '-0.03em'
                       }}>
                         {formatNum(totalPuntaje)}
                       </div>
                       <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                         Puntos / 100.00
                       </span>
                     </div>

                     {totalAciertosCount > 0 && (
                       <button
                         onClick={handleResetAciertos}
                         title="Reiniciar contador de aciertos"
                         style={{
                           background: 'rgba(120, 120, 128, 0.1)',
                           border: 'none',
                           borderRadius: '12px',
                           padding: '10px',
                           color: 'var(--text-secondary)',
                           cursor: 'pointer',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           transition: 'all 0.2s ease'
                         }}
                       >
                         <RotateCcw size={18} />
                       </button>
                     )}
                   </div>
                 </div>

                 {/* Progress Bar Gauge */}
                 <div style={{ width: '100%', height: '8px', background: 'rgba(120,120,128,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, (totalPuntaje / 100) * 100)}%` }}
                     transition={{ type: "spring", stiffness: 120, damping: 18 }}
                     style={{ 
                       height: '100%', 
                       background: currentAreaConfig.activeGradient,
                       borderRadius: '999px',
                       boxShadow: `0 0 12px ${currentAreaConfig.accent}`
                     }} 
                   />
                 </div>
               </div>
               
               {/* Groups of Courses with Category-Colored Headers & Tables */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                 {groupedSimData.order.map(curso => {
                    const catStyle = getCategoryStyle(curso);
                    const courseItems = groupedSimData.groups[curso];
                    const courseTotalPreguntas = courseItems.reduce((acc, it) => acc + it.preguntas, 0);
                    const courseSubtotal = courseItems.reduce((acc, it) => acc + ((aciertos[it.asignatura] || 0) * it.valor), 0);

                    return (
                      <div 
                        key={curso} 
                        className="ios-glass-card" 
                        style={{ 
                          padding: '24px', 
                          overflowX: 'auto',
                          border: `1.5px solid ${catStyle.border}`,
                          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        {/* Course Group Header with vibrant badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '14px', 
                              background: catStyle.badgeBg,
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '1.25rem'
                            }}>
                              {catStyle.icon}
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                                {curso}
                              </h3>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {courseTotalPreguntas} preguntas en total
                              </span>
                            </div>
                          </div>

                          {courseSubtotal > 0 && (
                            <span style={{ 
                              background: catStyle.lightBg, 
                              color: catStyle.color, 
                              padding: '6px 14px', 
                              borderRadius: '999px', 
                              fontWeight: 800, 
                              fontSize: '0.85rem',
                              border: `1px solid ${catStyle.border}`
                            }}>
                              +{formatNum(courseSubtotal)} pts acumulados
                            </span>
                          )}
                        </div>
                        
                        <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <th style={{ padding: '10px 14px' }}>Asignatura</th>
                              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Preguntas</th>
                              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Valor c/u</th>
                              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Tus Aciertos</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseItems.map((item, idx) => {
                               const currentAciertos = aciertos[item.asignatura] || 0;
                               const subtotal = currentAciertos * item.valor;
                               const hasAciertos = currentAciertos > 0;
                               
                               return (
                                <tr 
                                  key={idx} 
                                  style={{ 
                                    background: hasAciertos ? catStyle.lightBg : 'rgba(120, 120, 128, 0.04)',
                                    borderRadius: '14px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <td style={{ padding: '14px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ width: '6px', height: '18px', borderRadius: '4px', background: catStyle.color }} />
                                      <span>{item.asignatura}</span>
                                    </div>
                                  </td>

                                  <td style={{ padding: '14px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 700 }}>
                                    <span style={{ background: 'rgba(120,120,128,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                      {item.preguntas}
                                    </span>
                                  </td>

                                  <td style={{ padding: '14px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}>
                                    <span style={{ color: catStyle.color }}>
                                      {formatNum(item.valor)} pts
                                    </span>
                                  </td>

                                  <td style={{ padding: '14px', textAlign: 'center' }}>
                                    <div style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      background: 'var(--card-bg)', 
                                      border: hasAciertos ? `1.5px solid ${catStyle.color}` : '1px solid var(--card-border)', 
                                      borderRadius: '14px', 
                                      padding: '2px 4px',
                                      boxShadow: hasAciertos ? `0 4px 12px ${catStyle.lightBg}` : 'none'
                                    }}>
                                      <button 
                                        onClick={() => handleAciertosChange(item.asignatura, item.preguntas, currentAciertos - 1)}
                                        disabled={currentAciertos <= 0}
                                        style={{ 
                                          width: '28px', 
                                          height: '28px', 
                                          background: 'transparent', 
                                          border: 'none', 
                                          color: currentAciertos <= 0 ? 'var(--text-muted)' : 'var(--text-main)', 
                                          cursor: currentAciertos <= 0 ? 'default' : 'pointer', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          borderRadius: '8px'
                                        }}
                                      >
                                        <Minus size={14} strokeWidth={2.5} />
                                      </button>

                                      <input 
                                        type="number"
                                        min="0"
                                        max={item.preguntas}
                                        value={currentAciertos}
                                        onChange={(e) => handleAciertosChange(item.asignatura, item.preguntas, e.target.value)}
                                        style={{ 
                                          width: '36px', 
                                          textAlign: 'center', 
                                          background: 'transparent', 
                                          border: 'none', 
                                          color: hasAciertos ? catStyle.color : 'var(--text-main)', 
                                          fontWeight: 800, 
                                          fontSize: '1rem', 
                                          outline: 'none', 
                                          WebkitAppearance: 'none', 
                                          margin: 0 
                                        }}
                                      />

                                      <button 
                                        onClick={() => handleAciertosChange(item.asignatura, item.preguntas, currentAciertos + 1)}
                                        disabled={currentAciertos >= item.preguntas}
                                        style={{ 
                                          width: '28px', 
                                          height: '28px', 
                                          background: 'transparent', 
                                          border: 'none', 
                                          color: currentAciertos >= item.preguntas ? 'var(--text-muted)' : catStyle.color, 
                                          cursor: currentAciertos >= item.preguntas ? 'default' : 'pointer', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          borderRadius: '8px'
                                        }}
                                      >
                                        <Plus size={14} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </td>

                                  <td style={{ padding: '14px', borderTopRightRadius: '14px', borderBottomRightRadius: '14px', textAlign: 'right' }}>
                                    {hasAciertos ? (
                                      <span style={{ 
                                        background: catStyle.gradient, 
                                        color: '#FFFFFF', 
                                        padding: '5px 12px', 
                                        borderRadius: '10px', 
                                        fontWeight: 800, 
                                        fontSize: '0.9rem',
                                        boxShadow: `0 4px 10px ${catStyle.lightBg}`
                                      }}>
                                        +{formatNum(subtotal)}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        0.00
                                      </span>
                                    )}
                                  </td>
                                </tr>
                               )
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                 })}
               </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      <ReportModal
        isOpen={reportData.isOpen}
        onClose={() => setReportData({ ...reportData, isOpen: false })}
        targetId={reportData.targetId}
        targetTitle={reportData.targetTitle}
        targetType={reportData.targetType}
      />

      {/* 🏁 POPUP DE RESULTADOS Y RESPUESTAS DEL EXAMEN RÁPIDO */}
      <AnimatePresence>
        {examResultsModal.isOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="ios-glass-card"
              style={{
                width: '100%',
                maxWidth: '620px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '28px',
                padding: '26px',
                background: 'var(--card-bg)',
                border: '1.5px solid rgba(236, 72, 153, 0.4)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                boxSizing: 'border-box'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, #EC4899, #F43F5E)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                    🏁
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Resultados del Examen Rápido
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Verificación de claves y explicaciones
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExamResultsModal({ ...examResultsModal, isOpen: false })}
                  style={{ background: 'rgba(120,120,128,0.1)', border: 'none', color: 'var(--text-secondary)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Score Header Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.14) 0%, rgba(244, 63, 94, 0.08) 100%)',
                border: '1.5px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '20px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EC4899', display: 'block', marginBottom: '2px' }}>
                    PUNTAJE OBTENIDO
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {examResultsModal.score} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 700 }}>/ {examResultsModal.total} correctas</span>
                  </div>
                </div>
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '14px',
                  background: examResultsModal.score === examResultsModal.total ? '#10B981' : (examResultsModal.score > 0 ? '#F59E0B' : '#EF4444'),
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}>
                  {Math.round((examResultsModal.score / Math.max(1, examResultsModal.total)) * 100)}% Eficiencia
                </div>
              </div>

              {/* Scrollable Questions & Answers List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
                {examResultsModal.details.map((item, qIdx) => {
                  const userLetter = item.userChoice !== undefined && item.userChoice !== null ? (['A','B','C','D','E'][item.userChoice] || String.fromCharCode(65 + item.userChoice)) : '';
                  const userOptText = item.userChoice !== undefined && item.userChoice !== null && item.options[item.userChoice] !== undefined 
                    ? `(${userLetter}) ${cleanOptionText(item.options[item.userChoice])}` 
                    : 'Sin responder';
                  const correctLetter = item.correctChoice !== undefined && item.correctChoice !== null ? (['A','B','C','D','E'][item.correctChoice] || String.fromCharCode(65 + item.correctChoice)) : '';
                  const correctOptText = `(${correctLetter}) ${cleanOptionText(item.options[item.correctChoice]) || 'N.A.'}`;

                  return (
                    <div
                      key={qIdx}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '18px',
                        background: item.isCorrect ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                        border: item.isCorrect ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                          {qIdx + 1}. {item.question}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: item.isCorrect ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                          color: item.isCorrect ? '#059669' : '#DC2626',
                          flexShrink: 0
                        }}>
                          {item.isCorrect ? '✓ CORRECTA' : '✗ INCORRECTA'}
                        </span>
                      </div>

                      {item.imageUrl && (
                        <div style={{ margin: '8px 0 10px', textAlign: 'center' }}>
                          <img
                            src={item.imageUrl}
                            alt="Gráfico"
                            style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain', border: '1px solid var(--card-border)' }}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', marginTop: '8px' }}>
                        <div style={{ color: item.isCorrect ? '#059669' : '#DC2626', fontWeight: 700 }}>
                          Tu Respuesta: <span style={{ fontWeight: 800 }}>{userOptText}</span>
                        </div>
                        {!item.isCorrect && (
                          <div style={{ color: '#059669', fontWeight: 700 }}>
                            Respuesta Correcta: <span style={{ fontWeight: 800 }}>{correctOptText}</span>
                          </div>
                        )}
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          ✍️ Pregunta aportada por: {item.authorName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setExamResultsModal({ ...examResultsModal, isOpen: false })}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(244, 63, 94, 0.35)'
                  }}
                >
                  Entendido / Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
