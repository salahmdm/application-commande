import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import logger from '../../utils/logger';

/**
 * Panneau de diagnostic complet pour identifier les problèmes
 */
const DiagnosticPanel = ({ onFix, onRefresh: _onRefresh }) => {
  const [diagnostics, setDiagnostics] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false); // Replié par défaut
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = [];

    // 1. Vérifier localStorage
    results.push({
      id: 'localStorage',
      name: 'LocalStorage',
      status: 'checking',
      message: 'Vérification du localStorage...',
      details: []
    });

    const userStr = localStorage.getItem('user');
    let token = localStorage.getItem('token');
    const authStorage = localStorage.getItem('blossom-auth-storage');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        results[0].details.push({
          label: 'Utilisateur dans localStorage',
          value: `Oui (ID: ${user.id}, Email: ${user.email})`,
          status: 'success'
        });
      } catch (e) {
        results[0].details.push({
          label: 'Utilisateur dans localStorage',
          value: 'Erreur de parsing',
          status: 'error'
        });
      }
    } else {
      results[0].details.push({
        label: 'Utilisateur dans localStorage',
        value: 'Non trouvé',
        status: 'error'
      });
    }

    if (token) {
      results[0].details.push({
        label: 'Token dans localStorage',
        value: `Oui (${token.substring(0, 30)}...)`,
        status: 'success'
      });
    } else {
      results[0].details.push({
        label: 'Token dans localStorage',
        value: 'Non trouvé',
        status: 'error'
      });
    }

    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const zustandToken = parsed.state?.token || parsed.token || null;
        const zustandUser = parsed.state?.user || parsed.user || null;
        
        results[0].details.push({
          label: 'Store Zustand (blossom-auth-storage)',
          value: `Oui (user: ${zustandUser ? 'Oui' : 'Non'}, token: ${zustandToken ? 'Oui' : 'Non'})`,
          status: zustandUser && zustandToken ? 'success' : 'warning'
        });
        
        // Si le token existe dans Zustand mais pas dans localStorage, le synchroniser
        if (zustandToken && !token) {
          logger.log('🔄 Synchronisation du token depuis Zustand vers localStorage...');
          localStorage.setItem('token', zustandToken);
          results[0].details.push({
            label: 'Synchronisation automatique',
            value: 'Token synchronisé depuis Zustand vers localStorage',
            status: 'success'
          });
          // Mettre à jour la variable token pour les vérifications suivantes
          token = zustandToken;
        }
      } catch (e) {
        results[0].details.push({
          label: 'Store Zustand',
          value: 'Erreur de parsing',
          status: 'error'
        });
      }
    } else {
      results[0].details.push({
        label: 'Store Zustand',
        value: 'Non trouvé',
        status: 'warning'
      });
    }

    results[0].status = results[0].details.some(d => d.status === 'error') ? 'error' : 
                        results[0].details.some(d => d.status === 'warning') ? 'warning' : 'success';
    results[0].message = results[0].status === 'success' ? 'LocalStorage OK' : 
                          results[0].status === 'error' ? 'Problèmes détectés dans localStorage' : 
                          'Avertissements dans localStorage';

    // 2. Vérifier la connexion backend
    results.push({
      id: 'backend',
      name: 'Connexion Backend',
      status: 'checking',
      message: 'Vérification de la connexion au backend...',
      details: []
    });

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null);

      if (response && response.ok) {
        results[1].details.push({
          label: 'Backend accessible',
          value: 'Oui',
          status: 'success'
        });
        results[1].status = 'success';
        results[1].message = 'Backend accessible';
      } else {
        results[1].details.push({
          label: 'Backend accessible',
          value: 'Non',
          status: 'error'
        });
        results[1].status = 'error';
        results[1].message = 'Backend inaccessible';
      }
    } catch (error) {
      results[1].details.push({
        label: 'Erreur de connexion',
        value: error.message,
        status: 'error'
      });
      results[1].status = 'error';
      results[1].message = 'Erreur lors de la vérification du backend';
    }

    // 3. Vérifier l'authentification API
    results.push({
      id: 'auth',
      name: 'Authentification API',
      status: 'checking',
      message: 'Vérification de l\'authentification...',
      details: []
    });

    if (!token) {
      results[2].details.push({
        label: 'Token manquant',
        value: 'Aucun token trouvé',
        status: 'error'
      });
      results[2].status = 'error';
      results[2].message = 'Token manquant - Reconnexion requise';
    } else {
      // Décoder le token pour vérifier son contenu
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expirationDate = payload.exp ? new Date(payload.exp * 1000) : null;
          const isExpired = expirationDate && expirationDate < new Date();

          results[2].details.push({
            label: 'Token valide',
            value: isExpired ? 'Token expiré' : 'Oui',
            status: isExpired ? 'error' : 'success'
          });

          results[2].details.push({
            label: 'User ID dans token',
            value: payload.id || 'Non trouvé',
            status: payload.id ? 'success' : 'error'
          });

          results[2].details.push({
            label: 'Email dans token',
            value: payload.email || 'Non trouvé',
            status: payload.email ? 'success' : 'error'
          });

          results[2].details.push({
            label: 'Expiration',
            value: expirationDate ? expirationDate.toLocaleString('fr-FR') : 'Non définie',
            status: isExpired ? 'error' : 'success'
          });

          results[2].status = isExpired ? 'error' : 'success';
          results[2].message = isExpired ? 'Token expiré' : 'Token valide';
        } else {
          results[2].details.push({
            label: 'Format token',
            value: 'Format invalide',
            status: 'error'
          });
          results[2].status = 'error';
          results[2].message = 'Format de token invalide';
        }
      } catch (e) {
        results[2].details.push({
          label: 'Erreur décodage',
          value: e.message,
          status: 'error'
        });
        results[2].status = 'error';
        results[2].message = 'Erreur lors du décodage du token';
      }
    }

    // 4. Vérifier les commandes
    results.push({
      id: 'orders',
      name: 'Récupération des commandes',
      status: 'checking',
      message: 'Vérification de la récupération des commandes...',
      details: []
    });

    if (!token) {
      results[3].details.push({
        label: 'Token requis',
        value: 'Token manquant pour récupérer les commandes',
        status: 'error'
      });
      results[3].status = 'error';
      results[3].message = 'Impossible de récupérer les commandes sans token';
    } else {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/orders`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const ordersCount = data.data?.length || 0;

          results[3].details.push({
            label: 'Appel API réussi',
            value: 'Oui',
            status: 'success'
          });

          results[3].details.push({
            label: 'Commandes trouvées',
            value: `${ordersCount} commande(s)`,
            status: ordersCount > 0 ? 'success' : 'warning'
          });

          results[3].status = 'success';
          results[3].message = `${ordersCount} commande(s) trouvée(s)`;
        } else {
          const errorData = await response.json().catch(() => ({}));
          results[3].details.push({
            label: 'Erreur API',
            value: `HTTP ${response.status}: ${errorData.error || response.statusText}`,
            status: 'error'
          });
          results[3].status = 'error';
          results[3].message = `Erreur ${response.status} lors de la récupération`;
        }
      } catch (error) {
        results[3].details.push({
          label: 'Erreur de connexion',
          value: error.message,
          status: 'error'
        });
        results[3].status = 'error';
        results[3].message = 'Erreur lors de l\'appel API';
      }
    }

    // 5. Vérifier la synchronisation
    results.push({
      id: 'sync',
      name: 'Synchronisation des données',
      status: 'checking',
      message: 'Vérification de la synchronisation...',
      details: []
    });

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          const userIdMatch = user.id === payload.id;
          const emailMatch = user.email === payload.email;

          results[4].details.push({
            label: 'User ID synchronisé',
            value: userIdMatch ? 'Oui' : `Non (localStorage: ${user.id}, token: ${payload.id})`,
            status: userIdMatch ? 'success' : 'error'
          });

          results[4].details.push({
            label: 'Email synchronisé',
            value: emailMatch ? 'Oui' : `Non (localStorage: ${user.email}, token: ${payload.email})`,
            status: emailMatch ? 'success' : 'error'
          });

          results[4].status = userIdMatch && emailMatch ? 'success' : 'error';
          results[4].message = userIdMatch && emailMatch ? 'Données synchronisées' : 'Incohérence détectée';
        }
      } catch (e) {
        results[4].details.push({
          label: 'Erreur vérification',
          value: e.message,
          status: 'error'
        });
        results[4].status = 'error';
        results[4].message = 'Erreur lors de la vérification';
      }
    } else {
      results[4].details.push({
        label: 'Données insuffisantes',
        value: 'Utilisateur ou token manquant',
        status: 'warning'
      });
      results[4].status = 'warning';
      results[4].message = 'Données insuffisantes pour vérifier';
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const hasWarnings = diagnostics.some(d => d.status === 'warning');

  return (
    <Card padding="md" className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">🔍 Diagnostic Système</h3>
          {hasErrors && (
            <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
              Erreurs détectées
            </span>
          )}
          {!hasErrors && hasWarnings && (
            <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded">
              Avertissements
            </span>
          )}
          {!hasErrors && !hasWarnings && diagnostics.length > 0 && (
            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
              Tout fonctionne
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
            className="text-xs py-1"
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Vérification...' : 'Rafraîchir'}
          </Button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {diagnostics.map((diagnostic) => (
            <div
              key={diagnostic.id}
              className={`p-2 rounded border ${getStatusColor(diagnostic.status)}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-shrink-0">{getStatusIcon(diagnostic.status)}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs">{diagnostic.name}</h4>
                    <p className="text-xs text-gray-600 truncate">{diagnostic.message}</p>
                  </div>
                </div>
              </div>
              
              {diagnostic.details && diagnostic.details.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {diagnostic.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start justify-between text-[10px] leading-tight">
                      <span className="text-gray-600 truncate mr-2">{detail.label}:</span>
                      <span className={`font-medium text-right flex-shrink-0 ${
                        detail.status === 'error' ? 'text-red-700' :
                        detail.status === 'warning' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {diagnostic.status === 'error' && onFix && (
                <div className="mt-1.5 pt-1.5 border-t border-red-200">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onFix(diagnostic.id)}
                    className="w-full text-xs py-1"
                  >
                    🔧 Corriger
                  </Button>
                </div>
              )}
            </div>
          ))}

          {diagnostics.length === 0 && !isRunning && (
            <p className="text-xs text-gray-500 text-center py-2">
              Aucun diagnostic disponible. Cliquez sur &quot;Rafraîchir&quot; pour lancer une vérification.
            </p>
          )}
        </div>
      )}

      {hasErrors && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs font-semibold text-red-800 mb-1.5">💡 Solutions recommandées :</p>
          <ul className="text-[10px] text-red-700 space-y-0.5 list-disc list-inside mb-2">
            {diagnostics.find(d => d.id === 'localStorage' && d.status === 'error') && (
              <li className="font-semibold">Vous n&apos;êtes pas connecté. Cliquez sur le bouton ci-dessous pour vous connecter.</li>
            )}
            {!localStorage.getItem('token') && !diagnostics.find(d => d.id === 'localStorage' && d.status === 'error') && (
              <li>Reconnectez-vous pour régénérer le token</li>
            )}
            {diagnostics.find(d => d.id === 'backend' && d.status === 'error') && (
              <li>Vérifiez que le backend est démarré sur le port 5000</li>
            )}
            {diagnostics.find(d => d.id === 'auth' && d.status === 'error') && (
              <li>Votre token est invalide ou expiré, reconnectez-vous</li>
            )}
            {diagnostics.find(d => d.id === 'sync' && d.status === 'error') && (
              <li>Les données ne sont pas synchronisées, reconnectez-vous</li>
            )}
          </ul>
          
          {(diagnostics.find(d => d.id === 'localStorage' && d.status === 'error') || 
            diagnostics.find(d => d.id === 'auth' && d.status === 'error') ||
            diagnostics.find(d => d.id === 'sync' && d.status === 'error')) && (
            <div className="pt-1.5 border-t border-red-200">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  logger.log('🔐 Redirection vers la page de connexion...');
                  // Nettoyer complètement le localStorage
                  localStorage.clear();
                  localStorage.removeItem('blossom-auth-storage');
                  // Rediriger vers la page d'accueil (qui affichera la page de connexion)
                  window.location.href = window.location.origin + window.location.pathname;
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs py-1"
              >
                <LogIn className="w-3 h-3" />
                Aller à la page de connexion
              </Button>
              <p className="text-[10px] text-red-600 mt-1 text-center">
                Vous serez redirigé vers la page de connexion pour vous authentifier
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DiagnosticPanel;

