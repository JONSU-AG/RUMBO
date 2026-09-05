import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toggleSaveMaterialItem, getLocalSavedMaterials, isItemSavedInList } from '../lib/savedHelper';

export const BookmarkButton = ({ item, size = 'normal', showText = true, onToggle = null }) => {
  const { user } = useAuth();
  const itemId = item?.id || item?._id || (item ? `mat_${(item.title || item[0] || '').replace(/\s+/g, '_')}` : null);
  const [isSaved, setIsSaved] = useState(() => isItemSavedInList(itemId));

  useEffect(() => {
    const handleUpdate = () => {
      setIsSaved(isItemSavedInList(itemId));
    };

    window.addEventListener('rumbo_saved_updated', handleUpdate);
    return () => window.removeEventListener('rumbo_saved_updated', handleUpdate);
  }, [itemId]);

  const handleClick = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetItem = item.id ? item : { ...item, id: itemId };
    const newState = await toggleSaveMaterialItem(user, targetItem);
    setIsSaved(newState);
    if (onToggle) onToggle(newState);
  };

  const isSmall = size === 'small';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      onClick={handleClick}
      title={isSaved ? "Quitar de Guardados" : "Guardar en mi lista personal"}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSmall ? '5px 10px' : '7px 14px',
        borderRadius: '12px',
        border: isSaved ? '1.5px solid #F59E0B' : '1px solid var(--card-border)',
        background: isSaved ? 'rgba(245, 158, 11, 0.16)' : 'rgba(120, 120, 128, 0.08)',
        color: isSaved ? '#F59E0B' : 'var(--text-main)',
        fontSize: isSmall ? '0.78rem' : '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isSaved ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none'
      }}
    >
      {isSaved ? (
        <BookmarkCheck size={isSmall ? 15 : 18} style={{ color: '#F59E0B' }} />
      ) : (
        <Bookmark size={isSmall ? 15 : 18} />
      )}
      {showText && (
        <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
      )}
    </motion.button>
  );
};
