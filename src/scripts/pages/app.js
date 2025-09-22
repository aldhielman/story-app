import routes from '../routes/routes.js';
import { getActiveRoute} from '../routes/url-parser.js';
import AuthModel from '../models/auth-model.js';
import { isServiceWorkerAvailable, setupSkipToContent, transitionHelper } from '../utils/index.js';
import { isCurrentPushSubscriptionAvailable, isNotificationAvailable, isNotificationGranted, requestNotificationPermission, subscribe, unsubscribe } from '../utils/notification-helper.js';

class App {
  #content;
  #skipToContentButton;
  #authModel = null;

  constructor({ content, skipToContentButton }) {
    this.#content = content;
    this.#skipToContentButton = skipToContentButton;
    this.#authModel = new AuthModel();

    this.#init();
  }

  async #init(){
    this.#setupAuth();
    setupSkipToContent(this.#skipToContentButton, this.#content);
  }

  #setupAuth() {
    this.#updateAuthUI();
    
    // Listen for auth changes
    window.addEventListener('authStateChanged', () => {
      this.#updateAuthUI();
    });
  }

  #updateAuthUI() {
    const userStatus = document.querySelector('#user-status');
    const header = document.querySelector('#app-header');
    
    if (this.#authModel.isAuthenticated()) {
      const user = this.#authModel.getUser();
      
      // Show header when authenticated
      if (header) {
        header.classList.remove('hidden');
      }
      
      // Show user info in header
      if (userStatus) {
        userStatus.innerHTML = `
          <div class="user-info flex items-center space-x-2 sm:space-x-3">
            <!-- Notification Toggle -->
            <div class="notification-toggle">
              <button id="notification-toggle-btn" 
                      class="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Toggle push notifications">
                <span id="notification-icon" class="text-lg">🔔</span>
                <span id="notification-status" class="hidden sm:inline text-xs">OFF</span>
              </button>
            </div>
            
            <span class="user-greeting text-sm text-gray-700 hidden md:inline">
              Halo, <span class="font-medium">${user.name}</span>!
            </span>
            
            <!-- Logout button - visible on all screen sizes -->
            <button id="header-logout-btn" 
                    class="logout-btn flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Logout dari akun ${user.name}">
              <span class="btn-icon text-lg" aria-hidden="true">🚪</span>
              <span class="btn-text">Logout</span>
            </button>
          </div>
        `;

        // Setup notification toggle
        this.#setupNotificationToggle();
        
        // // Setup test notification buttons
        // this.#setupTestNotifications();
        
        // Setup logout button
        const logoutBtn = document.getElementById('header-logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            this.#authModel.logout();
            window.location.hash = '#/login';
          });
        }
      }
    } else {
      // Hide header when not authenticated
      if (header) {
        header.classList.add('hidden');
      }
    }
  }

  async #setupNotificationToggle() {
    const toggleBtn = document.getElementById('notification-toggle-btn');
    
    if (!toggleBtn || !isNotificationAvailable()) return;
    
    // Remove existing event listeners
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
    
    // Update UI based on current state
    this.#updateNotificationUI();
    
    let isProcessing = false;
    
    newToggleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent multiple simultaneous requests
      if (isProcessing) {
        console.log('Already processing notification toggle');
        return;
      }
      
      isProcessing = true;
      newToggleBtn.disabled = true;
      
      try {
        if (await isCurrentPushSubscriptionAvailable()) {
          const success = await unsubscribe();
          if (success) {
            this.#showNotificationMessage('Notifikasi dimatikan', 'info');
          } else {
            this.#showNotificationMessage('Gagal mematikan notifikasi', 'error');
          }
        } else {
          const hasPermission = await requestNotificationPermission();
          if (hasPermission) {
            const success = await subscribe();
            if (success) {
              this.#showNotificationMessage('Notifikasi diaktifkan', 'success');
            } else {
              this.#showNotificationMessage('Gagal mengaktifkan notifikasi', 'error');
            }
          } else {
            this.#showNotificationMessage('Izin notifikasi ditolak', 'error');
          }
        }
        
        await this.#updateNotificationUI();
      } catch (error) {
        console.error('Notification toggle error:', error);
        this.#showNotificationMessage('Terjadi kesalahan', 'error');
      } finally {
        isProcessing = false;
        newToggleBtn.disabled = false;
      }
    });
  }


  async #updateNotificationUI() {
    const icon = document.getElementById('notification-icon');
    const status = document.getElementById('notification-status');
    
    if (!icon || !status) return;
    
    if (await isCurrentPushSubscriptionAvailable()) {
      icon.textContent = '🔔';
      status.textContent = 'ON';
      status.classList.remove('text-gray-500');
      status.classList.add('text-green-600');
    } else {
      icon.textContent = '🔕';
      status.textContent = !isNotificationGranted ? 'DENIED' : 'OFF';
      status.classList.remove('text-green-600');
      status.classList.add('text-gray-500');
    }
  }

  #showNotificationMessage(message, type = 'info') {
    // Create notification toast
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 transform translate-x-full`;
    
    switch (type) {
      case 'success':
        toast.classList.add('bg-green-500');
        break;
      case 'error':
        toast.classList.add('bg-red-500');
        break;
      default:
        toast.classList.add('bg-blue-500');
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  async renderPage() {   
    
    try {
      // Get current route path
      const currentPath = getActiveRoute();
      
      // Get the page class from routes
      const page = routes[currentPath];
      
      // Update auth UI when page changes
      this.#updateAuthUI();
      
      // Hide/show footer based on current route
      this.#updateFooterVisibility(currentPath);

      // Create page instance
      const activePage = page();

      const transition = transitionHelper({
        updateDOM: async () => {
          this.#content.innerHTML = await activePage.render();
          activePage.afterRender()
        }
      })
      transition.ready.catch(console.error)
      transition.updateCallbackDone.then(()=>{
        scrollTo({top:10,behavior:'instant'})

        if (isServiceWorkerAvailable()) {
          this.#setupNotificationToggle();
          this.#setupServiceWorkerMessageListener();
        }
      })
      
    } catch (error) {
      console.error('Error rendering page:', error);
      this.#content.innerHTML = `
        <div class="error-container">
          <h2>Oops! Terjadi Kesalahan</h2>
          <p>Halaman tidak dapat dimuat. Silakan coba lagi.</p>
          <button onclick="window.location.reload()" class="btn btn-primary">Muat Ulang</button>
        </div>
      `;
    }
  }

  #updateFooterVisibility(currentPath) {
    const footer = document.querySelector('#app-footer');
    
    if (footer) {
      // Hide footer on login and register pages
      if (currentPath === '/login' || currentPath === '/register') {
        footer.classList.add('hidden');
      } else {
        footer.classList.remove('hidden');
      }
    }
  }

  #setupServiceWorkerMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Main thread received message from SW:', event.data);
      
      if (event.data && event.data.type === 'NAVIGATE_TO') {
        const { url, storyId } = event.data;
        console.log('Navigating to:', { url, storyId });
        
        // Navigate using hash change
        window.location.hash = url;
      }
    });
  }
}

export default App;
