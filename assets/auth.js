// ===========================================================
// RUMBO — Control de acceso y Citas Diarias (assets/auth.js)
// -----------------------------------------------------------
// NOTA: El sistema de bloqueo por usuario y contraseña ha sido
// desactivado temporalmente para permitir acceso libre.
// ===========================================================

function rumboShowQuote(){
  if (typeof window.actualizarTarjetasFrase === 'function') {
    window.actualizarTarjetasFrase();
  }
}

// ===========================================================
// INICIALIZACIÓN
// ===========================================================
function initGate(){
  document.documentElement.classList.remove('rumbo-locked');
  rumboShowQuote();
}

document.addEventListener('DOMContentLoaded', initGate);
