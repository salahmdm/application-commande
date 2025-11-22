import React, { useEffect } from 'react';
import logger from './utils/logger';
import useAuth from './hooks/useAuth';
import useNotifications from './hooks/useNotifications';
import useUIStore from './store/uiStore';

/**
 * Version avec hooks pour tester
 */
function AppWithHooks() {
  useEffect(() => {
    logger.log('✅ AppWithHooks - Composant monté');
  }, []);

  // Tester les hooks
  try {
    const { user, isAuthenticated, role } = useAuth();
    const { notifications, dismiss } = useNotifications();
    const currentView = useUIStore((state) => state.currentView);
    const setCurrentView = useUIStore((state) => state.setCurrentView);

    logger.log('✅ Hooks chargés:', { 
      user: user ? 'présent' : 'null', 
      isAuthenticated, 
      role, 
      notificationsCount: notifications?.length || 0,
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
          ✅ AppWithHooks fonctionne
        </h1>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ marginBottom: '10px' }}>
            <strong>✅ Hooks chargés avec succès</strong>
          </p>
          <div style={{ marginBottom: '20px', color: '#666' }}>
            <p>User: {user ? user.email || 'présent' : 'null'}</p>
            <p>Authentifié: {isAuthenticated ? 'Oui' : 'Non'}</p>
            <p>Rôle: {role || 'null'}</p>
            <p>Notifications: {notifications?.length || 0}</p>
            <p>Vue actuelle: {currentView || 'null'}</p>
          </div>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Prochaine étape : tester les composants (AuthView, MainLayout)
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
    logger.error('❌ Erreur lors du chargement des hooks:', error);
    return (
      <div style={{ 
        padding: '40px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fee',
        minHeight: '100vh'
      }}>
        <h1 style={{ color: 'red', marginBottom: '20px' }}>
          ❌ Erreur avec les hooks
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

export default AppWithHooks;

