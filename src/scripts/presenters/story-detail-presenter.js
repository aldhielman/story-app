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
}