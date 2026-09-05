import React, { useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LiquidNavbar } from './components/LiquidNavbar';
import { CookieBanner } from './components/CookieBanner';
import { IOSModal } from './components/IOSModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { WarningBanner } from './components/WarningBanner';
import { Loader2 } from 'lucide-react';

import { Home } from './pages/Home';
import { Cursos } from './pages/Cursos';
import { AcademyDetail } from './pages/AcademyDetail';
import { Biblioteca } from './pages/Biblioteca';
import { Simulador } from './pages/Simulador';
import { Auth } from './pages/Auth';
import { Admin } from './pages/Admin';
import { UserProfile } from './pages/UserProfile';
import { Chats } from './pages/Chats';

const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: 'var(--accent-color)'
  }}>
    <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Cargando módulo RUMBO...</span>
  </div>
);

import { useLocation } from 'react-router-dom';

// Maintains individual scroll position for each route independently
const scrollPositions = new Map();

function ScrollPositionRestorer() {
  const location = useLocation();

  React.useEffect(() => {
    // 1. Save scroll position of current page before leaving
    const handleScroll = () => {
      scrollPositions.set(location.pathname, window.scrollY);
    };

    // Save scroll on scroll event and before unload
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 2. Restore saved scroll position for target page (or top if first visit)
    const savedY = scrollPositions.get(location.pathname);
    if (savedY !== undefined) {
      window.scrollTo({ top: savedY, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    return () => {
      // Save current scroll position on cleanup (route departure)
      scrollPositions.set(location.pathname, window.scrollY);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return null;
}

export function App() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenTerms = () => setIsTermsOpen(true);
    window.addEventListener('rumbo_open_terms', handleOpenTerms);
    return () => window.removeEventListener('rumbo_open_terms', handleOpenTerms);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollPositionRestorer />
          <div style={{ minHeight: '100vh', position: 'relative' }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cursos" element={<Cursos />} />
                <Route path="/cursos/:id" element={<AcademyDetail />} />
                <Route path="/biblioteca" element={<Biblioteca />} />
                <Route path="/simulador" element={<Simulador />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/usuario/:uid" element={<UserProfile />} />
                <Route path="/perfil" element={<UserProfile />} />
              </Routes>
            </Suspense>

            {/* Liquid Floating Navbar */}
            <LiquidNavbar />

            {/* In-App On-Screen Notice Banner (Llamado de atención de moderación) */}
            <WarningBanner />

            {/* Floating Elements */}
            <FloatingWhatsApp />

            {/* Cookie & Terms Banner */}
            <CookieBanner onOpenTerms={() => setIsTermsOpen(true)} />

            {/* Terms and Privacy iOS Modal */}
            <IOSModal
              isOpen={isTermsOpen}
              onClose={() => setIsTermsOpen(false)}
              title="Términos, Condiciones & Privacidad"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                <p style={{ margin: 0 }}>
                  <strong>1. Propósito Educativo Comunitario:</strong> RUMBO es un espacio de apoyo preuniversitario libre y gratuito impulsado por la comunidad estudiantil para facilitar el aprendizaje y la preparación académica.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>2. Protección Absoluta de la Privacidad:</strong> Tu privacidad y datos personales están resguardados bajo altos estándares de seguridad en la nube (Firebase / Google Cloud). No comercializamos ni exponemos tu información personal.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>3. Almacenamiento Comunitario Neutro (Estilo Nube):</strong> La plataforma opera como infraestructura neutra de almacenamiento comunitario (similar a Google Drive o servicios en la nube) donde los estudiantes comparten enlaces y apuntes de buena fe para su estudio personal.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>4. Uso Justo y Académico:</strong> Todo el material compartido en la plataforma tiene la única finalidad de apoyar el aprendizaje libre y la difusión del conocimiento preuniversitario sin fines de lucro.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>5. Retiro Amigable por Reporte:</strong> RUMBO respeta el trabajo de autores e instituciones. Si eres titular de derechos sobre algún material y solicitas su retiro, la plataforma atenderá amigablemente tu solicitud y procederá a su eliminación de inmediato a través del sistema de reportes disponible en cada publicación.
                </p>
              </div>
            </IOSModal>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
