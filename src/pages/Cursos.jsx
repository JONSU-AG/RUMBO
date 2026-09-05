import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Book, Award, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InspirationalDailyBanner } from '../components/InspirationalDailyBanner';

export const WhatsAppIconSVG = ({ size = 18, color = "currentColor", style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={style}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export const Cursos = () => {
  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      {/* 2-Column Hero Grid: Inspiración + Comunidad */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto 32px',
          width: '100%',
          alignItems: 'stretch'
        }}
      >
        {/* Columna 1: Frase / Versículo Inspiracional */}
        <InspirationalDailyBanner style={{ maxWidth: '100%', margin: 0, height: '100%' }} />

        {/* Columna 2: Mensaje de la Comunidad RUMBO */}
        <div 
          className="glass-card"
          style={{
            borderRadius: '24px',
            padding: '20px 24px',
            border: '1.5px solid rgba(0, 122, 255, 0.25)',
            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(52, 168, 83, 0.04) 100%)',
            boxShadow: '0 8px 30px rgba(0, 122, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
            boxSizing: 'border-box',
            height: '100%'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💙 Mensaje de la Comunidad
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'rgba(0,122,255,0.1)', padding: '2px 10px', borderRadius: '10px' }}>
                Comunidad RUMBO
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: 'var(--text-main)' }}>Mantener este espacio cuesta tiempo y dedicación.</strong> Si el contenido te sirve, únete a nuestro canal oficial y comparte RUMBO con tus compañeros.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
            <a 
              href="https://www.whatsapp.com/channel/0029VbDFAEu7YScyVZBNul0X"
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '10px 16px',
                borderRadius: '14px',
                background: '#25D366',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <WhatsAppIconSVG size={18} /> Canal WhatsApp
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                alert('¡Enlace de RUMBO copiado al portapapeles! 🚀');
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '14px',
                border: '1.5px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Share2 size={16} /> Compartir
            </button>
          </div>
        </div>
      </div>

      <header style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Academias y Cursos</h1>
      </header>

      <section className="academy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Esparta - Red Theme */}
        <Link to="/cursos/esparta" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card" 
            style={{ 
              padding: '28px', 
              borderRadius: '28px',
              border: '2px solid rgba(255, 59, 48, 0.3)',
              background: 'linear-gradient(180deg, rgba(255, 59, 48, 0.08) 0%, var(--card-bg) 60%)',
              boxShadow: '0 12px 30px rgba(255, 59, 48, 0.12)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxSizing: 'border-box',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)', 
                color: '#FFFFFF', 
                padding: '6px 14px', 
                borderRadius: '999px', 
                fontWeight: 800, 
                fontSize: '0.85rem',
                boxShadow: '0 4px 10px rgba(255, 59, 48, 0.3)'
              }}>
                ⚔️ ESPARTA
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>18 Materias</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Academia Esparta</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
              Preparación exigente y disciplinada para asegurar tu vacante universitaria.
            </p>
            <div style={{ 
              width: '100%', 
              textAlign: 'center', 
              padding: '14px', 
              background: 'linear-gradient(135deg, #FF3B30, #FF5252)', 
              color: '#FFFFFF', 
              borderRadius: '16px', 
              fontWeight: 800, 
              fontSize: '1rem',
              boxShadow: '0 6px 18px rgba(255, 59, 48, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxSizing: 'border-box'
            }}>
              Ingresar a Clases de Esparta ➔
            </div>
          </motion.div>
        </Link>

        {/* Kelsen - Blue Theme */}
        <Link to="/cursos/kelsen" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card" 
            style={{ 
              padding: '28px', 
              borderRadius: '28px',
              border: '2px solid rgba(0, 122, 255, 0.3)',
              background: 'linear-gradient(180deg, rgba(0, 122, 255, 0.08) 0%, var(--card-bg) 60%)',
              boxShadow: '0 12px 30px rgba(0, 122, 255, 0.12)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxSizing: 'border-box',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #007AFF, #00C6FF)', 
                color: '#FFFFFF', 
                padding: '6px 14px', 
                borderRadius: '999px', 
                fontWeight: 800, 
                fontSize: '0.85rem',
                boxShadow: '0 4px 10px rgba(0, 122, 255, 0.3)'
              }}>
                ⚖️ KELSEN
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Letras y Leyes</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Academia Kelsen</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
              Especialistas en humanidades, derecho, ciencias sociales y letras preuniversitarias.
            </p>
            <div style={{ 
              width: '100%', 
              textAlign: 'center', 
              padding: '14px', 
              background: 'linear-gradient(135deg, #007AFF, #0A84FF)', 
              color: '#FFFFFF', 
              borderRadius: '16px', 
              fontWeight: 800, 
              fontSize: '1rem',
              boxShadow: '0 6px 18px rgba(0, 122, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxSizing: 'border-box'
            }}>
              Ingresar a Clases de Kelsen ➔
            </div>
          </motion.div>
        </Link>

        {/* Briceño - Green Theme */}
        <Link to="/cursos/briceno" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card" 
            style={{ 
              padding: '28px', 
              borderRadius: '28px',
              border: '2px solid rgba(5, 150, 105, 0.3)',
              background: 'linear-gradient(180deg, rgba(5, 150, 105, 0.08) 0%, var(--card-bg) 60%)',
              boxShadow: '0 12px 30px rgba(5, 150, 105, 0.12)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxSizing: 'border-box',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #059669, #34D399)', 
                color: '#FFFFFF', 
                padding: '6px 14px', 
                borderRadius: '999px', 
                fontWeight: 800, 
                fontSize: '0.85rem',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
              }}>
                🎓 BRICEÑO
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>2027 EN CURSO</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Academia Briceño</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
              Ciclo 2027 en curso (CEPREUNSA / Ordinario) y Proceso 2026 intensivo con todas las áreas.
            </p>
            <div style={{ 
              width: '100%', 
              textAlign: 'center', 
              padding: '14px', 
              background: 'linear-gradient(135deg, #059669, #10B981)', 
              color: '#FFFFFF', 
              borderRadius: '16px', 
              fontWeight: 800, 
              fontSize: '1rem',
              boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxSizing: 'border-box'
            }}>
              Ingresar a Clases de Briceño ➔
            </div>
          </motion.div>
        </Link>
      </section>
    </div>
  );
};
