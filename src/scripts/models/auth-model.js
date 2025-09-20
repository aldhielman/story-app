import { login, register } from '../data/api.js';

class AuthModel {
  constructor() {
    if (AuthModel.instance) {
      return AuthModel.instance;
    }
    
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    
    AuthModel.instance = this;
  }

  async login(email, password) {
    try {
      const response = await login(email, password);
      this.token = response.loginResult.token;
      this.user = {
        userId: response.loginResult.userId,
        name: response.loginResult.name,
        email: email
      };
      
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
            
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      return { success: true, user: this.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async register(name, email, password) {
    try {
      await register(name, email, password);
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Dispatch auth state change event
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}

// Reset instance untuk testing jika diperlukan
AuthModel.instance = null;

export default AuthModel;