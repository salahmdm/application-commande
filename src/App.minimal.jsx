import React, { useEffect } from 'react';
import logger from './utils/logger';

/**
 * Version minimale de App pour identifier le problème
 * On ajoute progressivement les fonctionnalités
 */
function AppMinimal() {
  useEffect(() => {
    logger.log('✅ AppMinimal - Composant monté');
  }, []);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        ✅ AppMinimal fonctionne
      </h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ marginBottom: '10px' }}>
          <strong>✅ Logger importé et fonctionne</strong>
        </p>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Prochaine étape : tester les hooks et stores
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
}

export default AppMinimal;

