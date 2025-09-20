import routes from '../routes/routes.js';
import { getActiveRoute} from '../routes/url-parser.js';
import AuthModel from '../models/auth-model.js';
import PushNotificationManager from '../utils/push-notification.js';
import { setupSkipToContent, transitionHelper } from '../utils/index.js';

class App {
  #content;
  #skipToContentButton;
  #authModel = null;
  #pushNotificationManager = null;

  constructor({ content, skipToContentButton }) {
    this.#content = content;
    this.#skipToContentButton = skipToContentButton;
    this.#authModel = new AuthModel();
    this.#pushNotificationManager = new PushNotificationManager();

    this.#init();
  }

  async #init(){
    this.#setupAuth();
    await this.#setupPushNotifications();
    setupSkipToContent(this.#skipToContentButton, this.#content);
  }

  async #setupPushNotifications() {
    await this.#pushNotificationManager.init();
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
          <div class="user-info flex items-center space-x-3">
            <!-- Notification Toggle -->
            <div class="notification-toggle">
              <button id="notification-toggle-btn" 
                      class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Toggle push notifications">
                <span id="notification-icon" class="text-lg">🔔</span>
                <span id="notification-status" class="hidden sm:inline text-xs">OFF</span>
              </button>
            </div>
            
            <span class="user-greeting text-sm text-gray-700 hidden sm:inline">
              Halo, <span class="font-medium">${user.name}</span>!
            </span>
            <button id="header-logout-btn" 
                    class="logout-btn flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Logout dari akun ${user.name}">
              <span class="btn-icon text-lg" aria-hidden="true">🚪</span>
              <span class="btn-text hidden sm:inline">Logout</span>
            </button>
          </div>
        `;
        
        // Setup notification toggle
        this.#setupNotificationToggle();
        
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
    const icon = document.getElementById('notification-icon');
    const status = document.getElementById('notification-status');
    
    if (!toggleBtn || !this.#pushNotificationManager.isSupported) return;
    
    // Update UI based on current state
    this.#updateNotificationUI();
    
    toggleBtn.addEventListener('click', async () => {
      try {
        if (this.#pushNotificationManager.isNotificationEnabled()) {
          // Disable notifications
          await this.#pushNotificationManager.unsubscribe();
          this.#showNotificationMessage('Notifikasi dimatikan', 'info');
        } else {
          // Enable notifications
          const hasPermission = await this.#pushNotificationManager.requestPermission();
          if (hasPermission) {
            const success = await this.#pushNotificationManager.subscribe();
            if (success) {
              this.#showNotificationMessage('Notifikasi diaktifkan', 'success');
            } else {
              this.#showNotificationMessage('Gagal mengaktifkan notifikasi', 'error');
            }
          } else {
            this.#showNotificationMessage('Izin notifikasi ditolak', 'error');
          }
        }
        
        this.#updateNotificationUI();
      } catch (error) {
        console.error('Notification toggle error:', error);
        this.#showNotificationMessage('Terjadi kesalahan', 'error');
      }
    });
  }

  #updateNotificationUI() {
    const icon = document.getElementById('notification-icon');
    const status = document.getElementById('notification-status');
    
    if (!icon || !status) return;
    
    if (this.#pushNotificationManager.isNotificationEnabled()) {
      icon.textContent = '🔔';
      status.textContent = 'ON';
      status.classList.remove('text-gray-500');
      status.classList.add('text-green-600');
    } else {
      icon.textContent = '🔕';
      status.textContent = 'OFF';
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

  #handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      this.#authModel.logout();
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      // Redirect to login with transition
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          location.hash = '/login';
        });
      } else {
        location.hash = '/login';
      }
    }
  }

  async renderPage() {   
    
    try {
      // Get current route path
      const currentPath = getActiveRoute();
      
      // Get the page class from routes
      const page = routes[currentPath];
      
      if (!page) {
        // Handle 404 - redirect to appropriate page based on auth status
        const isAuthenticated = this.#authModel.isAuthenticated();
        window.location.hash = isAuthenticated ? '/' : '/login';
        return;
      }
      
      // Update auth UI when page changes
      this.#updateAuthUI();
      
      // Hide/show footer based on current route
      this.#updateFooterVisibility(currentPath);

      // Create page instance
      const activePage = page();

      const transition = transitionHelper({
        updateDOM: async () => {
          this.#content.innerHTML = await activePage.render();
          activePage.afterRender();
        }
      })
      
      transition.ready.catch(console.error)
      transition.updateCallbackDone.then(()=>{
        scrollTo({top:10,behavior:'instant'})
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
}

export default App;
