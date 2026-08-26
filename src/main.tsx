import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import './styles/theme.css';

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

// Register PWA service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, refreshing...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline.');
  },
  onRegisterError(error) {
    console.warn('[PWA] Service worker registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Cacher le splash après un court délai pour que l'utilisateur voie la transition propre
setTimeout(hideSplashScreen, 800);
