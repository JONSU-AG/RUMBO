import React, { useState } from 'react';

export const Logo = ({ className = '', showText = true }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-primary)' }} className={className}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {!imageFailed ? (
          <img
            src="/assets/LOGOR.png"
            alt="RUMBO"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <circle cx="18" cy="24" r="14" fill="#4CC3F0" />
            <circle cx="16" cy="19" r="2.2" fill="#0B1229" />
            <path d="M8 24 L2 20 L8 28 Z" fill="#4CC3F0" />
            <text x="13" y="34" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="26" fill="#E8433F">R</text>
          </svg>
        )}
      </div>
      {showText && <span>RUMBO</span>}
    </div>
  );
};
