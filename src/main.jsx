import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/ios-glass.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker PWA registrado con éxito:', reg.scope))
      .catch(err => console.warn('⚠️ Error al registrar Service Worker PWA:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

