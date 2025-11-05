/**
 * Hook pour gérer les raccourcis clavier dans la gestion de commandes
 */

import { useEffect, useRef } from 'react';

/**
 * Raccourcis clavier pour la gestion de commandes
 * @param {Object} handlers - Objet contenant les handlers pour chaque raccourci
 * @param {boolean} enabled - Activer/désactiver les raccourcis
 */
const useKeyboardShortcuts = (handlers = {}, enabled = true) => {
  const handlersRef = useRef(handlers);

  // Mettre à jour la ref à chaque render (sans dépendance pour éviter les re-renders)
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Ignorer si on est dans un input, textarea ou select
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.tagName === 'SELECT' ||
        event.target.isContentEditable
      ) {
        return;
      }

      const currentHandlers = handlersRef.current;

      // Ctrl/Cmd + R : Actualiser
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (currentHandlers?.refresh) {
          currentHandlers.refresh();
        }
      }

      // Échap : Fermer/désélectionner
      if (event.key === 'Escape') {
        if (currentHandlers?.escape) {
          currentHandlers.escape();
        }
      }

      // Numéros 1-4 : Actions rapides sur la première commande
      if (event.key >= '1' && event.key <= '4' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (currentHandlers?.quickAction) {
          currentHandlers.quickAction(event.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
};

export default useKeyboardShortcuts;

