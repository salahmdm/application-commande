import React from 'react';
import ReactDOM from 'react-dom/client';
import KitchenApp from './kitchen/KitchenApp';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';
import './kitchen/styles/kitchen.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <KitchenApp />
    </ErrorBoundary>
  </React.StrictMode>
);

