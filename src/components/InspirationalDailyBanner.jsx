import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, BookOpen, RefreshCw, Copy, Check } from 'lucide-react';

const DAILY_QUOTES = [
  {
    texto: "La educación no es llenar un cántaro, sino encender un fuego.",
    autor: "William Butler Yeats",
    tema: "Estudio & Pasión",
    icono: "🔥"
  },
  {
    texto: "Trata a todos con amabilidad y respeto; cada persona que encuentras está librando una batalla.",
    autor: "Platón",
    tema: "Amabilidad & Empatía",
    icono: "🤝"
  },
  {
    texto: "El éxito es la suma de pequeños esfuerzos repetidos día tras día con amor por tu meta.",
    autor: "Robert Collier",
    tema: "Esfuerzo & Dedicación",
    icono: "🌱"
  },
  {
    texto: "La perseverancia no es una carrera larga, son muchas carreras cortas una tras otra.",
    autor: "Walter Elliot",
    tema: "Perseverancia",
    icono: "🏃‍♂️"
  },
  {
    texto: "Donde hay amor sincero por aprender y dedicación constante, no existen límites.",
    autor: "Hipócrates",
    tema: "Amor al Estudio",
    icono: "📚"
  },
  {
    texto: "La mayor victoria no es nunca caer, sino levantarse cada vez con mayor determinación.",
    autor: "Confucio",
    tema: "Superación & Fuerza",
    icono: "🌟"
  },
  {
    texto: "Haz cada tarea con todo tu corazón, como si de ello dependiera el destino de tus sueños.",
    autor: "Marco Aurelio",
    tema: "Dedicación Total",
    icono: "💡"
  },
  {
    texto: "El único modo de hacer un gran trabajo es amar profundamente lo que haces cada día.",
    autor: "Steve Jobs",
    tema: "Amor & Entrega",
    icono: "🎯"
  }
];

const DAILY_VERSES = [
  {
    texto: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque tu Dios estará contigo dondequiera que vayas.",
    referencia: "Josué 1:9",
    tema: "Esfuerzo & Valentía",
    icono: "🦁"
  },
  {
    texto: "Y todo lo que hagáis, hacedlo de corazón, con entrega y dedicación sincera.",
    referencia: "Colosenses 3:23",
    tema: "Dedicación & Pasión",
    icono: "🔥"
  },
  {
    texto: "El amor es paciente, es servicial; no tiene envidia, no se jacta; todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.",
    referencia: "1 Corintios 13:4-7",
    tema: "Amor Sincero",
    icono: "❤️"
  },
  {
    texto: "No nos cansemos de hacer el bien y esforzarnos; porque a su tiempo cosecharemos si no desmayamos.",
    referencia: "Gálatas 6:9",
    tema: "Perseverancia",
    icono: "🌾"
  },
  {
    texto: "Todas vuestras cosas sean hechas con amor y nobleza de corazón.",
    referencia: "1 Corintios 16:14",
    tema: "Amor & Entrega",
    icono: "💖"
  },
  {
    texto: "Encomienda tus obras y tu estudio con fe, y tus pensamientos y proyectos serán afirmados.",
    referencia: "Proverbios 16:3",
    tema: "Esfuerzo & Confianza",
    icono: "✍️"
  },
  {
    texto: "Porque no nos ha dado espíritu de cobardía, sino de poder, de amor y de dominio propio.",
    referencia: "2 Timoteo 1:7",
    tema: "Fuerza & Amor",
    icono: "💪"
  },
  {
    texto: "Los pensamientos y acciones del diligente tienden a la abundancia y al triunfo de la perseverancia.",
    referencia: "Proverbios 21:5",
    tema: "Diligencia & Esfuerzo",
    icono: "🎯"
  }
];

