import React, { useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthView from './views/auth/AuthView';
import MainLayout from './components/layout/MainLayout';
import HomeView from './views/client/HomeView';
import useAuth from './hooks/useAuth';
import useUIStore from './store/uiStore';
import logger from './utils/logger';

/**
 * Version avec composants pour tester
 */
function AppWithComponents() {
  useEffect(() => {
    logger.log('✅ AppWithComponents - Composant monté');
  }, []);

  // Tester les hooks
  try {
    const { user, isAuthenticated } = useAuth();
    const currentView = useUIStore((state) => state.currentView);

    logger.log('✅ AppWithComponents - État:', { 
      user: user ? 'présent' : 'null', 
      isAuthenticated, 
      currentView 
    });

    // Tester le rendu des composants
    return (
      <ErrorBoundary>
        <div style={{ 
          padding: '40px', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f0f0f0',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
            ✅ AppWithComponents fonctionne
          </h1>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>✅ Composants chargés avec succès</strong>
            </p>
            <div style={{ marginBottom: '20px', color: '#666' }}>
              <p>User: {user ? user.email || 'présent' : 'null'}</p>
              <p>Authentifié: {isAuthenticated ? 'Oui' : 'Non'}</p>
              <p>Vue actuelle: {currentView || 'null'}</p>
            </div>
          </div>

          {/* Tester AuthView */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#2563eb', marginBottom: '10px' }}>
              Test AuthView
            </h2>
            <ErrorBoundary>
              <AuthView />
            </ErrorBoundary>
          </div>

          {/* Tester HomeView si authentifié */}
          {isAuthenticated && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#2563eb', marginBottom: '10px' }}>
                Test HomeView
              </h2>
              <ErrorBoundary>
                <HomeView />
              </ErrorBoundary>
            </div>
          )}

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
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error('❌ Erreur lors du chargement des composants:', error);
    return (
      <ErrorBoundary>
        <div style={{ 
          padding: '40px', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#fee',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: 'red', marginBottom: '20px' }}>
            ❌ Erreur avec les composants
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
      </ErrorBoundary>
    );
  }
}

export default AppWithComponents;

