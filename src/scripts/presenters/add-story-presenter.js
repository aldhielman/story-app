import syncManager from '../utils/sync-manager.js';

export default class AddStoryPresenter {

    #view
    #storyModel
  
    constructor({storyModel, view}) {
      this.#storyModel = storyModel;
      this.#view = view;
      // Remove sync listeners from presenter - moved to view
    }
  
    // Form submission
    async handleFormSubmit({description, photo, lat, lon}) {
      try {
        const result = await this.#storyModel.createStory({description, photo, lat, lon});
        
        if (result.success) {
          if (result.online) {
            this.#view.showSuccessMessage('Story berhasil ditambahkan!');
            // Redirect moved to view layer
          } else {
            this.#view.showOfflineMessage(result.message);
          }
        } else {
          this.#view.showErrorMessage(result.message);
        }
      } catch (error) {
        console.error('Error creating story:', error);
        this.#view.showErrorMessage('Terjadi kesalahan saat menambahkan story');
      }
    }

    getConnectionStatus() {
      return syncManager.getConnectionStatus();
    }

    async getOfflineStoriesCount() {
      return await this.#storyModel.getOfflineStoriesCount();
    }
}
