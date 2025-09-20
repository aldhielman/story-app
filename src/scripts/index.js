// CSS imports
import './../styles/styles.css';
import 'leaflet/dist/leaflet.css';
import Camera from './utils/camera';
import { Workbox } from 'workbox-window';

import App from './pages/app';

// PWA Install functionality
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const dismissBtn = document.getElementById('pwa-dismiss-btn');

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install banner
  if (installBanner) {
    installBanner.classList.remove('hidden');
  }
});

// Handle install button click
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      
      deferredPrompt = null;
      installBanner.classList.add('hidden');
    }
  });
}

// Handle dismiss button click
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    installBanner.classList.add('hidden');
    deferredPrompt = null;
  });
}

// Register service worker with Workbox
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js');
  
  // Show update available notification
  wb.addEventListener('waiting', (event) => {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white p-3 shadow-lg';
    updateBanner.innerHTML = `
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center space-x-3">
          <span class="text-xl">🔄</span>
          <div>
            <p class="font-medium">Update Tersedia</p>
            <p class="text-sm opacity-90">Versi baru aplikasi sudah siap</p>
          </div>
        </div>
        <button id="update-btn" class="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Update
        </button>
      </div>
    `;
    
    document.body.prepend(updateBanner);
    
    document.getElementById('update-btn').addEventListener('click', () => {
      wb.messageSkipWaiting();
      updateBanner.remove();
    });
  });
  
  wb.addEventListener('controlling', () => {
    window.location.reload();
  });
  
  wb.register();
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    skipToContentButton: document.querySelector('#skip-to-content'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    Camera.stopAllStreams()
  });

  // Listen for navigation messages from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NAVIGATE_TO') {
        const targetHash = event.data.url.replace('/#', '');
        window.location.hash = targetHash;
      }
    });
  }
});


