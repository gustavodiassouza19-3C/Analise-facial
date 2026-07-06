import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // ← ADICIONE ESTA LINHA (ou o nome correto do seu arquivo CSS)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);