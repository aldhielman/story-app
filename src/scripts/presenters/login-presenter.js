export default class LoginPresenter {

  #view
  #authModel

  constructor({ authModel, view }) {
    this.#view = view;
    this.#authModel = authModel;
  }

  async handleLogin(formData) {

    this.#view.showLoading(true);
    this.#view.clearErrors();
    
    try {
      if (!this.#view.validateForm(formData)) {
        this.#view.showValidationErrors();
        return;
      }
      const result = await this.#authModel.login(
        formData.email.trim(),
        formData.password
      );
      if (result.success) {
        // Success - redirect to story list
        this.#view.navigateToStoryList();
      } else {
        this.#view.showError(result.message);
      }
    } catch (error) {
      this.#view.showError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      this.#view.showLoading(false);
    }
  }
}