import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// ✅ Application complète restaurée
import App from './App.jsx';
import logger from './utils/logger';

// ✅ Firebase activé
import './config/firebase';
logger.log('🔥 Firebase - Initialisé');

logger.log('🚀 Blossom Café - Démarrage...');

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

// Rendu de l'application avec gestion d'erreur
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
        <App />
      </StrictMode>
    );
    logger.log('✅ Application montée avec succès');
  } catch (error) {
    logger.error('❌ ERREUR lors du rendu:', error);
    // ✅ SÉCURITÉ: Utiliser textContent au lieu de innerHTML pour éviter XSS
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.color = 'red';
    const title = document.createElement('h1');
    title.textContent = 'ERREUR DE RENDU';
    const pre = document.createElement('pre');
    pre.textContent = `${error.message}\n${error.stack}`;
    errorDiv.appendChild(title);
    errorDiv.appendChild(pre);
    rootElement.appendChild(errorDiv);
  }
}

