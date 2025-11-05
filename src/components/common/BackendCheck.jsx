import React, { useState, useEffect } from 'react';
import ENV from '../../config/env';

/**
 * Composant qui vérifie que le backend est accessible
 * VERSION SIMPLIFIÉE ET ROBUSTE
 */
const BackendCheck = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    let mounted = true;
    let attemptCount = 0;
    let isChecking = false; // Flag pour éviter les vérifications multiples

    const checkBackend = async () => {
      try {
        console.log(`🔍 BackendCheck - Tentative ${attemptCount + 1}/${MAX_ATTEMPTS}`);
        
        // Créer un timeout manuel pour éviter les blocages
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(ENV.BACKEND_URL, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK') {
            console.log('✅ BackendCheck - Backend accessible !');
            if (mounted) {
              setChecking(false);
            }
            return true;
          }
        }
        return false;
      } catch (error) {
        // Ignorer les erreurs AbortError (timeout)
        if (error.name === 'AbortError') {
          console.warn(`⚠️ BackendCheck - Timeout après 5s`);
        } else {
          console.warn(`⚠️ BackendCheck - Tentative ${attemptCount + 1} échouée:`, error.message);
        }
        return false;
      }
    };

    const tryConnect = async () => {
      // Éviter les vérifications multiples simultanées
      if (isChecking) {
        return;
      }
      
      isChecking = true;
      
      while (attemptCount < MAX_ATTEMPTS && mounted) {
        const success = await checkBackend();
        
        if (success) {
          isChecking = false;
          break;
        }
        
        attemptCount++;
        if (mounted) {
          setAttempts(attemptCount);
        }
        
        if (attemptCount >= MAX_ATTEMPTS) {
          console.warn('❌ BackendCheck - Backend non accessible après 3 tentatives');
          console.warn('💡 Chargement de l\'app en mode dégradé...');
          if (mounted) {
            // Charger quand même après 3 tentatives
            setChecking(false);
          }
          isChecking = false;
          break;
        }
        
        // Attendre 1.5 secondes avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    };

    tryConnect();

    return () => {
      mounted = false;
      isChecking = false;
    };
  }, []);

  // Pendant la vérification - Loader
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '50px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>
            🌸
          </div>
          <h2 style={{ 
            fontSize: '28px', 
            color: '#1f2937', 
            marginBottom: '15px',
            fontFamily: 'Georgia, serif'
          }}>
            Blossom Café
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
            Connexion au serveur...
          </p>
          
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0369a1, #0ea5e9)',
              width: `${(attempts / MAX_ATTEMPTS) * 100}%`,
              transition: 'width 0.3s ease',
              borderRadius: '10px'
            }} />
          </div>
          
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            {attempts > 0 ? `Tentative ${attempts}/${MAX_ATTEMPTS}` : 'Vérification...'}
          </p>
        </div>
      </div>
    );
  }

  // Backend prêt (ou chargement forcé après 3 tentatives)
  console.log('✅ BackendCheck - Chargement de l\'application...');
  return children;
};

export default BackendCheck;
