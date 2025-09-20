export default class RegisterPresenter {
  constructor({ authModel, view }) {
    this.view = view;
    this.authModel = authModel;
  }

  async init() {    
    this.bindEvents();
  }

  bindEvents() {
    this.view.bindFormSubmit((formData) => this.handleRegister(formData));
    this.view.bindInputValidation(() => this.validateForm());
  }

  validateForm() {
    const formData = this.view.getFormData();
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Nama lengkap wajib diisi';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password.length < 8) {
      errors.password = 'Password minimal 8 karakter';
    }
    
    this.view.showValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async handleRegister(formData) {
    if (!this.validateForm()) return;
    
    this.view.showLoading(true);
    this.view.clearErrors();
    
    try {
      const result = await this.authModel.register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password
      );
      
      if (result.success) {
        // Success - redirect to login
        this.view.showSuccess('Registrasi berhasil! Silakan login.');
        setTimeout(() => {
          this.view.navigateToLogin();
        }, 2000);
      } else {
        this.view.showError(result.message);
      }
    } catch (error) {
      this.view.showError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      this.view.showLoading(false);
    }
  }
}