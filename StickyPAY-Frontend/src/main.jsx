import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { StoreProvider } from "./lib/StoreContext";
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StoreProvider>
    <App />
    <Toaster theme="dark" position="top-center" richColors />
  </StoreProvider>
)
