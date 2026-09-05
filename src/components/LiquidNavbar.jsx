import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Cpu, Library, User, Palette, UploadCloud, Shield, Bell, Sparkles, MoreHorizontal, ChevronUp, MessageSquare } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { UploadModal } from './UploadModal';
import { NotificationsModal } from './NotificationsModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const LiquidNavbar = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }
    try {
      const qUser = query(
        collection(db, 'notificaciones'),
        where('recipientUid', '==', user.uid),
        where('read', '==', false)
      );
      const qAll = query(
        collection(db, 'notificaciones'),
        where('recipientUid', '==', 'all'),
        where('read', '==', false)
      );

      let userUnread = 0;
      let allUnread = 0;

      const unsubUser = onSnapshot(qUser, (snap) => {
        userUnread = snap.docs.length;
        setUnreadCount(userUnread + allUnread);
      });

      const unsubAll = onSnapshot(qAll, (snap) => {
        allUnread = snap.docs.length;
        setUnreadCount(userUnread + allUnread);
      });

      return () => {
        unsubUser();
        unsubAll();
      };
    } catch (e) {
      console.warn("Notifications count catch:", e);
    }
  }, [user?.uid]);

  // Click outside listener for upward popover menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const profilePath = user ? '/perfil' : '/auth';

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/cursos', label: 'Cursos', icon: BookOpen },
    { path: '/simulador', label: 'Simulador', icon: Cpu },
    { path: '/biblioteca', label: 'Biblioteca', icon: Library },
    { path: profilePath, label: 'Perfil', icon: User },
  ];

  const isItemActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    if (itemPath === '/cursos') {
      return location.pathname === '/cursos' || location.pathname.startsWith('/cursos/');
    }
    if (itemPath === '/simulador') {
      return location.pathname === '/simulador' || location.pathname.startsWith('/simulador/');
    }
    if (itemPath === '/biblioteca') {
      return location.pathname === '/biblioteca' || location.pathname.startsWith('/biblioteca/');
    }
    if (itemPath === '/auth' || itemPath === '/perfil') {
      return location.pathname === '/auth' || location.pathname === '/perfil' || location.pathname.startsWith('/usuario');
    }
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  const isAdminActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  return (
    <>
      {/* Mobile Header (Fixed Top Bar with Labels for New Users) */}
      <header className="mobile-header" style={{ padding: '6px 8px', gap: '4px', justifyContent: 'space-between' }}>
        <Logo showText={true} size={24} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>

          {/* Dedicated Standalone Chats Route Button */}
          {user && (
            <NavLink
              to="/chats"
              title="Mis Mensajes Privados"
              style={{
                padding: '4px 6px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                fontWeight: 800,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={12} />
              <span className="hide-on-xs">Chats</span>
            </NavLink>
          )}

          {/* Bell Notification Button on Mobile */}
          {user && (
            <button
              onClick={() => setIsNotifOpen(true)}
              title="Notificaciones y Avisos"
              style={{
                padding: '4px 6px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(0, 122, 255, 0.12)',
                color: 'var(--accent-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                fontWeight: 800,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Bell size={12} />
              <span className="hide-on-xs">Avisos</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid var(--card-bg)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Quick upload button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            title="Aportar Material Educativo"
            style={{
              padding: '4px 6px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(0, 122, 255, 0.12)',
              color: 'var(--accent-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.65rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <UploadCloud size={12} />
            <span className="hide-on-xs">Subir</span>
          </button>

          {/* Theme Palette Button */}
          <button
            onClick={() => setIsThemeOpen(true)}
            title="Cambiar Tema Visual"
            style={{
              padding: '4px 6px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(120, 120, 128, 0.12)',
              color: 'var(--text-main)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.65rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Palette size={12} />
            <span className="hide-on-xs">Tema</span>
          </button>
        </div>
      </header>

      {/* Main Floating Navbar (Bottom on Mobile, Top on Desktop) */}
      <div className="liquid-navbar-wrapper">
        <nav className="liquid-navbar">
          <div className="desktop-logo-container">
            <Logo showText={true} />
          </div>
          
          <div className="nav-items-container">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="nav-pill-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={18} style={{ zIndex: 2, position: 'relative' }} />
                  <span style={{ zIndex: 2, position: 'relative' }} className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Admin NavLink for Desktop */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={`nav-item desktop-admin-pill ${isAdminActive ? 'active' : ''}`}
                style={{ color: isAdminActive ? 'var(--pill-active-text)' : '#A855F7' }}
              >
                {isAdminActive && (
                  <motion.div
                    layoutId="activePill"
                    className="nav-pill-active"
                    style={{ background: 'linear-gradient(135deg, #A855F7, #6366F1)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Shield size={18} style={{ zIndex: 2, position: 'relative' }} />
                <span style={{ zIndex: 2, position: 'relative' }} className="nav-label">Admin</span>
              </NavLink>
            )}

            {/* Compact Action Items for Wide Desktop */}
            {user && (
              <button
                onClick={() => setIsNotifOpen(true)}
                className="nav-item desktop-action-btn"
                title="Notificaciones"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-color)',
                  position: 'relative'
                }}
              >
                <Bell size={18} style={{ zIndex: 2, position: 'relative' }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '6px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span style={{ zIndex: 2, position: 'relative' }} className="nav-label">Avisos</span>
              </button>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="nav-item desktop-action-btn"
              title="Aportar Material"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-color)'
              }}
            >
              <UploadCloud size={18} style={{ zIndex: 2, position: 'relative' }} />
              <span style={{ zIndex: 2, position: 'relative' }} className="nav-label">Aportar</span>
            </button>

            <button
              onClick={() => setIsThemeOpen(true)}
              className="nav-item desktop-action-btn"
              title="Cambiar Tema"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)'
              }}
            >
              <Palette size={18} style={{ zIndex: 2, position: 'relative' }} />
              <span style={{ zIndex: 2, position: 'relative' }} className="nav-label">Tema</span>
            </button>

            {/* Upward Floating Popover Menu ("Lista Desplegable Hacia Arriba") */}
            <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`nav-item ${isMenuOpen ? 'menu-open' : ''}`}
                title="Más Opciones & Herramientas"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isMenuOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="nav-pill-active"
                    style={{ background: 'rgba(0,122,255,0.12)' }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                <MoreHorizontal size={18} style={{ zIndex: 2, position: 'relative' }} />
                <span className="nav-label" style={{ zIndex: 2, position: 'relative' }}>Más</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '4px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#EF4444',
                    zIndex: 3
                  }} />
                )}
              </button>

              {/* Lista Desplegable Flotante Hacia Arriba (Glass Popover) */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className="nav-popover-menu"
                  >
                    {/* Avisos */}
                    {user && (
                      <button
                        onClick={() => {
                          setIsNotifOpen(true);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '14px',
                          border: 'none',
                          background: 'rgba(120, 120, 128, 0.06)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Bell size={16} style={{ color: 'var(--accent-color)' }} />
                          <span>Avisos & Notificaciones</span>
                        </div>
                        {unreadCount > 0 && (
                          <span style={{
                            background: '#EF4444',
                            color: '#FFF',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '99px'
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Aportar Material */}
                    <button
                      onClick={() => {
                        setIsUploadOpen(true);
                        setIsMenuOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'rgba(120, 120, 128, 0.06)',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <UploadCloud size={16} style={{ color: 'var(--accent-color)' }} />
                      <span>Aportar Material</span>
                    </button>

                    {/* Cambiar Tema */}
                    <button
                      onClick={() => {
                        setIsThemeOpen(true);
                        setIsMenuOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'rgba(120, 120, 128, 0.06)',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <Palette size={16} style={{ color: '#F59E0B' }} />
                      <span>Cambiar Tema</span>
                    </button>

                    {/* Admin (si es admin) */}
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.15))',
                          color: '#A855F7',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <Shield size={16} />
                        <span>Panel de Admin</span>
                      </NavLink>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
      </div>

      {/* Global Modals */}
      <ThemeSelectorModal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
