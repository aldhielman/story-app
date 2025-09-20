import StoryModel from '../../models/story-model.js';
import StoryListPresenter from '../../presenters/story-list-presenter.js';

export default class StoryListView {

  #presenter

  constructor() {
    const storyModel = new StoryModel();
    this.#presenter = new StoryListPresenter({storyModel, view: this});
  }

  render() {
    return `
      <div class="story-list-container min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        
      <!-- Hero Section -->
        <section class="hero-section relative overflow-hidden pt-24">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div class="text-center">
              <h1 class="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8 leading-tight">
                Story App
              </h1>
              <h2 class="hero-subtitle text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Bagikan cerita menarik Anda dengan dunia
              </h2>
              
              <!-- Location Filter -->
              <div class="location-filter mb-8">
                <div class="max-w-md mx-auto">
                  <div class="relative">
                    <input 
                      type="text" 
                      id="location-filter" 
                      placeholder="Filter berdasarkan lokasi..." 
                      class="w-full px-4 py-3 pl-12 pr-12 text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span class="text-gray-400 text-lg">📍</span>
                    </div>
                    <button 
                      id="clear-filter" 
                      class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      style="display: none;"
                      title="Hapus filter"
                    >
                      <span class="text-lg">✕</span>
                    </button>
                  </div>
                  <div id="filter-status" class="mt-2 text-sm text-gray-600" style="display: none;"></div>
                </div>
              </div>
              
              <!-- User Section for Auth Status -->
              <div class="user-section hidden mb-8">
                <div class="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
                  <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    👤
                  </div>
                  <div class="text-left">
                    <p class="font-semibold text-gray-800" id="user-name">Welcome!</p>
                    <p class="text-sm text-gray-600" id="user-email"></p>
                  </div>
                </div>
              </div>
              
              <div class="guest-actions">
                <div class="action-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a href="#/add-story" class="btn btn-primary inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    <span class="btn-icon text-xl">📝</span>
                    <span>Tambah Cerita</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <main id="story-content" class="story-content">
          <div class="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 pb-16">
            <section class="stories-section">
              <div id="stories-grid" class="stories-grid grid grid-cols-1 sm:grid-cols-2 gap-6" role="main" aria-label="Daftar cerita"></div>
              
              <div id="loading-indicator" class="loading-indicator flex flex-col items-center justify-center py-12" style="display: none;" role="status" aria-live="polite">
                <div class="spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p class="text-gray-600 font-medium">Memuat cerita...</p>
              </div>
              
              <div id="load-more-container" class="load-more-container text-center mt-8" style="display: none;">
                <button id="load-more-btn" class="btn btn-outline inline-flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <span>Muat Lebih Banyak</span>
                </button>
              </div>
              
              <div id="empty-state" class="empty-state text-center py-16" style="display: none;">
                <div class="empty-content max-w-md mx-auto">
                  <div class="text-6xl mb-6">📚</div>
                  <h2 class="text-2xl font-bold text-gray-800 mb-4">Belum Ada Cerita</h2>
                  <p class="text-gray-600 mb-8">Jadilah yang pertama membagikan cerita menarik!</p>
                  <a href="#/add-story" class="btn btn-primary inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    <span>📝</span>
                    <span>Tambah Cerita Pertama</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    `;
  }

  afterRender() {
    this.#setupEvents();
    this.#presenter.loadStories();
  }

  #setupEvents(){
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.#presenter.loadMoreStories();
      });
    }

    // Location filter events
    const locationFilter = document.getElementById('location-filter');
    const clearFilter = document.getElementById('clear-filter');
    
    if (locationFilter) {
      let filterTimeout;
      
      locationFilter.addEventListener('input', (event) => {
        const value = event.target.value.trim();
        
        // Show/hide clear button
        if (clearFilter) {
          clearFilter.style.display = value ? 'flex' : 'none';
        }
        
        // Debounce filter to avoid too many API calls
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
          this.#presenter.filterByLocation(value);
        }, 500);
      });
      
      locationFilter.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          clearTimeout(filterTimeout);
          const value = event.target.value.trim();
          this.#presenter.filterByLocation(value);
        }
      });
    }
    
    if (clearFilter) {
      clearFilter.addEventListener('click', () => {
        locationFilter.value = '';
        clearFilter.style.display = 'none';
        this.hideFilterStatus();
        this.#presenter.filterByLocation('');
      });
    }

     // Story click events (delegated)
    const storiesGrid = document.getElementById('stories-grid');
    if (storiesGrid) {
      storiesGrid.addEventListener('click', (event) => {
        const storyCard = event.target.closest('[data-story-id]');
        if (storyCard) {
          const storyId = storyCard.dataset.storyId;
          window.location.hash = `#/story/${storyId}`;
        }
      });
    }
  }

  // View methods - hanya DOM manipulation
  showLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }
  }

  hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  showLoadMoreButton() {
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
      loadMoreContainer.style.display = 'block';
    }
  }

  hideLoadMoreButton() {
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
      loadMoreContainer.style.display = 'none';
    }
  }

  showStories(stories, reset = false) {
    const storiesGrid = document.getElementById('stories-grid');
    if (!storiesGrid) return;

    if (reset) {
      storiesGrid.innerHTML = '';
    }

    stories.forEach(story => {
      const storyElement = this.#createStoryElement(story);
      storiesGrid.appendChild(storyElement);
    });
  }

  #createStoryElement(story) {
    const storyElement = document.createElement('div');
    storyElement.className = 'story-card bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1';
    storyElement.dataset.storyId = story.id;
    
    storyElement.innerHTML = `
      <div class="aspect-w-16 aspect-h-12 bg-gray-100">
        <img src="${story.photoUrl}" alt="${story.description}" class="w-full h-48 object-cover" loading="lazy">
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${story.description}</h3>
        <div class="flex items-center text-sm text-gray-500 space-x-2">
          <span>📍</span>
          <span>${story.location || 'Lokasi tidak diketahui'}</span>
        </div>
        <div class="flex items-center text-sm text-gray-500 mt-2">
          <span>👤</span>
          <span class="ml-1">${story.name}</span>
        </div>
      </div>
    `;
    
    return storyElement;
  }

  showError(message) {
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    
    if (errorState && errorMessage) {
      errorMessage.textContent = message;
      errorState.style.display = 'block';
    }
  }

  hideError() {
    const errorState = document.getElementById('error-state');
    if (errorState) {
      errorState.style.display = 'none';
    }
  }

  showEmptyState() {
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
      emptyState.style.display = 'block';
    }
  }

  hideEmptyState() {
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  showFilterStatus(message) {
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
      filterStatus.textContent = message;
      filterStatus.style.display = 'block';
    }
  }

  hideFilterStatus() {
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
      filterStatus.style.display = 'none';
    }
  }
}