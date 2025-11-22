import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import KioskApp from './kiosk/KioskApp';
import ErrorBoundary from './components/common/ErrorBoundary';
import logger from './utils/logger';

logger.log('🚀 Blossom Café Kiosk - Démarrage...');

// ⚠️ Service Worker COMPLÈTEMENT DÉSACTIVÉ pour debug
// Désinscrire tous les Service Workers existants
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().then(() => {
        logger.log('✅ Service Worker désinscrit:', registration.scope);
      });
    });
  });
}

// Rendu de l'application kiosk avec gestion d'erreur
const rootElement = document.getElementById('root');
if (!rootElement) {
  logger.error('❌ ERREUR: Élément #root introuvable');
  // ✅ SÉCURITÉ: Utiliser textContent au lieu de innerHTML pour éviter XSS
  const errorDiv = document.createElement('div');
  errorDiv.style.padding = '20px';
  errorDiv.style.color = 'red';
  errorDiv.textContent = 'ERREUR: Élément #root introuvable';
  document.body.appendChild(errorDiv);
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <KioskApp />
        </ErrorBoundary>
      </StrictMode>
    );
    logger.log('✅ Application Kiosk montée avec succès');
  } catch (error) {
    logger.error('❌ ERREUR lors du rendu du Kiosk:', error);
    // ✅ SÉCURITÉ: Utiliser textContent au lieu de innerHTML pour éviter XSS
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.color = 'red';
    const title = document.createElement('h1');
    title.textContent = 'ERREUR DE RENDU - KIOSK';
    const pre = document.createElement('pre');
    pre.textContent = `${error.message}\n${error.stack}`;
    errorDiv.appendChild(title);
    errorDiv.appendChild(pre);
    rootElement.appendChild(errorDiv);
  }
}

