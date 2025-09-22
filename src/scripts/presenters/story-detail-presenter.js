export default class StoryDetailPresenter {

  #storyModel;
  #view

  constructor({ storyModel, view }) {
    this.#view = view;
    this.#storyModel = storyModel;
  }

  async getStoryDetail(id) {
    try {
      // Tampilkan loading
      this.#view.showLoading();
      
      const data = await this.#storyModel.loadStoryDetail(id);
      this.#view.renderStory(data.story);
      
      // Jika ada koordinat, buat map dan marker
      if (data.story.lat && data.story.lon) {
        await this.#view.initialMap(data.story.lat, data.story.lon, data.story.name);
      }
      
      // Sembunyikan loading setelah semua selesai
      this.#view.hideLoading();
    } catch (error) {
      console.error('Error loading story detail:', error);
      // Tampilkan error state
      this.#view.showError('Gagal memuat detail cerita. Silakan coba lagi.');
    }
  }

  async updateBookmarkButtonStatus(storyId) {
    try {
      const isBookmarked = await this.#storyModel.isStoryBookmarked(storyId);
      this.#view.updateBookmarkButton(isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }

  async toggleBookmark(story) {
    try {
      const isBookmarked = await this.#storyModel.isStoryBookmarked(story.id);
      
      if (isBookmarked) {
        const result = await this.#storyModel.removeBookmark(story.id);
        if (result.success) {
          this.#view.updateBookmarkButton(false);
          this.#view.showMessage(result.message, 'info');
        } else {
          this.#view.showMessage(result.message, 'error');
        }
      } else {
        const result = await this.#storyModel.bookmarkStory(story);
        if (result.success) {
          this.#view.updateBookmarkButton(true);
          this.#view.showMessage(result.message, 'success');
        } else {
          this.#view.showMessage(result.message, 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      this.#view.showMessage('Gagal mengubah bookmark', 'error');
    }
  }
}