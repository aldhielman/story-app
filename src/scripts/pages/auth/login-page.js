import AuthModel from '../../models/auth-model.js';
import LoginPresenter from '../../presenters/login-presenter.js';

export default class LoginPage {

  #presenter;
  #validationErrors = {};
  #formData;

  constructor() {
    const authModel = new AuthModel();
    this.#presenter = new LoginPresenter({ authModel, view: this });
  }

  render() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div class="w-full max-w-sm">
          <!-- Auth Card -->
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-6 animate-fade-in">
            <!-- Header with Highlighted App Name -->
            <div class="text-center mb-6">
              <div class="mb-4">
                <span class="text-4xl">📖</span>
              </div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Story App
              </h1>
              <p class="text-sm text-gray-600">Masuk ke akun Anda</p>
            </div>
            
            <!-- Compact Login Form -->
            <form id="login-form" class="space-y-4" novalidate>
              <!-- Email Field -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm" 
                  placeholder="email@example.com"
                  required 
                  aria-describedby="email-error"
                  autocomplete="email"
                >
                <div id="email-error" class="text-red-600 text-xs mt-1 min-h-[1rem]" role="alert" aria-live="polite"></div>
              </div>
              
              <!-- Password Field -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm" 
                  placeholder="••••••••"
                  required 
                  aria-describedby="password-error"
                  autocomplete="current-password"
                >
                <div id="password-error" class="text-red-600 text-xs mt-1 min-h-[1rem]" role="alert" aria-live="polite"></div>
              </div>
              
              <!-- Submit Button -->
              <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm" id="login-btn">
                <span class="btn-text flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Masuk
                </span>
                <div class="loading-spinner hidden">
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </button>
              
              <!-- Form Error -->
              <div id="form-error" class="text-red-600 text-xs text-center min-h-[1rem]" role="alert" aria-live="polite"></div>
            </form>
            
            <!-- Footer -->
            <div class="mt-6 text-center">
              <p class="text-xs text-gray-600">
                Belum punya akun? 
                <a href="#/register" class="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline">
                  Daftar di sini
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    this.#setupEvents();
  }

  #setupEvents() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.#presenter.handleLogin(this.#getFormData());
      });
    }
  }

  validateForm(formData) {
    // Email validation
    if (!formData.email.trim()) {
      this.#validationErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      this.#validationErrors.email = 'Format email tidak valid';
    }
    
    // Password validation
    if (!formData.password.trim()) {
      this.#validationErrors.password = 'Password wajib diisi';
    }
    
    return Object.keys(this.#validationErrors).length === 0;
  }

  #getFormData() {
    return {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    };
  }

  showValidationErrors() {
    // Clear all errors first
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    
    // Show specific errors
    if (this.#validationErrors.email) {
      document.getElementById('email-error').textContent = this.#validationErrors.email;
    }
    if (this.#validationErrors.password) {
      document.getElementById('password-error').textContent = this.#validationErrors.password;
    }
  }

  showError(message) {
    document.getElementById('form-error').textContent = message;
  }

  clearErrors() {
    this.#validationErrors = {}

    document.getElementById('form-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
  }

  showLoading(isLoading) {
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn?.querySelector('.btn-text');
    const spinner = loginBtn?.querySelector('.loading-spinner');
    
    if (loginBtn) {
      loginBtn.disabled = isLoading;
    }
    if (btnText) {
      btnText.style.display = isLoading ? 'none' : 'block';
    }
    if (spinner) {
      spinner.style.display = isLoading ? 'flex' : 'none';
    }
  }

  // Navigation method - handles View Transition API
  navigateToStoryList() {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        window.location.hash = '/story';
      });
    } else {
      window.location.hash = '/story';
    }
  }
}