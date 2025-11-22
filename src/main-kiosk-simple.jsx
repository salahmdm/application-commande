import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Version simple pour tester
function SimpleKiosk() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#333'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🖥️ KIOSK MODE</h1>
        <p style={{ fontSize: '24px', marginTop: '20px' }}>
          Si vous voyez ce message, le kiosk fonctionne !
        </p>
        <p style={{ fontSize: '16px', marginTop: '10px', color: '#666' }}>
          Port: {window.location.port || '3010'}
        </p>
      </div>
    </div>
  );
}

// Rendu simple
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <SimpleKiosk />
    </StrictMode>
  );
  console.log('✅ Kiosk simple monté');
} else {
  console.error('❌ Élément #root introuvable');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">ERREUR: Élément #root introuvable</div>';
}

