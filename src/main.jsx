import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// ✅ Application complète restaurée
import App from './App.jsx';
// ⚠️ Service Worker COMPLÈTEMENT DÉSACTIVÉ pour debug
// Désinscrire tous les Service Workers existants
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().then(() => {
        // noop
      });
    });
  });
}

// Rendu de l'application avec gestion d'erreur
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ ERREUR: Élément #root introuvable');
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
  } catch (error) {
    console.error('❌ ERREUR lors du rendu:', error);
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

