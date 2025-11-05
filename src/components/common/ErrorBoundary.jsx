import React from 'react';

/**
 * Composant ErrorBoundary pour capturer les erreurs React
 * Affiche un message d'erreur au lieu d'une page blanche
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error) {
    // Met à jour l'état pour afficher l'interface de secours au prochain rendu
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Enregistre l'erreur dans la console pour le débogage
    console.error('❌❌❌ ERREUR CAPTURÉE PAR ERRORBOUNDARY ❌❌❌');
    console.error('📋 Message:', error.message);
    console.error('📋 Stack:', error.stack);
    console.error('📋 Component Stack:', errorInfo.componentStack);
    console.error('❌❌❌ FIN DE L\'ERREUR ❌❌❌');
    
    // Sauvegarde les détails de l'erreur dans l'état
    this.setState({ 
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Interface de secours personnalisée
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '600px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ 
              fontSize: '32px', 
              color: '#1f2937',
              marginBottom: '15px',
              fontFamily: '"Playfair Display", serif'
            }}>
              Oups ! Une erreur est survenue
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              L&apos;application a rencontré un problème. Veuillez rafraîchir la page ou contacter le support.
            </p>
            
            {this.state.error && (
              <details style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <summary style={{ 
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '10px'
                }}>
                  Détails de l&apos;erreur (pour les développeurs)
                </summary>
                <pre style={{
                  fontSize: '12px',
                  overflow: 'auto',
                  background: '#1f2937',
                  color: '#f3f4f6',
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '10px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#0369a1',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#0284c7'}
                onMouseOut={(e) => e.target.style.background = '#0369a1'}
              >
                🔄 Rafraîchir la page
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#ef4444'}
                onMouseOut={(e) => e.target.style.background = '#dc2626'}
              >
                🗑️ Réinitialiser l&apos;app
              </button>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginTop: '30px'
            }}>
              💡 Si le problème persiste, vérifiez que le backend API est démarré
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

