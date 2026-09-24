import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Capacitor } from '@capacitor/core';
import './index.css';

if (Capacitor.isNativePlatform()) {
  const API_BASE = 'https://dastyarai.com';
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    let [resource, config] = args;
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      resource = API_BASE + resource;
    }
    return originalFetch(resource, config);
  };

  // Intercept EventSource
  const OriginalEventSource = window.EventSource;
  window.EventSource = function (url: string, eventSourceInitDict?: EventSourceInit) {
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = API_BASE + url;
    }
    return new OriginalEventSource(url, eventSourceInitDict);
  } as any;
}

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <ErrorBoundary>
 <App />
 </ErrorBoundary>
 </StrictMode>,
);