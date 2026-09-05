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
  Trash2
} from 'lucide-react';
import { InspirationalDailyBanner } from '../components/InspirationalDailyBanner';
import { datosSimulador } from '../data/simuladorData';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';

const DEFAULT_FLASHCARDS = [
  { id: '1', q: "¿Qué es la Mitosis?", a: "Proceso de división celular que da como resultado dos células hijas genéticamente idénticas a la célula madre.", subject: "Biología", authorName: "Comunidad RUMBO" },
  { id: '2', q: "¿Quién postuló la Teoría de la Relatividad?", a: "Albert Einstein en 1905 (Especial) y 1915 (General).", subject: "Física", authorName: "Comunidad RUMBO" },
  { id: '3', q: "¿Cuál es la capital del Imperio Incaico?", a: "El Cusco (Qosqo), considerado el 'Ombligo del mundo'.", subject: "Historia", authorName: "Comunidad RUMBO" },
  { id: '4', q: "¿Cuál es la ley periódica de Mendeleiev?", a: "Las propiedades de los elementos son función periódica de sus masas atómicas.", subject: "Química", authorName: "Comunidad RUMBO" }
];

const examData = [
  { id: 1, q: "En la anatomía humana, ¿cuál es el hueso más largo?", options: ["Fémur", "Tibia", "Húmero", "Peroné"], answer: 0 },
  { id: 2, q: "¿Cuál es la obra cumbre de César Vallejo?", options: ["Los Heraldos Negros", "Trilce", "Poemas Humanos", "Tungsteno"], answer: 2 },
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
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCard, setNewCard] = useState({ q: '', a: '', subject: 'Biología' });
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

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    if (!newCard.q.trim() || !newCard.a.trim() || creating) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'flashcards'), {
        q: newCard.q.trim(),
        a: newCard.a.trim(),
        subject: newCard.subject,
        authorName: user?.displayName || 'Estudiante RUMBO',
        authorUid: user?.uid || null,
        createdAt: serverTimestamp()
      });
      setNewCard({ q: '', a: '', subject: 'Biología' });
      setIsCreateOpen(false);
    } catch (err) {
      alert("Error al crear tarjeta: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredCards = useMemo(() => {
    if (selectedSubject === 'Todos') return communityCards;
    return communityCards.filter(c => c.subject === selectedSubject);
  }, [communityCards, selectedSubject]);

  const activeCardIndex = Math.min(currentCard, Math.max(0, filteredCards.length - 1));

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % Math.max(1, filteredCards.length));
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + filteredCards.length) % Math.max(1, filteredCards.length));
  };

  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

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
              {/* Header with filters and "+ Crear Tarjeta" */}
              <div style={{
                width: '100%',
                maxWidth: '600px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', flex: 1 }}>
                  {['Todos', 'Biología', 'Anatomía', 'Química', 'Física', 'Historia'].map(sub => {
                    const isSel = selectedSubject === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => { setSelectedSubject(sub); setCurrentCard(0); setIsFlipped(false); }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '12px',
                          border: isSel ? 'none' : '1px solid var(--card-border)',
                          background: isSel ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--card-bg)',
                          color: isSel ? '#FFFFFF' : 'var(--text-secondary)',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: isSel ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  style={{
                    padding: '9px 18px',
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
                    flexShrink: 0
                  }}
                >
                  <PlusCircle size={16} /> + Crear Tarjeta
                </button>
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
                      
                      <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', fontWeight: 700, lineHeight: 1.45, margin: '16px 0', wordBreak: 'break-word' }}>
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

                      <form onSubmit={handleCreateFlashcard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              className="ios-glass-card"
              style={{ 
                padding: '36px 28px', 
                maxWidth: '680px', 
                margin: '0 auto',
                border: '1.5px solid rgba(236, 72, 153, 0.3)',
                boxShadow: '0 20px 40px rgba(236, 72, 153, 0.1)'
              }}
            >
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    background: 'rgba(236, 72, 153, 0.12)', 
                    color: '#EC4899', 
                    padding: '6px 14px', 
                    borderRadius: '999px', 
                    fontSize: '0.85rem', 
                    fontWeight: 800 
                  }}>
                    🎯 Pregunta {currentQuestion + 1} de {examData.length}
                  </span>
                </div>
                <span style={{ 
                  background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)', 
                  color: '#fff', 
                  padding: '5px 14px', 
                  borderRadius: '999px', 
                  fontSize: '0.82rem', 
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)'
                }}>
                  UNSA OFICIAL
                </span>
              </div>
              
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '28px', fontWeight: 700, lineHeight: 1.45 }}>
                {examData[currentQuestion].q}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {examData[currentQuestion].options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  return (
                    <motion.button 
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOption(i)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '18px',
                        border: isSelected ? '2px solid #EC4899' : '1px solid var(--card-border)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(244, 63, 94, 0.08))' : 'var(--card-bg)',
                        color: 'var(--text-main)',
                        fontSize: '1.05rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        boxShadow: isSelected ? '0 8px 20px rgba(236, 72, 153, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        border: isSelected ? 'none' : '2px solid var(--text-secondary)',
                        background: isSelected ? 'linear-gradient(135deg, #EC4899, #F43F5E)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {isSelected ? <Check size={16} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                      </div>
                      <span style={{ fontWeight: isSelected ? 700 : 500 }}>{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    if (currentQuestion < examData.length - 1) {
                      setCurrentQuestion(q => q + 1);
                      setSelectedOption(null);
                    } else {
                      alert("¡Examen Terminado! Tu puntaje ha sido registrado.");
                    }
                  }}
                  disabled={selectedOption === null}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '16px',
                    border: 'none',
                    background: selectedOption === null ? 'var(--card-border)' : 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
                    color: selectedOption === null ? 'var(--text-muted)' : '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: selectedOption === null ? 'not-allowed' : 'pointer',
                    boxShadow: selectedOption === null ? 'none' : '0 8px 22px rgba(236, 72, 153, 0.35)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {currentQuestion < examData.length - 1 ? 'Siguiente Pregunta ➔' : 'Finalizar Examen 🏁'}
                </button>
              </div>
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
    </div>
  );
};
