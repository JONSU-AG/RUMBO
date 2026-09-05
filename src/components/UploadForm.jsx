import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const UploadForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    desc: '',
    contacto: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Solicitud enviada (mock). En un futuro se guardará en la base de datos.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px', maxWidth: '520px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>🤝 Únete a la Alianza RUMBO</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '24px' }}>
        Comparte tu canal de WhatsApp, YouTube, Instagram, TikTok u otra red si subes material gratuito para estudiantes.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Nombre del Material / Canal *</label>
          <input 
            type="text" 
            required 
            placeholder="Ej. Resumen de Historia o Link de Drive"
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', borderRadius: '10px', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Descripción *</label>
          <textarea 
            required 
            placeholder="¿De qué trata este aporte?"
            value={formData.desc}
            onChange={e => setFormData({...formData, desc: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', borderRadius: '10px', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Archivo o Imagen (Opcional)</label>
          <input 
            type="file" 
            accept="image/*,.pdf"
            onChange={e => console.log("File selected:", e.target.files[0])}
            style={{ width: '100%', padding: '10px', border: '1px dashed var(--accent-color)', borderRadius: '10px', background: 'rgba(0,122,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Formatos soportados: PDF, JPG, PNG. (Lógica de subida lista para Firebase Storage)</span>
        </div>

        <button 
          type="submit" 
          style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 14px rgba(0, 122, 255, 0.3)' }}
        >
          🚀 Compartir Aporte
        </button>
      </form>
    </motion.div>
  );
};
