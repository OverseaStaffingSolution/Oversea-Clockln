import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/theme.css';

// Explicit Service Worker Registration (Only in Production to avoid Dev Server conflicts)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré avec succès', registration);
      })
      .catch(err => {
        console.error('❌ Erreur Service Worker:', err);
      });
  });
}

// Fonction pour faire disparaître le splash screen avec une transition douce
function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.remove();
    }, 500);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Cacher le splash après un court délai pour que l'utilisateur voie la transition propre
setTimeout(hideSplashScreen, 800);
