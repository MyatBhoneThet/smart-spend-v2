import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';


import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import '././styles/chat-widget-override.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('Google Client ID:', clientId);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
