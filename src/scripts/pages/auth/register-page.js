import AuthModel from '../../models/auth-model.js';
import RegisterPresenter from '../../presenters/register-presenter.js';

export default class RegisterPage {
  constructor() {
    this.presenter = null;
  }

  render() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
        <div class="w-full max-w-sm">
          <!-- Auth Card -->
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-6 animate-fade-in">
            <!-- Header with Highlighted App Name -->
            <div class="text-center mb-6">
              <div class="mb-4">
                <span class="text-4xl">📖</span>
              </div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Story App
              </h1>
              <p class="text-sm text-gray-600">Buat akun baru</p>
            </div>
            
            <!-- Compact Register Form -->
            <form id="register-form" class="space-y-4" novalidate>
              <!-- Name Field -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm" 
                  placeholder="Nama lengkap Anda"
                  required 
                  aria-describedby="name-error"
                  autocomplete="name"
                >
                <div id="name-error" class="text-red-600 text-xs mt-1 min-h-[1rem]" role="alert" aria-live="polite"></div>
              </div>
              
              <!-- Email Field -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm" 
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
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm" 
                  placeholder="••••••••"
                  required 
                  aria-describedby="password-error"
                  autocomplete="new-password"
                >
                <div id="password-error" class="text-red-600 text-xs mt-1 min-h-[1rem]" role="alert" aria-live="polite"></div>
              </div>
              
              <!-- Submit Button -->
              <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm" id="register-btn">
                <span class="btn-text flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Daftar
                </span>
                <div class="loading-spinner hidden">
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </button>
              
              <!-- Form Messages -->
              <div id="form-error" class="text-red-600 text-xs text-center min-h-[1rem]" role="alert" aria-live="polite"></div>
              <div id="form-success" class="text-green-600 text-xs text-center min-h-[1rem]" role="alert" aria-live="polite"></div>
            </form>
            
            <!-- Footer -->
            <div class="mt-6 text-center">
              <p class="text-xs text-gray-600">
                Sudah punya akun? 
                <a href="#/login" class="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 hover:underline">
                  Masuk di sini
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    const authModel = new AuthModel();
    this.presenter = new RegisterPresenter({ authModel, view: this });
    this.presenter.init(); // Pastikan init() dipanggil juga di register
  }

  // View methods - hanya untuk display dan DOM manipulation
  getFormData() {
    return {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    };
  }

  showValidationErrors(errors) {
    // Clear all errors first
    document.getElementById('name-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    
    // Show specific errors
    if (errors.name) {
      document.getElementById('name-error').textContent = errors.name;
    }
    if (errors.email) {
      document.getElementById('email-error').textContent = errors.email;
    }
    if (errors.password) {
      document.getElementById('password-error').textContent = errors.password;
    }
  }

  showError(message) {
    document.getElementById('form-error').textContent = message;
    document.getElementById('form-success').textContent = '';
  }

  showSuccess(message) {
    document.getElementById('form-success').textContent = message;
    document.getElementById('form-error').textContent = '';
  }

  clearErrors() {
    document.getElementById('form-error').textContent = '';
    document.getElementById('form-success').textContent = '';
    document.getElementById('name-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
  }

  showLoading(isLoading) {
    const registerBtn = document.getElementById('register-btn');
    const btnText = registerBtn?.querySelector('.btn-text');
    const spinner = registerBtn?.querySelector('.loading-spinner');
    
    if (registerBtn) {
      registerBtn.disabled = isLoading;
    }
    if (btnText) {
      btnText.style.display = isLoading ? 'none' : 'block';
    }
    if (spinner) {
      spinner.style.display = isLoading ? 'block' : 'none';
    }
  }

  bindFormSubmit(handler) {
    const form = document.getElementById('register-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handler(this.getFormData());
      });
    }
  }

  bindInputValidation(handler) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (nameInput) {
      nameInput.addEventListener('blur', handler);
    }
    if (emailInput) {
      emailInput.addEventListener('blur', handler);
    }
    if (passwordInput) {
      passwordInput.addEventListener('blur', handler);
    }
  }

  // Navigation method - handles View Transition API
  navigateToLogin() {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        window.location.hash = '#/login';
      });
    } else {
      window.location.hash = '#/login';
    }
  }
}