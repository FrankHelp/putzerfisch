import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './state.jsx';
import App from './App.jsx';
import { registerServiceWorker } from './push.js';
import './styles.css';

// Service Worker für Push-Benachrichtigungen – früh registrieren, dann ist
// er aktiv, bevor die erste Riffpost-Push kommt.
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
