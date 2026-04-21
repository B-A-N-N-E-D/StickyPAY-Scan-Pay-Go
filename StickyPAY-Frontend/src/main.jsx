if (!import.meta.env.VITE_API_URL) {
  console.error('VITE_API_URL is not set! Backend calls will fail.');
}

// Warm up the backend on app start
fetch(`${import.meta.env.VITE_API_URL}/api/health`).catch(() => {});

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { StoreProvider } from "./lib/StoreContext";
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <StoreProvider>
      <App />
      <Toaster position="top-center" richColors />
    </StoreProvider>
  </ThemeProvider>
)
