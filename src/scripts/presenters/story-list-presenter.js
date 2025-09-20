export default class StoryListPresenter {

  #view
  #storyModel
  #isLoading
  #currentLocationFilter = ''

  constructor({storyModel, view}) {
    this.#storyModel = storyModel;
    this.#view = view;
    this.#isLoading = false;
  }

  async loadStories(reset = false) {
    if (this.#isLoading) return;
    
    this.#isLoading = true;
    this.#view.showLoading();
    this.#view.hideError();
    
    try {
      const result = await this.#storyModel.loadStories(1, 10, this.#currentLocationFilter, reset);
      
      if (result.success) {
        this.#view.showStories(result.stories, reset);
        
        if (this.#storyModel.hasMoreStories()) {
          this.#view.showLoadMoreButton();
        } else {
          this.#view.hideLoadMoreButton();
        }
        
        if (result.stories.length === 0) {
          if (this.#currentLocationFilter) {
            this.#view.showEmptyState();
            this.#view.showFilterStatus(`Tidak ada cerita ditemukan untuk lokasi "${this.#currentLocationFilter}"`);
          } else {
            this.#view.showEmptyState();
          }
        } else {
          this.#view.hideEmptyState();
          if (this.#currentLocationFilter) {
            this.#view.showFilterStatus(`Menampilkan cerita untuk lokasi "${this.#currentLocationFilter}"`);
          } else {
            this.#view.hideFilterStatus();
          }
        }
      } else {
        this.#view.showError(result.message || 'Gagal memuat cerita');
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      this.#view.showError(error.message || 'Terjadi kesalahan saat memuat cerita');
    } finally {
      this.#view.hideLoading();
      this.#isLoading = false;
    }
  }

  async loadMoreStories() {
    if (this.#isLoading || !this.#storyModel.hasMoreStories()) return;
    
    this.#isLoading = true;
    
    try {
      const result = await this.#storyModel.loadMoreStories(this.#currentLocationFilter);
      
      if (result.success) {
        this.#view.showStories(result.stories, false);
        
        if (!this.#storyModel.hasMoreStories()) {
          this.#view.hideLoadMoreButton();
        }
      } else {
        this.#view.showError(result.message || 'Gagal memuat lebih banyak cerita');
      }
    } catch (error) {
      console.error('Error loading more stories:', error);
      this.#view.showError(error.message || 'Terjadi kesalahan saat memuat cerita');
    } finally {
      this.#isLoading = false;
    }
  }

  async filterByLocation(location) {
    this.#currentLocationFilter = location;
    await this.loadStories(true);
  }
}