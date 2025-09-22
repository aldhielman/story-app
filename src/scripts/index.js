// CSS imports
import './../styles/styles.css';
import 'leaflet/dist/leaflet.css';
import Camera from './utils/camera';

import App from './pages/app';
import { registerServiceWorker } from './utils';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    skipToContentButton: document.querySelector('#skip-to-content'),
  });
  await app.renderPage();

  await registerServiceWorker();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    Camera.stopAllStreams()
  });
});


