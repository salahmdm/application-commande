import { useState, useEffect } from 'react';
import ENV from '../../config/env';
import logger from '../../utils/logger';

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
    let timeoutId = null;

    const checkBackend = async () => {
      try {
        logger.log(`🔍 BackendCheck - Tentative ${attemptCount + 1}/${MAX_ATTEMPTS}`);
        
        // Créer un timeout manuel pour éviter les blocages (réduit à 3 secondes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${ENV.BACKEND_URL}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // ✅ Inclure les cookies pour les requêtes cross-origin
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // ✅ Accepter toute réponse HTTP 200 comme valide (simplifié)
        if (response.ok || response.status === 200) {
          try {
            const data = await response.json();
            // ✅ Accepter n'importe quelle réponse OK du backend
            // Le backend renvoie soit { status: 'OK' } soit { status: 'ok' }
            logger.log('✅ BackendCheck - Backend accessible ! Status:', response.status, 'Data:', data);
            if (mounted) {
              setChecking(false);
            }
            return true;
          } catch (jsonError) {
            // Si la réponse n'est pas du JSON valide mais le status est OK, considérer comme valide
            logger.log('✅ BackendCheck - Backend accessible (réponse non-JSON mais status 200)');
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
          logger.warn(`⚠️ BackendCheck - Timeout après 3s`);
        } else {
          logger.warn(`⚠️ BackendCheck - Tentative ${attemptCount + 1} échouée:`, error.message);
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
          logger.warn('❌ BackendCheck - Backend non accessible après 3 tentatives');
          logger.warn('💡 Chargement de l\'app en mode dégradé (l\'app fonctionnera mais certaines fonctionnalités peuvent être limitées)...');
          if (mounted) {
            // ✅ Charger quand même après 3 tentatives pour permettre l'utilisation
            setChecking(false);
          }
          isChecking = false;
          break;
        }
        
        // Attendre 0.5 seconde avant la prochaine tentative (réduit pour accélérer)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };

    // ✅ Timeout de sécurité : charger l'app après 5 secondes maximum même si le backend ne répond pas
    timeoutId = setTimeout(() => {
      if (mounted) {
        logger.warn('⏱️ BackendCheck - Timeout de sécurité (5s) - Chargement forcé de l\'app');
        setChecking(false);
      }
    }, 5000);

    tryConnect();

    return () => {
      mounted = false;
      isChecking = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
  logger.log('✅ BackendCheck - Chargement de l\'application...');
  return children;
};

export default BackendCheck;
