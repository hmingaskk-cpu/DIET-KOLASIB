// public/registerServiceWorker.js
if ('serviceWorker' in navigator) {
  // Only register on production and only on non-auth pages
  if (window.location.pathname !== '/login' && 
      window.location.pathname !== '/forgot-password' &&
      window.location.hostname !== 'localhost') {
    
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered:', registration);
      }).catch(error => {
        console.log('SW registration failed:', error);
      });
    });
  } else {
    // Unregister service workers on auth pages
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
}