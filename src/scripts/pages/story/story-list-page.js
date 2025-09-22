import StoryModel from '../../models/story-model.js';
import StoryListPresenter from '../../presenters/story-list-presenter.js';
import Database from '../../data/database.js';
import syncManager from '../../utils/sync-manager.js';

export default class StoryListView {

  #presenter

  constructor() {
    const storyModel = new StoryModel();
    this.#presenter = new StoryListPresenter({storyModel, view: this});
    this.#setupSyncListeners();
  }

  #setupSyncListeners() {
    // Listen for sync events to update offline story indicators
    window.addEventListener('storySynced', (event) => {
      const { tempId, serverStory } = event.detail;
      this.#updateOfflineStoryToSynced(tempId, serverStory);
    });

    window.addEventListener('syncComplete', () => {
      // Refresh the story list to show updated sync status
      this.#presenter.loadStories(true);
    });

    // Listen for connection changes
    window.addEventListener('online', () => {
      this.#showConnectionStatus('Terhubung ke internet', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.#showConnectionStatus('Mode offline', 'warning');
    });
  }

  async afterRender() {
    this.#setupEvents();
    await this.#presenter.loadStories();
    await this.#loadAndDisplayOfflineStories();
  }

  async #loadAndDisplayOfflineStories() {
    try {
      const offlineStories = await Database.getOfflineStories();
      if (offlineStories.length > 0) {
        // Convert offline stories to display format
        const formattedOfflineStories = offlineStories.map(story => ({
          id: story.tempId,
          description: story.description,
          photoUrl: story.photo, // base64 photo
          location: story.location || 'Lokasi tidak diketahui',
          name: 'Anda',
          createdAt: story.createdAt,
          isOffline: true,
          synced: story.synced
        }));

        // Add offline stories to the beginning of the list
        this.showOfflineStories(formattedOfflineStories);
      }
    } catch (error) {
      console.error('Error loading offline stories:', error);
    }
  }

  showOfflineStories(offlineStories) {
    const storiesGrid = document.getElementById('stories-grid');
    if (!storiesGrid) return;

    offlineStories.forEach(story => {
      const storyElement = this.#createStoryElement(story);
      // Insert at the beginning
      storiesGrid.insertBefore(storyElement, storiesGrid.firstChild);
    });
  }

  #createStoryElement(story) {
    const storyElement = document.createElement('div');
    storyElement.className = 'story-card bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1';
    storyElement.dataset.storyId = story.id;
    
    // Add offline indicator classes
    if (story.isOffline) {
      storyElement.classList.add('offline-story');
      if (!story.synced) {
        storyElement.classList.add('unsynced');
      }
    }
    
    const offlineIndicator = story.isOffline ? `
      <div class="absolute top-2 left-2 z-10">
        ${story.synced ? 
          '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>Tersinkron</span>' :
          '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><span class="w-2 h-2 bg-amber-400 rounded-full mr-1 animate-pulse"></span>Menunggu sync</span>'
        }
      </div>
    ` : '';
    
    storyElement.innerHTML = `
      <div class="aspect-w-16 aspect-h-12 bg-gray-100 relative">
        ${offlineIndicator}
        <img src="${story.photoUrl}" alt="${story.description}" class="w-full h-48 object-cover" loading="lazy">
        ${story.isOffline && !story.synced ? '<div class="absolute inset-0 bg-amber-50/20 backdrop-blur-[0.5px]"></div>' : ''}
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${story.description}</h3>
        <div class="flex items-center text-sm text-gray-500 space-x-2">
          <span>📍</span>
          <span>${story.location || 'Lokasi tidak diketahui'}</span>
        </div>
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center text-sm text-gray-500">
            <span>👤</span>
            <span class="ml-1">${story.name}</span>
          </div>
          ${story.isOffline ? `
            <div class="text-xs text-gray-400">
              ${story.synced ? '✅ Disimpan' : '📱 Offline'}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Handle click for offline stories
    if (story.isOffline && !story.synced) {
      storyElement.addEventListener('click', (e) => {
        e.preventDefault();
        this.#showOfflineStoryMessage();
      });
    } else if (!story.isOffline) {
      storyElement.addEventListener('click', () => {
        window.location.hash = `#/story/${story.id}`;
      });
    }
    
    return storyElement;
  }

  #updateOfflineStoryToSynced(tempId, serverStory) {
    const storyElement = document.querySelector(`[data-story-id="${tempId}"]`);
    if (storyElement) {
      // Update the indicator to show synced status
      const indicator = storyElement.querySelector('.absolute.top-2.left-2');
      if (indicator) {
        indicator.innerHTML = '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>Tersinkron</span>';
      }
      
      // Remove overlay
      const overlay = storyElement.querySelector('.absolute.inset-0.bg-amber-50\\/20');
      if (overlay) {
        overlay.remove();
      }
      
      // Update click handler to navigate to server story
      storyElement.replaceWith(storyElement.cloneNode(true));
      const newElement = document.querySelector(`[data-story-id="${tempId}"]`);
      newElement.addEventListener('click', () => {
        window.location.hash = `#/story/${serverStory.id}`;
      });
    }
  }

  #showOfflineStoryMessage() {
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-amber-500 text-white text-sm font-medium transition-all duration-300 transform translate-x-full';
    toast.textContent = 'Story offline akan tersedia setelah tersinkronisasi';
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  #showConnectionStatus(message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 transform -translate-x-full`;
    
    switch (type) {
      case 'success':
        toast.classList.add('bg-green-500');
        break;
      case 'warning':
        toast.classList.add('bg-amber-500');
        break;
      default:
        toast.classList.add('bg-blue-500');
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('-translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('-translate-x-full');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
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