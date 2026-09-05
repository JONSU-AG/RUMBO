import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Plus } from 'lucide-react';

export const FloatingUploadButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="floating-upload-btn"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title="Aportar Material o Drive"
      style={{
        position: 'fixed',
        bottom: '96px', // Right above Floating WhatsApp
        right: '24px',
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-color), #8B5CF6)',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 9998,
        backdropFilter: 'blur(10px)'
      }}
    >
      <UploadCloud size={24} />
    </motion.button>
  );
};