export const InspirationalDailyBanner = ({ style = {} }) => {
  // Mode: 'frase' | 'versiculo'
  const [mode, setMode] = useState('frase');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [verseIndex, setVerseIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Initial seed based on day
  useEffect(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    setQuoteIndex(dayOfYear % DAILY_QUOTES.length);
    setVerseIndex(dayOfYear % DAILY_VERSES.length);
  }, []);

  // 12-second auto rotation between Frase and Versículo
  useEffect(() => {
    const timer = setInterval(() => {
      setMode((prevMode) => {
        const nextMode = prevMode === 'frase' ? 'versiculo' : 'frase';
        if (nextMode === 'frase') {
          setQuoteIndex((q) => (q + 1) % DAILY_QUOTES.length);
        } else {
          setVerseIndex((v) => (v + 1) % DAILY_VERSES.length);
        }
        return nextMode;
      });
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const handleShuffle = () => {
    if (mode === 'frase') {
      setQuoteIndex((prev) => (prev + 1) % DAILY_QUOTES.length);
    } else {
      setVerseIndex((prev) => (prev + 1) % DAILY_VERSES.length);
    }
  };

  const currentItem = mode === 'frase' ? DAILY_QUOTES[quoteIndex] : DAILY_VERSES[verseIndex];

  const handleCopy = () => {
    const textToCopy = mode === 'frase' 
      ? `"${currentItem.texto}" — ${currentItem.autor}`
      : `"${currentItem.texto}" — ${currentItem.referencia}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFrase = mode === 'frase';

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto 28px', ...style }}>
      <div 
        className="glass-card"
        style={{
          borderRadius: '24px',
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          border: isFrase 
            ? '1.5px solid rgba(0, 198, 255, 0.35)' 
            : '1.5px solid rgba(245, 158, 11, 0.4)',
          background: isFrase
            ? 'linear-gradient(135deg, rgba(0, 198, 255, 0.08) 0%, rgba(168, 85, 247, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(225, 29, 72, 0.06) 100%)',
          boxShadow: isFrase
            ? '0 8px 32px rgba(0, 198, 255, 0.08)'
            : '0 8px 32px rgba(245, 158, 11, 0.1)'
        }}
      >
        {/* Top Header: Toggle between Frase & Versículo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          {/* Segmented control */}
          <div style={{ 
            display: 'inline-flex', 
            background: 'rgba(120, 120, 128, 0.12)', 
            padding: '4px', 
            borderRadius: '16px',
            gap: '4px'
          }}>
            <button
              onClick={() => setMode('frase')}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isFrase ? 'var(--card-bg)' : 'transparent',
                color: isFrase ? '#00C6FF' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isFrase ? '0 2px 10px rgba(0,198,255,0.2)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              <Quote size={14} /> Frase de Inspiración
            </button>

            <button
              onClick={() => setMode('versiculo')}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                border: 'none',
                background: !isFrase ? 'var(--card-bg)' : 'transparent',
                color: !isFrase ? '#F59E0B' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: !isFrase ? '0 2px 10px rgba(245,158,11,0.25)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              <BookOpen size={14} /> Versículo de Fe & Esfuerzo
            </button>
          </div>

          {/* Quick Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: isFrase ? 'rgba(0, 198, 255, 0.15)' : 'rgba(245, 158, 11, 0.18)',
              color: isFrase ? '#00C6FF' : '#D97706'
            }}>
              {currentItem.tema}
            </span>

            <button
              onClick={handleShuffle}
              title="Ver otra reflexión"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={handleCopy}
              title="Copiar reflexión"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: copied ? '#34A853' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Content Area with smooth animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${mode === 'frase' ? quoteIndex : verseIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}
          >
            {/* Visual Icon */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '16px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              background: isFrase ? 'rgba(0, 198, 255, 0.14)' : 'rgba(245, 158, 11, 0.16)',
              border: isFrase ? '1px solid rgba(0, 198, 255, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              {currentItem.icono}
            </div>

            {/* Text & Reference */}
            <div style={{ flex: 1 }}>
              <p style={{
                margin: '0 0 8px',
                fontSize: isFrase ? '1.05rem' : '1.02rem',
                lineHeight: 1.55,
                color: 'var(--text-main)',
                fontStyle: isFrase ? 'italic' : 'normal',
                fontWeight: 500,
                letterSpacing: '-0.01em'
              }}>
                "{currentItem.texto}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: isFrase ? '#00C6FF' : '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isFrase ? `— ${currentItem.autor}` : `🕊️ ${currentItem.referencia}`}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
