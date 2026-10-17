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
    if (typeof resource === 'string') {
      if (resource.startsWith('/api/')) {
        resource = API_BASE + resource;
      }
    } else if (resource instanceof Request) {
      if (resource.url.startsWith('/api/') || resource.url.startsWith(window.location.origin + '/api/')) {
        const path = resource.url.replace(window.location.origin, '');
        resource = new Request(API_BASE + path, resource);
      }
    } else if (resource instanceof URL) {
      if (resource.pathname.startsWith('/api/')) {
        resource = new URL(resource.pathname + resource.search, API_BASE);
      }
    }
    return originalFetch(resource, config);
  };

  // Intercept EventSource
  const OriginalEventSource = window.EventSource;
  window.EventSource = function (url: string | URL, eventSourceInitDict?: EventSourceInit) {
    let finalUrl = typeof url === 'string' ? url : url.toString();
    if (finalUrl.startsWith('/api/')) {
      finalUrl = API_BASE + finalUrl;
    }
    return new OriginalEventSource(finalUrl, eventSourceInitDict);
  } as any;
}

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <ErrorBoundary>
 <App />
 </ErrorBoundary>
 </StrictMode>,
);