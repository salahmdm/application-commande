import React, { useEffect } from 'react';
import logger from './utils/logger';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';

/**
 * Version avec stores pour tester
 */
function AppWithStores() {
  useEffect(() => {
    logger.log('✅ AppWithStores - Composant monté');
  }, []);

  // Tester les stores
  try {
    const { user, isAuthenticated, role } = useAuthStore();
    const currentView = useUIStore((state) => state.currentView);
    const setCurrentView = useUIStore((state) => state.setCurrentView);

    logger.log('✅ Stores chargés:', { 
      user: user ? 'présent' : 'null', 
      isAuthenticated, 
      role, 
      currentView 
    });

    return (
      <div style={{ 
        padding: '40px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh'
      }}>
        <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
          ✅ AppWithStores fonctionne
        </h1>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ marginBottom: '10px' }}>
            <strong>✅ Stores chargés avec succès</strong>
          </p>
          <div style={{ marginBottom: '20px', color: '#666' }}>
            <p>User: {user ? user.email || 'présent' : 'null'}</p>
            <p>Authentifié: {isAuthenticated ? 'Oui' : 'Non'}</p>
            <p>Rôle: {role || 'null'}</p>
            <p>Vue actuelle: {currentView || 'null'}</p>
          </div>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Prochaine étape : tester les hooks (useAuth, useNotifications)
          </p>
          <button 
            onClick={() => {
              logger.log('🔄 Rechargement de la page...');
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  } catch (error) {
    logger.error('❌ Erreur lors du chargement des stores:', error);
    return (
      <div style={{ 
        padding: '40px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fee',
        minHeight: '100vh'
      }}>
        <h1 style={{ color: 'red', marginBottom: '20px' }}>
          ❌ Erreur avec les stores
        </h1>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: 'red', marginBottom: '10px' }}>
            <strong>Erreur:</strong> {error.message}
          </p>
          <pre style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {error.stack}
          </pre>
        </div>
      </div>
    );
  }
}

export default AppWithStores;

