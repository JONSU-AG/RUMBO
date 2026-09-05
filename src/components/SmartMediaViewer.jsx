import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image as ImageIcon, Folder, ExternalLink, X, Eye, Download, User, Tag } from 'lucide-react';

export const SmartMediaViewer = ({ resource, onClose }) => {
  if (!resource) return null;

  const { title, author, category, type, url } = resource;

  const getDrivePreviewUrl = (driveUrl) => {
    if (!driveUrl) return null;
    if (driveUrl.includes('/view') || driveUrl.includes('/edit')) {
      return driveUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
    }
    if (driveUrl.includes('drive.google.com/drive/folders/')) {
      const folderId = driveUrl.split('folders/')[1]?.split('?')[0];
      return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    }
    return driveUrl;
  };

  const isPdf = type === 'pdf' || url?.endsWith('.pdf');
  const isImage = type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  const isDrive = url?.includes('drive.google.com');

  return (
    <AnimatePresence>
      <div className="ios-modal-backdrop" onClick={onClose}>
        <motion.div
          className="ios-modal-card"
          style={{ maxWidth: '850px', width: '92%', height: '85vh', display: 'flex', flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(66, 133, 244, 0.15)', color: 'var(--google-blue)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  {category || 'Recurso'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} /> {author || 'Autor Anónimo'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Media Viewer Body */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.03)', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPdf && (
              <iframe
                src={`${url}#toolbar=0`}
                title={title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}

            {isImage && (
              <img
                src={url}
                alt={title}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}

            {isDrive && (
              <iframe
                src={getDrivePreviewUrl(url)}
                title={title}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay"
              />
            )}

            {!isPdf && !isImage && !isDrive && (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Folder size={48} color="var(--google-blue)" style={{ marginBottom: '12px' }} />
                <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>Previsualización directa no disponible para este enlace.</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', background: 'var(--accent-gradient)', color: '#fff', textDecoration: 'none', fontWeight: '700' }}
                >
                  Abrir enlace <ExternalLink size={16} />
                </a>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Formato: {type?.toUpperCase() || 'DOCUMENTO'}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '12px', background: 'var(--google-blue)', color: '#fff', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}
            >
              <Download size={16} /> Descargar / Enlace Original
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
