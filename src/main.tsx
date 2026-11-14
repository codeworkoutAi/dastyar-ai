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

// Automatically recover from dynamic chunk load errors (happens when a new deploy removes old hashes on older Android WebViews)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Preload error detected, reloading page for fresh assets...', event);
  // Prevent infinite reload loops with session guard
  const lastReload = sessionStorage.getItem('last_preload_reload');
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > 10000) {
    sessionStorage.setItem('last_preload_reload', String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <ErrorBoundary>
 <App />
 </ErrorBoundary>
 </StrictMode>,
);