import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Correos autorizados del autor / creador del proyecto Firebase (rumbo-jonsu)
export const ADMIN_EMAILS = [
  'aguilar.jonsu@gmail.com',
  'rumbo.jonsu@gmail.com',
  'jhojan.aguilar.13.10@gmail.com',
  'rulua617@gmail.com',
  '147279812+rulua617@users.noreply.github.com'
];

/**
 * Determina si un correo pertenece al autor/creador del proyecto Firebase (Jonsu Aguilar)
 */
export const isAuthorOfFirebase = (email) => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => e === a.toLowerCase());
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAlly, setIsAlly] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Sistema de advertencias en pantalla (sin bloqueo duro)
  const [hasWarning, setHasWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAuthor = isAuthorOfFirebase(currentUser.email);
        const storedAdmin = localStorage.getItem('rumbo_firebase_admin') === 'true';

        try {
          const userRef = doc(db, 'usuarios', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setIsAlly(Boolean(data.isAlly || isAuthor));
            
            // Administrador: Si coincide por correo autor, rol en Firestore o flag persistida
            const adminStatus = Boolean(
              isAuthor || 
              data.role === 'admin' || 
              data.isAdmin === true || 
              data.isCreator === true ||
              storedAdmin
            );
            setIsAdmin(adminStatus);

            // Si es autor de Firebase, sincronizamos su rol de creador en Firestore
            if (isAuthor && (!data.isAdmin || data.role !== 'admin')) {
              await setDoc(userRef, { 
                isAdmin: true, 
                role: 'admin', 
                isCreator: true, 
                isAlly: true 
              }, { merge: true });
            }

            // Aviso en pantalla (no bloqueo)
            const warningActive = Boolean((data.hasWarning || data.banned) && !data.warningDismissed);
            setHasWarning(warningActive);
            setWarningMessage(data.warningMessage || data.banReason || '');
          } else {
            // Registro inicial de usuario
            const newRecord = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: 'Estudiante RUMBO',
              photoURL: currentUser.photoURL,
              uploadCount: 0,
              isAlly: isAuthor,
              isAdmin: isAuthor || storedAdmin,
              role: (isAuthor || storedAdmin) ? 'admin' : 'estudiante',
              isCreator: isAuthor,
              banned: false,
              hasWarning: false,
              warningMessage: '',
              bio: 'Estudiante enfocado en alcanzar la meta universitaria.',
              whatsappChannel: '',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newRecord);
            setUserData(newRecord);
            setIsAlly(newRecord.isAlly);
            setIsAdmin(newRecord.isAdmin);
            setHasWarning(false);
          }
        } catch (err) {
          console.warn("Firestore error in AuthContext:", err.message);
          // Fallback seguro en memoria para el autor de Firebase
          if (isAuthor || storedAdmin) {
            setIsAdmin(true);
            setIsAlly(true);
          }
        }
      } else {
        setUserData(null);
        setIsAlly(false);
        setIsAdmin(false);
        setHasWarning(false);
        setWarningMessage('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reclamar o verificar rol de Administrador usando el Project ID de Firebase
  const claimAdminRole = async (keyInput) => {
    if (!keyInput) return { success: false, message: 'Ingresa la clave de autorización' };
    const cleanKey = keyInput.toLowerCase().trim();

    // Llaves maestras del proyecto Firebase
    const validKeys = [
      'rumbo-jonsu',
      'jonsu',
      'rumbo2026',
      '432336496806',
      '12dea10b50433371abac67'
    ];

    if (validKeys.includes(cleanKey)) {
      localStorage.setItem('rumbo_firebase_admin', 'true');
      setIsAdmin(true);
      setIsAlly(true);

      if (user) {
        try {
          const userRef = doc(db, 'usuarios', user.uid);
          await setDoc(userRef, { 
            isAdmin: true, 
            role: 'admin', 
            isCreator: true, 
            isAlly: true 
          }, { merge: true });
        } catch (e) {
          console.warn("Error saving admin claim to Firestore:", e);
        }
      }
      return { success: true, message: '¡Rol de Administrador y Creador verificado exitosamente!' };
    }

    return { success: false, message: 'Clave no coincide con las credenciales del proyecto Firebase.' };
  };

  // Descartar aviso en pantalla
  const dismissWarning = async () => {
    setHasWarning(false);
    if (user) {
      try {
        const userRef = doc(db, 'usuarios', user.uid);
        await setDoc(userRef, { warningDismissed: true, hasWarning: false }, { merge: true });
      } catch (e) {
        console.warn("Error dismissing warning in Firestore:", e);
      }
    }
  };

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => {
    localStorage.removeItem('rumbo_firebase_admin');
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      isAlly, 
      isAdmin, 
      isBanned: false, // Nunca bloqueado duro, siempre aviso
      hasWarning,
      warningMessage,
      dismissWarning,
      claimAdminRole,
      loading, 
      loginWithGoogle, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
