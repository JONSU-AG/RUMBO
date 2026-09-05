import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from './UserProfile';

// ─── Auth Form (when logged out) or Direct UserProfile (when logged in) ─────
export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in → show complete social profile & contributions feed directly!
  if (user) {
    return <UserProfile />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      const msgs = {
        'auth/operation-not-allowed': 'Activa Email/Password en Firebase Console.',
        'auth/email-already-in-use': 'Este correo ya tiene una cuenta.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/user-not-found': 'No existe cuenta con ese correo.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/invalid-email': 'Correo electrónico inválido.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.warn("Google auth error:", err);
      const msgs = {
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de iniciar sesión.',
        'auth/operation-not-allowed': 'Activa el proveedor de Google en Firebase Console.',
        'auth/popup-blocked': 'La ventana emergente fue bloqueada.',
      };
      if (err.message?.includes('initial') || err.code === 'auth/internal-error' || err.code === 'auth/unauthorized-domain') {
        setError('En la app móvil Android, por favor regístrate o ingresa usando tu Correo y Contraseña.');
      } else {
        setError(msgs[err.code] || 'Error con Google. Por favor ingresa usando tu Correo y Contraseña.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="ios-glass-card"
        style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: '32px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0, 122, 255, 0.1)', borderRadius: '50%', color: 'var(--accent-color)', marginBottom: '16px' }}>
            <User size={40} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isLogin ? 'Bienvenido Aliado' : 'Únete a RUMBO'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {isLogin ? 'Ingresa para gestionar tus aportes' : 'Crea tu cuenta de Aliado'}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ padding: '12px', background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: '16px',
            border: '1.5px solid var(--card-border)', background: 'var(--card-bg)',
            color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginBottom: '24px', opacity: googleLoading ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </motion.button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>o con correo</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="email" placeholder="Correo electrónico" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1.5px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1.5px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{ marginTop: '4px', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1, transition: 'all 0.3s ease' }}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
            {!loading && <ArrowRight size={18} />}
          </motion.button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya eres Aliado? Inicia sesión'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
