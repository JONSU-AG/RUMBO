import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// RUMBO · Configuración Firebase — Proyecto: rumbo-jonsu
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Habilitar persistencia offline para lectura ultra-rápida y uso sin conexión
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Múltiples pestañas abiertas, la persistencia offline de Firestore se mantendrá en la pestaña principal.");
    } else if (err.code === 'unimplemented') {
      console.warn("El navegador actual no soporta persistencia IndexedDB.");
    }
  });
} catch (e) {
  console.warn("Firestore offline persistence init:", e);
}

export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;

