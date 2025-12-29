'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Evitar registrar el SW en desarrollo para no cachear bundles viejos
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw-custom.js', { scope: '/' })
          .then(registration => {
            console.log('Service Worker registered successfully:', registration);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      } else {
        // En desarrollo: desregistrar cualquier SW previo que esté controlando la app
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => {
            r.unregister().then(() => console.log('Service Worker unregistered (dev):', r.scope))
          })
          // Limpiar caches para evitar bundles antiguos
          if (window.caches) {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
          }
        })
      }
    }
  }, []);

  return null;
}
