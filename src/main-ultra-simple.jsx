// Version ultra-simple SANS logger ni autres dépendances
console.log('🚀 main-ultra-simple.jsx - Démarrage...');

// Test 1: Vérifier que l'élément root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Élément #root introuvable');
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">ERREUR: Élément #root introuvable</h1>';
} else {
  console.log('✅ Élément #root trouvé');
  
  // Test 2: Afficher quelque chose directement
  rootElement.innerHTML = '<div style="padding: 40px; font-family: Arial;"><h1 style="color: green;">✅ JavaScript fonctionne !</h1><p>Chargement de React...</p></div>';
  
  // Test 3: Essayer React après un délai
  setTimeout(() => {
    try {
      console.log('🔄 Tentative d\'import React...');
      
      // Import React et ReactDOM
      Promise.all([
        import('react'),
        import('react-dom/client')
      ]).then(([React, { createRoot }]) => {
        console.log('✅ React et createRoot importés');
        
        // Créer un composant simple
        const App = () => {
          return React.createElement('div', {
            style: {
              padding: '40px',
              fontFamily: 'Arial, sans-serif',
              backgroundColor: '#f0f0f0',
              minHeight: '100vh'
            }
          },
            React.createElement('h1', {
              style: { color: '#2563eb', marginBottom: '20px' }
            }, '✅ React fonctionne !'),
            React.createElement('div', {
              style: {
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            },
              React.createElement('p', { style: { marginBottom: '10px' } },
                React.createElement('strong', null, '✅ L\'application React fonctionne !')
              ),
              React.createElement('p', { style: { marginBottom: '10px' } },
                'Si vous voyez ce message, React se rend correctement.'
              ),
              React.createElement('p', { style: { marginBottom: '20px', color: '#666' } },
                'Vérifiez la console (F12) pour voir les logs.'
              ),
              React.createElement('button', {
                onClick: () => {
                  console.log('🔄 Rechargement de la page...');
                  window.location.reload();
                },
                style: {
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }
              }, 'Recharger la page')
            )
          );
        };
        
        // Rendre l'application
        const root = createRoot(rootElement);
        root.render(React.createElement(App));
        console.log('✅ React rendu avec succès');
      }).catch((error) => {
        console.error('❌ Erreur lors de l\'import React:', error);
        rootElement.innerHTML = `
          <div style="padding: 40px; font-family: Arial;">
            <h1 style="color: red;">❌ Erreur</h1>
            <p>Erreur lors de l'import React:</p>
            <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error.message}\n${error.stack}</pre>
            <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Recharger
            </button>
          </div>
        `;
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'import dynamique:', error);
      rootElement.innerHTML = `
        <div style="padding: 40px; font-family: Arial;">
          <h1 style="color: red;">❌ Erreur</h1>
          <p>Erreur: ${error.message}</p>
          <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error.stack}</pre>
        </div>
      `;
    }
  }, 500);
}

