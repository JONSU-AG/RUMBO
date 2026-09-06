import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  Cpu,
  Library,
  User,
  Palette,
  UploadCloud,
  Shield,
  Bell,
  MoreHorizontal,
  MessageSquare,
  Download
} from 'lucide-react';

import { Logo } from './Logo';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { UploadModal } from './UploadModal';
import { NotificationsModal } from './NotificationsModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

export const LiquidNavbar = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ============================================================
  // PWA
  // ============================================================

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const menuRef = useRef(null);

  // ============================================================
  // PWA: DETECTAR INSTALACIÓN Y CAPTURAR PROMPT
  // ============================================================

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

      setIsStandalone(Boolean(standalone));
    };

    checkStandalone();

    // ----------------------------------------------------------
    // IMPORTANTE:
    // index.html puede haber capturado el evento antes de que
    // LiquidNavbar se monte.
    // ----------------------------------------------------------

    if (window.deferredPWAEvent) {
      setDeferredPrompt(window.deferredPWAEvent);

      console.log(
        '✅ RUMBO: recuperando evento PWA capturado previamente'
      );
    }

    // ----------------------------------------------------------
    // Capturar evento si aparece después
    // ----------------------------------------------------------

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();

      window.deferredPWAEvent = event;
      setDeferredPrompt(event);

      console.log(
        '✅ RUMBO: instalación PWA disponible'
      );
    };

    // ----------------------------------------------------------
    // Detectar instalación completada
    // ----------------------------------------------------------

    const handleAppInstalled = () => {
      console.log(
        '✅ RUMBO: aplicación instalada correctamente'
      );

      window.deferredPWAEvent = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      'appinstalled',
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        'appinstalled',
        handleAppInstalled
      );
    };
  }, []);

  // ============================================================
  // INSTALAR PWA
  // ============================================================

  const handleInstallPWA = async () => {
    setIsMenuOpen(false);

    // ----------------------------------------------------------
    // Ya está instalada
    // ----------------------------------------------------------

    if (isStandalone) {
      alert(
        '✅ Ya estás disfrutando de RUMBO como aplicación instalada.'
      );

      return;
    }

    // ----------------------------------------------------------
    // Recuperar el prompt.
    //
    // Primero usamos el estado de React.
    // Si todavía no existe, usamos el evento global capturado
    // por index.html.
    // ----------------------------------------------------------

    const activePrompt =
      deferredPrompt || window.deferredPWAEvent;

    // ----------------------------------------------------------
    // Chrome todavía no ha proporcionado el prompt
    // ----------------------------------------------------------

    if (!activePrompt) {
      alert(
        '📱 La instalación de RUMBO todavía no está disponible.\n\n' +
        'Si estás usando Chrome o Edge, abre el menú ⋮ y busca ' +
        '"Instalar aplicación" o "Añadir a pantalla de inicio".'
      );

      return;
    }

    try {
      console.log(
        '📱 RUMBO: mostrando ventana nativa de instalación...'
      );

      // --------------------------------------------------------
      // Mostrar diálogo nativo
      // --------------------------------------------------------

      await activePrompt.prompt();

      // --------------------------------------------------------
      // Esperar respuesta del usuario
      // --------------------------------------------------------

      const choice = await activePrompt.userChoice;

      console.log(
        '📱 RUMBO: resultado de instalación:',
        choice?.outcome
      );

      // --------------------------------------------------------
      // El evento beforeinstallprompt solo puede utilizarse una
      // vez, por eso lo limpiamos.
      // --------------------------------------------------------

      window.deferredPWAEvent = null;
      setDeferredPrompt(null);

      if (choice?.outcome === 'accepted') {
        setIsStandalone(true);

        console.log(
          '✅ RUMBO: instalación aceptada'
        );
      } else {
        console.log(
          'ℹ️ RUMBO: instalación cancelada por el usuario'
        );
      }

    } catch (error) {
      console.error(
        '❌ RUMBO: error al mostrar instalación PWA:',
        error
      );
    }
  };

  // ============================================================
  // NOTIFICACIONES
  // ============================================================

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
      console.warn(
        'Notifications count catch:',
        e
      );
    }
  }, [user?.uid]);

  // ============================================================
  // CLICK FUERA DEL MENÚ
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener(
        'mousedown',
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [isMenuOpen]);

  // ============================================================
  // RUTAS
  // ============================================================

  const profilePath = user ? '/perfil' : '/auth';

  const navItems = [
    {
      path: '/',
      label: 'Inicio',
      icon: Home
    },
    {
      path: '/cursos',
      label: 'Cursos',
      icon: BookOpen
    },
    {
      path: '/simulador',
      label: 'Simulador',
      icon: Cpu
    },
    {
      path: '/biblioteca',
      label: 'Biblioteca',
      icon: Library
    },
    {
      path: profilePath,
      label: 'Perfil',
      icon: User
    }
  ];

  // ============================================================
  // ITEM ACTIVO
  // ============================================================

  const isItemActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }

    if (itemPath === '/cursos') {
      return (
        location.pathname === '/cursos' ||
        location.pathname.startsWith('/cursos/')
      );
    }

    if (itemPath === '/simulador') {
      return (
        location.pathname === '/simulador' ||
        location.pathname.startsWith('/simulador/')
      );
    }

    if (itemPath === '/biblioteca') {
      return (
        location.pathname === '/biblioteca' ||
        location.pathname.startsWith('/biblioteca/')
      );
    }

    if (
      itemPath === '/auth' ||
      itemPath === '/perfil'
    ) {
      return (
        location.pathname === '/auth' ||
        location.pathname === '/perfil' ||
        location.pathname.startsWith('/usuario')
      );
    }

    return (
      location.pathname === itemPath ||
      location.pathname.startsWith(`${itemPath}/`)
    );
  };

  const isAdminActive =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/');

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ======================================================
          MOBILE HEADER
          ====================================================== */}

      <header
        className="mobile-header"
        style={{
          padding: '6px 10px',
          gap: '6px',
          justifyContent: 'space-between'
        }}
      >
        <Logo
          showText={true}
          size={28}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >

          {/* Chats */}

          {user && (
            <NavLink
              to="/chats"
              title="Mis Mensajes Privados"
              style={{
                padding: '4px 8px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#059669',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '0.62rem',
                fontWeight: 800,
                textDecoration: 'none',
                cursor: 'pointer',
                minWidth: '42px'
              }}
            >
              <MessageSquare size={15} />
              <span className="hide-on-xs">
                Chats
              </span>
            </NavLink>
          )}

          {/* Notificaciones */}

          {user && (
            <button
              onClick={() => setIsNotifOpen(true)}
              title="Notificaciones y Avisos"
              style={{
                padding: '4px 8px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(0, 122, 255, 0.12)',
                color: 'var(--accent-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '0.62rem',
                fontWeight: 800,
                cursor: 'pointer',
                position: 'relative',
                minWidth: '42px'
              }}
            >
              <Bell size={15} />

              <span className="hide-on-xs">
                Avisos
              </span>

              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '2px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border:
                      '1.5px solid var(--card-bg)'
                  }}
                >
                  {unreadCount > 9
                    ? '9+'
                    : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Subir */}

          <button
            onClick={() => setIsUploadOpen(true)}
            title="Aportar Material Educativo"
            style={{
              padding: '4px 8px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(0, 122, 255, 0.12)',
              color: 'var(--accent-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              fontSize: '0.62rem',
              fontWeight: 800,
              cursor: 'pointer',
              minWidth: '42px'
            }}
          >
            <UploadCloud size={15} />

            <span className="hide-on-xs">
              Subir
            </span>
          </button>

          {/* Tema */}

          <button
            onClick={() => setIsThemeOpen(true)}
            title="Cambiar Tema Visual"
            style={{
              padding: '4px 8px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(120, 120, 128, 0.12)',
              color: 'var(--text-main)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              fontSize: '0.62rem',
              fontWeight: 800,
              cursor: 'pointer',
              minWidth: '42px'
            }}
          >
            <Palette size={15} />

            <span className="hide-on-xs">
              Tema
            </span>
          </button>
        </div>
      </header>

      {/* ======================================================
          MAIN FLOATING NAVBAR
          ====================================================== */}

      <div className="liquid-navbar-wrapper">

        <nav className="liquid-navbar">

          <div className="desktop-logo-container">
            <Logo showText={true} />
          </div>

          <div className="nav-items-container">

            {/* Navegación */}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                isItemActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={`nav-item ${
                    isActive ? 'active' : ''
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="nav-pill-active"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30
                      }}
                    />
                  )}

                  <Icon
                    size={18}
                    style={{
                      zIndex: 2,
                      position: 'relative'
                    }}
                  />

                  <span
                    style={{
                      zIndex: 2,
                      position: 'relative'
                    }}
                    className="nav-label"
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}

            {/* Admin */}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={`nav-item desktop-admin-pill ${
                  isAdminActive ? 'active' : ''
                }`}
                style={{
                  color: isAdminActive
                    ? 'var(--pill-active-text)'
                    : '#A855F7'
                }}
              >
                {isAdminActive && (
                  <motion.div
                    layoutId="activePill"
                    className="nav-pill-active"
                    style={{
                      background:
                        'linear-gradient(135deg, #A855F7, #6366F1)'
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}

                <Shield
                  size={18}
                  style={{
                    zIndex: 2,
                    position: 'relative'
                  }}
                />

                <span
                  style={{
                    zIndex: 2,
                    position: 'relative'
                  }}
                  className="nav-label"
                >
                  Admin
                </span>
              </NavLink>
            )}

            {/* Avisos */}

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
                <Bell
                  size={18}
                  style={{
                    zIndex: 2,
                    position: 'relative'
                  }}
                />

                {unreadCount > 0 && (
                  <span
                    style={{
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
                    }}
                  >
                    {unreadCount > 9
                      ? '9+'
                      : unreadCount}
                  </span>
                )}

                <span
                  style={{
                    zIndex: 2,
                    position: 'relative'
                  }}
                  className="nav-label"
                >
                  Avisos
                </span>
              </button>
            )}

            {/* Aportar */}

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
              <UploadCloud
                size={18}
                style={{
                  zIndex: 2,
                  position: 'relative'
                }}
              />

              <span
                style={{
                  zIndex: 2,
                  position: 'relative'
                }}
                className="nav-label"
              >
                Aportar
              </span>
            </button>

            {/* Tema */}

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
              <Palette
                size={18}
                style={{
                  zIndex: 2,
                  position: 'relative'
                }}
              />

              <span
                style={{
                  zIndex: 2,
                  position: 'relative'
                }}
                className="nav-label"
              >
                Tema
              </span>
            </button>

            {/* ==================================================
                MENÚ MÁS
                ================================================== */}

            <div
              ref={menuRef}
              style={{
                position: 'relative',
                display: 'inline-flex'
              }}
            >

              <button
                onClick={() =>
                  setIsMenuOpen(!isMenuOpen)
                }
                className={`nav-item ${
                  isMenuOpen ? 'menu-open' : ''
                }`}
                title="Más Opciones & Herramientas"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isMenuOpen
                    ? 'var(--accent-color)'
                    : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >

                {isMenuOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.9
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9
                    }}
                    className="nav-pill-active"
                    style={{
                      background:
                        'rgba(0,122,255,0.12)'
                    }}
                    transition={{
                      duration: 0.15
                    }}
                  />
                )}

                <MoreHorizontal
                  size={18}
                  style={{
                    zIndex: 2,
                    position: 'relative'
                  }}
                />

                <span
                  className="nav-label"
                  style={{
                    zIndex: 2,
                    position: 'relative'
                  }}
                >
                  Más
                </span>

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '4px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      zIndex: 3
                    }}
                  />
                )}
              </button>

              {/* ==================================================
                  POPOVER
                  ================================================== */}

              <AnimatePresence>

                {isMenuOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.94
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.94
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 28
                    }}
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
                          background:
                            'rgba(120, 120, 128, 0.06)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            'space-between',
                          width: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <Bell
                            size={16}
                            style={{
                              color:
                                'var(--accent-color)'
                            }}
                          />

                          <span>
                            Avisos & Notificaciones
                          </span>
                        </div>

                        {unreadCount > 0 && (
                          <span
                            style={{
                              background: '#EF4444',
                              color: '#FFF',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '99px'
                            }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Aportar */}

                    <button
                      onClick={() => {
                        setIsUploadOpen(true);
                        setIsMenuOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background:
                          'rgba(120, 120, 128, 0.06)',
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
                      <UploadCloud
                        size={16}
                        style={{
                          color:
                            'var(--accent-color)'
                        }}
                      />

                      <span>
                        Aportar Material
                      </span>
                    </button>

                    {/* Tema */}

                    <button
                      onClick={() => {
                        setIsThemeOpen(true);
                        setIsMenuOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background:
                          'rgba(120, 120, 128, 0.06)',
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
                      <Palette
                        size={16}
                        style={{
                          color: '#F59E0B'
                        }}
                      />

                      <span>
                        Cambiar Tema
                      </span>
                    </button>

                    {/* ==================================================
                        INSTALAR APP PWA
                        ================================================== */}

                    <button
                      onClick={handleInstallPWA}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background:
                          'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <Download size={16} />

                      <span>
                        {isStandalone
                          ? 'App Instalada'
                          : 'Instalar App (PWA)'}
                      </span>
                    </button>

                    {/* Admin */}

                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() =>
                          setIsMenuOpen(false)
                        }
                        style={{
                          padding: '10px 14px',
                          borderRadius: '14px',
                          background:
                            'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.15))',
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

                        <span>
                          Panel de Admin
                        </span>
                      </NavLink>
                    )}

                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </div>

        </nav>

      </div>

      {/* ======================================================
          MODALES
          ====================================================== */}

      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

    </>
  );
};