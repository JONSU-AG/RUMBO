import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';

export const AVATAR_FRAMES_MAP = {
  fuego_creador: {
    type: 'conic_flame',
    glow: '0 0 24px rgba(255, 85, 0, 0.9), 0 0 45px rgba(220, 38, 38, 0.7)'
  },
  arcoiris_neon: {
    type: 'conic_rainbow',
    glow: '0 0 22px rgba(0, 204, 255, 0.75), 0 0 35px rgba(255, 0, 85, 0.5)'
  },
  carmesi: {
    ring: 'linear-gradient(135deg, #701A75 0%, #991B1B 40%, #BE123C 75%, #F59E0B 100%)',
    glow: '0 0 20px rgba(190, 18, 60, 0.75)'
  },
  celeste_unsa: {
    ring: 'linear-gradient(135deg, #00C6FF 0%, #007AFF 50%, #38BDF8 100%)',
    glow: '0 0 20px rgba(0, 198, 255, 0.75)'
  },
  sol_dorado: {
    ring: 'linear-gradient(135deg, #D97706 0%, #F59E0B 40%, #FDE68A 75%, #B45309 100%)',
    glow: '0 0 22px rgba(245, 158, 11, 0.8)'
  },
  fuego: {
    ring: 'linear-gradient(135deg, #FF5500 0%, #FF8A00 50%, #FF3D00 100%)',
    glow: '0 0 20px rgba(255, 85, 0, 0.75)'
  },
  fuego_clasico: {
    ring: 'linear-gradient(135deg, #FF5500 0%, #FF8A00 50%, #FF3D00 100%)',
    glow: '0 0 20px rgba(255, 85, 0, 0.75)'
  },
  esmeralda: {
    ring: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #FBBF24 100%)',
    glow: '0 0 20px rgba(16, 185, 129, 0.75)'
  },
  neon_azul: {
    ring: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 50%, #0072FF 100%)',
    glow: '0 0 20px rgba(0, 122, 255, 0.75)'
  },
  dorado_oro: {
    ring: 'linear-gradient(135deg, #D97706 0%, #F59E0B 40%, #FDE68A 75%, #B45309 100%)',
    glow: '0 0 22px rgba(245, 158, 11, 0.8)'
  },
  magico_purple: {
    ring: 'linear-gradient(135deg, #7E22CE 0%, #A855F7 50%, #EC4899 100%)',
    glow: '0 0 20px rgba(168, 85, 247, 0.75)'
  },
  galaxia_neon: {
    ring: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 50%, #F43F5E 100%)',
    glow: '0 0 22px rgba(139, 92, 246, 0.75)'
  }
};

