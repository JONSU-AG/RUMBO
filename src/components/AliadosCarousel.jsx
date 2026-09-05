import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MessageCircle, 
  ExternalLink, 
  User, 
  Star, 
  CheckCircle2, 
  Video, 
  Award,
  ChevronRight,
  Heart,
  Megaphone
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { LiveUserAvatar } from './LiveUserAvatar';

export const WhatsAppIconSVG = ({ size = 18, style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={style}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export const TikTokIconSVG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.892 2.895 2.895 0 0 1-2.895-2.892 2.894 2.894 0 0 1 2.895-2.892c.329 0 .641.057.933.161V9.418a6.326 6.326 0 0 0-.933-.07 6.338 6.338 0 0 0-6.335 6.336 6.338 6.338 0 0 0 6.335 6.335 6.338 6.338 0 0 0 6.336-6.335V9.014a8.18 8.18 0 0 0 4.77 1.518V7.086a4.838 4.838 0 0 1-1.07-.400Z"/>
  </svg>
);

// Base official creator card (Single main creator card)
const DEFAULT_ALLIES = [
  {
    id: 'josnu-founder',
    name: 'TU BUEN AMIGO JONSU FUTURO CACHIMBO',
    uid: 'josnu-admin',
    role: 'Fundador & Creador RUMBO',
    badge: '👑 Creador RUMBO',
    specialty: 'Aficionado en desarrollo web',
    desc: 'SOY EL CREADOR DE LA PAGINA, comparto material preuniversitario gratis, además de plasmar sus ideas en la página.',
    whatsappChannel: 'https://www.whatsapp.com/channel/0029VbDFAEu7YScyVZBNul0X',
    tiktokUrl: 'https://www.tiktok.com/@futurocachimbounsa?_r=1&_t=ZS-99SjSQle78P',
    phone: '930875585',
    avatar: './assets/LOGOR.png',
    reactionsCount: 99,
    priority: 1
  }
];

export const AliadosCarousel = ({ onOpenAliadoForm }) => {
  const { user } = useAuth();
  const [allies, setAllies] = useState(DEFAULT_ALLIES);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Dynamic window resize listener for responsive rotation thresholds
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let unsubs = [];

    const loadAllies = () => {
      let combinedMap = new Map();
      const josnuUid = (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) ? user.uid : 'josnu-admin';

      // 1. Base default ally with fixed 'creator_primary' key to guarantee NO DUPLICATES
      DEFAULT_ALLIES.forEach(d => {
        combinedMap.set('creator_primary', {
          ...d,
          uid: josnuUid
        });
      });

      const syncState = () => {
        const list = Array.from(combinedMap.values());
        list.sort((a, b) => (a.priority || 10) - (b.priority || 10));
        setAllies(list);
      };

      syncState();

      // 2. Firestore: solicitudes_aliados (Cards explicitly approved/created in Admin panel or saved by Creator)
      try {
        const qSol = query(collection(db, 'solicitudes_aliados'));
        const unsubSol = onSnapshot(qSol, (snapshot) => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Strictly require approved status or creator
            if (data.name && (data.status === 'aprobado' || data.isCreator || data.approved === true)) {
              const nameKey = data.name.toLowerCase().trim();
              if (nameKey === 'rumbo oficial') return; // Skip redundant alias

              const isCreatorCard = data.isCreator || 
                nameKey.includes('jonsu') || 
                nameKey.includes('futuro') || 
                doc.id === 'josnu-founder' ||
                (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) && (data.uid === user?.uid || data.email === user?.email));

              // Store under 'creator_primary' if it belongs to the creator so it overwrites any default instead of creating a clone
              const mapKey = isCreatorCard ? 'creator_primary' : doc.id;

              combinedMap.set(mapKey, {
                id: doc.id,
                name: data.name,
                role: data.role || (isCreatorCard ? 'Fundador & Creador RUMBO' : 'Aliado Oficial RUMBO'),
                badge: data.badge || (isCreatorCard ? '👑 Creador RUMBO' : '⭐ Aliado Comunitario'),
                specialty: data.specialty || data.subject || 'Todas las Áreas',
                desc: data.desc || data.bio || 'Aliado oficial compartiendo material educativo.',
                whatsappChannel: data.whatsappChannel || data.whatsappGroup || '',
                tiktokUrl: data.tiktokUrl || data.socialLink || '',
                phone: data.phone || '',
                avatar: data.avatar || data.photoURL || './assets/LOGOR.png',
                uid: data.uid || (isCreatorCard ? josnuUid : null),
                reactionsCount: data.reactionsCount || 90,
                priority: isCreatorCard ? 1 : 3
              });
            }
          });
          syncState();
        }, (err) => console.warn("solicitudes_aliados snapshot err:", err));

        unsubs.push(unsubSol);
      } catch (e) {
        console.warn("solicitudes_aliados catch:", e);
      }
    };

    loadAllies();

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, [user]);

  // Dynamic horizontal rotation threshold: Mobile >= 2 cards, Desktop/PC >= 4 cards
  const minCardsToRotate = isMobile ? 2 : 4;
  const shouldRotate = allies.length >= minCardsToRotate;
  const displayCards = shouldRotate ? [...allies, ...allies] : allies;

  return (
    <section style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px 16px 40px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '0 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 16px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(239, 148, 190, 0.16))',
            border: '1.5px solid rgba(168, 85, 247, 0.35)',
            color: '#A855F7',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            <Sparkles size={15} /> TARJETAS DE ALIADOS RUMBO ⭐
          </span>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
          fontWeight: 900,
          color: 'var(--text-main)',
          margin: 0,
          letterSpacing: '-0.025em'
        }}>
          Creadores & Canales Oficiales
        </h2>

        <p style={{
          fontSize: '0.92rem',
          color: 'var(--text-secondary)',
          margin: 0,
          maxWidth: '640px',
          lineHeight: 1.5
        }}>
          Postulantes, docentes y academias que comparten material y difunden el proyecto educativo.
        </p>
      </div>

      {/* 📢 Banner de Requisitos para ser Aliado Oficial */}
      <div style={{
        maxWidth: '820px',
        margin: '0 auto 24px',
        padding: '14px 18px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.12), rgba(255, 45, 85, 0.08))',
        border: '1.5px solid rgba(255, 149, 0, 0.35)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 8px 24px rgba(255, 149, 0, 0.12)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #FF9500, #FF2D55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(255, 149, 0, 0.35)',
          color: '#FFFFFF'
        }}>
          <Megaphone size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 900,
              color: '#FF9500',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              📢 Requisito para ser Aliado Oficial:
            </span>
          </div>
          <p style={{
            margin: '4px 0 0',
            fontSize: '0.86rem',
            color: 'var(--text-main)',
            lineHeight: 1.45,
            fontWeight: 600
          }}>
            Debes <strong>haber compartido al menos 10 veces material</strong> a la comunidad y <strong>difundir la página RUMBO en tus redes sociales (WhatsApp / TikTok)</strong>. ¡Una vez verificado tu aporte, tu tarjeta será aprobada y visible aquí!
          </p>
        </div>
      </div>

      {/* 🚀 Carrusel Infinito Desplazable (Marquee Continuo si cumple el umbral, o Rejilla Centrada) */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '10px 0 20px',
          display: 'flex',
          justifyContent: 'center',
          maskImage: shouldRotate ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' : 'none',
          WebkitMaskImage: shouldRotate ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' : 'none'
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          animate={shouldRotate && !isPaused ? { x: ['0%', '-50%'] } : undefined}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: Math.max(20, allies.length * 7),
              ease: 'linear'
            }
          }}
          style={{
            display: 'flex',
            gap: '20px',
            width: shouldRotate ? 'max-content' : '100%',
            maxWidth: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: shouldRotate ? 'nowrap' : 'wrap',
            cursor: shouldRotate ? 'grab' : 'default',
            margin: '0 auto'
          }}
          whileTap={{ cursor: shouldRotate ? 'grabbing' : 'default' }}
        >
          {displayCards.map((ally, idx) => (
            <motion.div
              key={`${ally.id}-${idx}`}
              whileHover={{ y: -6, scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.22)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '380px',
                minWidth: '270px',
                flexShrink: shouldRotate ? 0 : 1,
                borderRadius: '26px',
                padding: '22px 20px',
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.16)',
                position: 'relative',
                boxSizing: 'border-box',
                margin: '0 auto'
              }}
            >
              {/* Top Row: Avatar & Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LiveUserAvatar
                  uid={ally.uid}
                  fallbackName={ally.name}
                  fallbackPhoto={ally.avatar}
                  fallbackFrame={ally.avatarFrame || (ally.id === 'josnu-founder' || ally.name?.toLowerCase().includes('jonsu') || ally.name?.toLowerCase().includes('futuro') ? 'fuego_creador' : 'carmesi')}
                  size={52}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      lineHeight: 1.25,
                      wordBreak: 'break-word'
                    }}>
                      {ally.name}
                    </h3>
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
                      {ally.badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialty Tag */}
              <div style={{
                background: 'rgba(120, 120, 128, 0.08)',
                borderRadius: '14px',
                padding: '10px 12px',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📍</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ally.specialty}
                </span>
              </div>

              {/* Presentation Quote */}
              <p style={{
                margin: 0,
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: '56px'
              }}>
                "{ally.desc}"
              </p>

              {/* Action Buttons: WhatsApp + TikTok/Social + Profile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {ally.whatsappChannel && (
                  <a
                    href={ally.whatsappChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <WhatsAppIconSVG size={17} /> Canal de WhatsApp ↗
                  </a>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  {ally.tiktokUrl && (
                    <a
                      href={ally.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        background: '#000000',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      <TikTokIconSVG size={15} /> TikTok ↗
                    </a>
                  )}

                  {ally.uid && (
                    <Link
                      to={`/usuario/${ally.uid}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        background: 'rgba(120, 120, 128, 0.12)',
                        color: 'var(--text-main)',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem'
                      }}
                    >
                      <User size={14} /> Ver Perfil
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA to Register as Ally */}
      {onOpenAliadoForm && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAliadoForm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #A855F7, #6366F1)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)'
            }}
          >
            <Sparkles size={18} /> ¿Quieres aparecer aquí? Regístrate como Aliado ⭐
          </motion.button>
        </div>
      )}
    </section>
  );
};
