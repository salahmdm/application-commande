// Version ultra-simple pour tester si React fonctionne
console.log('🚀 main-simple.jsx - Démarrage...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Élément #root introuvable');
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">ERREUR: Élément #root introuvable</h1>';
} else {
  console.log('✅ Élément #root trouvé');
  
  // Test 1: Afficher quelque chose directement
  rootElement.innerHTML = '<h1 style="color: green; padding: 20px;">✅ JavaScript fonctionne !</h1>';
  
  // Test 2: Essayer React après un délai
  setTimeout(() => {
    try {
      console.log('🔄 Tentative d\'import React...');
      import('react').then((React) => {
        console.log('✅ React importé:', React);
        import('react-dom/client').then(({ createRoot }) => {
          console.log('✅ createRoot importé');
          const root = createRoot(rootElement);
          root.render(
            React.createElement('div', { style: { padding: '40px', fontFamily: 'Arial' } },
              React.createElement('h1', { style: { color: '#2563eb' } }, '✅ React fonctionne !'),
              React.createElement('p', null, 'Si vous voyez ce message, React se rend correctement.'),
              React.createElement('button', {
                onClick: () => window.location.reload(),
                style: {
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }
              }, 'Recharger')
            )
          );
          console.log('✅ React rendu avec succès');
        }).catch((error) => {
          console.error('❌ Erreur import createRoot:', error);
          rootElement.innerHTML += '<p style="color: red;">Erreur import createRoot: ' + error.message + '</p>';
        });
      }).catch((error) => {
        console.error('❌ Erreur import React:', error);
        rootElement.innerHTML += '<p style="color: red;">Erreur import React: ' + error.message + '</p>';
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'import dynamique:', error);
      rootElement.innerHTML += '<p style="color: red;">Erreur: ' + error.message + '</p>';
    }
  }, 1000);
}