export const LiveUserAvatar = ({ 
  uid, 
  fallbackName = 'E', 
  fallbackPhoto = null, 
  fallbackFrame = 'none',
  size = 42,
  showFrame = true 
}) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [creatorConfig, setCreatorConfig] = useState(null);
  const [liveCreatorColors, setLiveCreatorColors] = useState(() => {
    try {
      const saved = localStorage.getItem('rumbo_creator_custom_colors');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['#701A75', '#DC2626', '#FF8A00', '#FBBF24'];
  });

  const isJosnuCard = (fallbackName && (
    fallbackName.toLowerCase().includes('jonsu') || 
    fallbackName.toLowerCase().includes('josnu') || 
    fallbackName.toLowerCase().includes('futuro') ||
    fallbackName.toLowerCase().includes('creador') ||
    fallbackName.toLowerCase().includes('rumbo oficial')
  )) || uid === 'josnu-admin' || uid === 'josnu-founder';

  // Determine the effective UID to listen to in Firestore
  let effectiveUid = uid;
  if (!effectiveUid || effectiveUid === 'josnu-admin' || effectiveUid === 'josnu-founder') {
    if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      effectiveUid = user.uid;
    } else {
      effectiveUid = localStorage.getItem('rumbo_admin_real_uid') || null;
    }
  }

  useEffect(() => {
    const handleColorsUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length >= 4) {
        setLiveCreatorColors(e.detail);
      }
    };
    window.addEventListener('rumbo_creator_colors_updated', handleColorsUpdated);
    return () => window.removeEventListener('rumbo_creator_colors_updated', handleColorsUpdated);
  }, []);

  useEffect(() => {
    let unsubs = [];

    // 1. Subscribe to specific user profile if UID is available
    if (effectiveUid) {
      try {
        const unsubUser = onSnapshot(doc(db, 'usuarios', effectiveUid), (snap) => {
          if (snap.exists()) {
            setProfileData(snap.data());
          }
        }, (err) => console.warn("LiveAvatar user listener notice:", err));
        unsubs.push(unsubUser);
      } catch (e) {
        console.warn("LiveAvatar user setup catch:", e);
      }
    }

    // 2. Subscribe to general creator profile for Jonsu/Admin cards
    if (isJosnuCard) {
      try {
        const unsubCreator = onSnapshot(doc(db, 'configuracion_general', 'creator_profile'), (snap) => {
          if (snap.exists()) {
            setCreatorConfig(snap.data());
          }
        }, (err) => console.warn("LiveAvatar creator config notice:", err));
        unsubs.push(unsubCreator);
      } catch (e) {
        console.warn("LiveAvatar creator setup catch:", e);
      }
    }

    return () => {
      unsubs.forEach(u => u && u());
    };
  }, [effectiveUid, isJosnuCard]);

  // Resolve live photo and live name
  const photo = profileData?.photoURL || creatorConfig?.photoURL || fallbackPhoto;
  const nameToUse = profileData?.displayName || creatorConfig?.displayName || fallbackName;

  // Resolve live frame
  let resolvedFrameKey = profileData?.avatarFrame || profileData?.selectedFrame || profileData?.selectedMarco || creatorConfig?.avatarFrame;

  if (!resolvedFrameKey || resolvedFrameKey === 'none') {
    if (fallbackFrame && fallbackFrame !== 'none') {
      resolvedFrameKey = fallbackFrame;
    } else if (isJosnuCard) {
      resolvedFrameKey = 'fuego_creador';
    } else {
      resolvedFrameKey = 'carmesi';
    }
  }

  const frameConfig = (showFrame && resolvedFrameKey && AVATAR_FRAMES_MAP[resolvedFrameKey]) 
    ? AVATAR_FRAMES_MAP[resolvedFrameKey] 
    : null;

  // 1. VIP ROTATING CONIC FLAME FRAME (Supports dynamic 4-color Creator gradient)
  if (showFrame && (frameConfig?.type === 'conic_flame' || resolvedFrameKey === 'creator_custom')) {
    const rawColors = profileData?.creatorCustomFrame?.colors || creatorConfig?.creatorCustomFrame?.colors || liveCreatorColors;
    const colors = (rawColors && Array.isArray(rawColors) && rawColors.length >= 4) 
      ? rawColors 
      : (liveCreatorColors || ['#701A75', '#DC2626', '#FF8A00', '#FBBF24']);
    
    const dynamicConicBg = `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[3]}, ${colors[0]})`;
    const dynamicGlow = `0 0 18px ${colors[1]}AA, 0 0 34px ${colors[2]}88, 0 0 48px ${colors[3]}55`;

    const borderWidth = Math.max(3, Math.round(size * 0.08));
    const innerSize = size - (borderWidth * 2);

    return (
      <div 
        className="frame-fuego-creador-container"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: dynamicGlow,
          flexShrink: 0,
          '--creator-conic': dynamicConicBg
        }}
        title="👑 Marco VIP Creador de Fuego RUMBO"
      >
        <div 
          className="frame-fuego-creador-spin" 
          style={{ 
            background: dynamicConicBg,
            '--creator-conic': dynamicConicBg
          }}
        />
        <div style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
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
          fontSize: `${Math.round(innerSize * 0.42)}px`
        }}>
          {photo ? (
            <img 
              src={photo} 
              alt={nameToUse} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : (
            (nameToUse || 'E')[0].toUpperCase()
          )}
        </div>
      </div>
    );
  }

  // 2. VIP ROTATING CONIC RAINBOW FRAME
  if (showFrame && frameConfig?.type === 'conic_rainbow') {
    const borderWidth = Math.max(3, Math.round(size * 0.08));
    const innerSize = size - (borderWidth * 2);

    return (
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: frameConfig.glow,
          flexShrink: 0
        }}
        title="🌈 Marco Arcoíris Neón RUMBO"
      >
        <div className="frame-arcoiris-spin" />
        <div style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
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
          fontSize: `${Math.round(innerSize * 0.42)}px`
        }}>
          {photo ? (
            <img 
              src={photo} 
              alt={nameToUse} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : (
            (nameToUse || 'E')[0].toUpperCase()
          )}
        </div>
      </div>
    );
  }

  // 3. VIBRANT GRADIENT FRAMES (Carmesi, Celeste UNSA, Sol Dorado, Esmeralda, etc.)
  const borderWidth = frameConfig ? Math.max(3, Math.round(size * 0.075)) : 0;
  const innerSize = size - (borderWidth * 2);

  return (
    <div 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        padding: frameConfig ? `${borderWidth}px` : '0px',
        background: frameConfig ? frameConfig.ring : 'transparent',
        boxShadow: frameConfig ? frameConfig.glow : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        width: `${innerSize}px`,
        height: `${innerSize}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--accent-color), #A855F7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: `${Math.round(innerSize * 0.42)}px`
      }}>
        {photo ? (
          <img 
            src={photo} 
            alt={nameToUse} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          (nameToUse || 'E')[0].toUpperCase()
        )}
      </div>
    </div>
  );
};

