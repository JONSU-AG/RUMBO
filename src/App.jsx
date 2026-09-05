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
              <p><strong>1. Uso de la Plataforma:</strong> RUMBO es una plataforma educativa de libre acceso orientada a la preparación preuniversitaria.</p>
              <p><strong>2. Aliados y Usuarios:</strong> Los usuarios pueden registrarse voluntariamente para personalizar su aprendizaje y acceder a la creación de flashcards y marcadores.</p>
              <p><strong>3. Propiedad Intelectual:</strong> Todo el material educativo se comparte con fines puramente académicos y divulgativos.</p>
              <p><strong>4. Protección de Datos:</strong> No comercializamos tus datos. Tu información se almacena de forma segura en infraestructura Firebase (Google Cloud).</p>
            </IOSModal>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
