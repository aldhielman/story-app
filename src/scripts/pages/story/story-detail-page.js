import StoryModel from '../../models/story-model.js';
import { parseActivePathname } from '../../routes/url-parser.js';
import StoryDetailPresenter from '../../presenters/story-detail-presenter.js';
import Map from '../../utils/map.js';

export default class StoryDetailPage {

  #map
  #presenter
  #currentStory

  constructor() {
    const storyModel = new StoryModel();
    this.#presenter = new StoryDetailPresenter({storyModel, view: this});
  }

  async render() {
    return `
      <div class="story-detail-container min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20">
        <!-- Loading State -->
        <div id="loading-state" class="loading-container flex flex-col items-center justify-center min-h-screen" aria-live="polite">
          <div class="spinner w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p class="text-gray-600 font-medium">Memuat cerita...</p>
        </div>
            
        <!-- Story Content -->
        <main id="story-detail-content" class="story-detail-content max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-24" style="display: none;">
          <nav class="breadcrumb mb-8" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2 text-sm text-gray-500">
              <li><a href="#/story" class="hover:text-blue-600 transition-colors">Daftar Cerita</a></li>
              <li class="flex items-center space-x-2">
                <span>›</span>
                <span aria-current="page" class="text-gray-800 font-medium">Detail Cerita</span>
              </li>
            </ol>
          </nav>
          
          <article class="story-article bg-white rounded-2xl shadow-xl overflow-hidden">
            <header class="story-header p-6 border-b border-gray-200">
              <div class="flex items-start justify-between mb-4">
                <h1 id="story-title" class="story-title text-2xl sm:text-3xl font-bold text-gray-900 flex-1"></h1>
                <button id="bookmark-btn" class="bookmark-btn ml-4 flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span class="bookmark-icon text-xl">🤍</span>
                  <span class="bookmark-text font-medium">Bookmark</span>
                </button>
              </div>
              <div class="story-meta">
                <div class="author-info flex items-center space-x-4">
                  <div class="author-avatar w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    <span id="author-initial"></span>
                  </div>
                  <div class="author-details">
                    <span id="author-name" class="author-name text-xl font-bold text-gray-800"></span>
                    <time id="story-date" class="story-date text-gray-500 text-sm"></time>
                  </div>
                </div>
              </div>
            </header>
            
            <div class="story-content">
              <div class="story-image-container relative group">
                <img id="story-image" class="story-image w-full h-64 sm:h-80 lg:h-96 object-cover" alt="" loading="lazy">
              </div>
              
              <div class="story-text p-6">
                <h2 id="story-title" class="story-title text-3xl font-bold text-gray-800 mb-6 leading-tight"></h2>
                <div id="story-description" class="story-description text-gray-600 leading-relaxed text-lg"></div>
              </div>
              
              <div class="story-location bg-gray-50 p-6 border-t border-gray-200" id="story-location" style="display: none;">
                <h2 class="text-xl font-bold text-gray-800 mb-4">📍 Lokasi Cerita</h2>
                <div class="location-info flex items-center space-x-2 mb-4">
                  <h3 class="text-lg font-semibold text-gray-800">Lokasi Cerita</h3>
                </div>
                <div id="location-map" class="location-map w-full h-80 bg-gray-200 rounded-xl overflow-hidden shadow-lg border-2 border-gray-300"></div>
              </div>
            </div>
            
            <footer class="story-footer p-6 border-t border-gray-200 bg-gray-50">
              <div class="story-actions flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#/story" class="btn btn-secondary inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <span>📚</span>
                  <span>Lihat Cerita Lain</span>
                </a>
                <a href="#/bookmark" class="btn btn-outline inline-flex items-center space-x-2 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <span>📖</span>
                  <span>Lihat Bookmark</span>
                </a>
              </div>
            </footer>
          </article>
        </main>

        <!-- Success/Info Messages -->
        <div id="message-container" class="fixed top-20 right-4 z-50 space-y-2">
          <!-- Messages will be inserted here -->
        </div>
      </div>
    `;
  }

  async afterRender() {
    // Get story ID from URL hash
    const {id} = parseActivePathname()
    await this.#presenter.getStoryDetail(id);
    this.#bindEvents();
  }

  #bindEvents() {
    // Bookmark button event
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', async () => {
        if (this.#currentStory) {
          await this.#presenter.toggleBookmark(this.#currentStory);
        }
      });
    }
  }

  async initialMap(lat,lon,storyTitle) {
    this.#map = await Map.build('#location-map', {
      zoom: 10,
      locate: true,
      center: [lat,lon]
    });
    
    const markerOptions = { alt: storyTitle };
    
    const popupOptions = { 
      content: `
        <strong>${storyTitle}</strong><br>
        Latitude: ${lat}<br>
        Longitude: ${lon}
      `
    };
    this.#map.addMarker([lat,lon], markerOptions, popupOptions);
  }

  async renderStory(story) {
    this.#currentStory = story;
    
    document.title = `${story.name} - Story App`;
    
    // Author info
    const authorInitial = document.getElementById('author-initial');
    const authorName = document.getElementById('author-name');
    const storyDate = document.getElementById('story-date');
    
    if (authorInitial) authorInitial.textContent = story.name.charAt(0).toUpperCase();
    if (authorName) authorName.textContent = story.name;
    if (storyDate) {
      const date = new Date(story.createdAt);
      storyDate.textContent = date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      storyDate.setAttribute('datetime', story.createdAt);
    }
    
    // Story content
    const storyImage = document.getElementById('story-image');
    const storyTitle = document.getElementById('story-title');
    const storyDescription = document.getElementById('story-description');
    
    if (storyImage) {
      storyImage.src = story.photoUrl;
      storyImage.alt = `Foto cerita: ${story.description}`;
    }
    
    if (storyTitle) storyTitle.textContent = story.name;
    if (storyDescription) storyDescription.textContent = story.description;
    
    // Handle location section
    const locationSection = document.getElementById('story-location');
    if (story.lat && story.lon && locationSection) {
      // Tampilkan section location
      locationSection.style.display = 'block';
      
      // Set koordinat text jika ada
      const locationText = document.getElementById('location-text');
      if (locationText) {
        locationText.textContent = story.location;
      }
    } else if (locationSection) {
      // Sembunyikan section jika tidak ada koordinat
      locationSection.style.display = 'none';
    }

    // Update bookmark button status
    await this.#presenter.updateBookmarkButtonStatus(story.id);
  }

  updateBookmarkButton(isBookmarked) {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const icon = bookmarkBtn.querySelector('.bookmark-icon');
    const text = bookmarkBtn.querySelector('.bookmark-text');
    
    if (isBookmarked) {
      icon.textContent = '❤️';
      text.textContent = 'Tersimpan';
      bookmarkBtn.classList.remove('border-gray-300', 'text-gray-600', 'hover:border-red-500', 'hover:text-red-500');
      bookmarkBtn.classList.add('border-red-500', 'text-red-500', 'bg-red-50', 'hover:bg-red-100');
    } else {
      icon.textContent = '🤍';
      text.textContent = 'Bookmark';
      bookmarkBtn.classList.remove('border-red-500', 'text-red-500', 'bg-red-50', 'hover:bg-red-100');
      bookmarkBtn.classList.add('border-gray-300', 'text-gray-600', 'hover:border-red-500', 'hover:text-red-500');
    }
  }

  showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    const messageEl = document.createElement('div');
    
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    messageEl.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 transform translate-x-full`;
    messageEl.textContent = message;
    
    container.appendChild(messageEl);
    
    // Animate in
    setTimeout(() => messageEl.classList.remove('translate-x-full'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.classList.add('translate-x-full');
      setTimeout(() => container.removeChild(messageEl), 300);
    }, 3000);
  }

  showLoading() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const contentState = document.getElementById('story-detail-content');
    
    if (loadingState) loadingState.style.display = 'flex';
    if (errorState) errorState.style.display = 'none';
    if (contentState) contentState.style.display = 'none';
  }

  hideLoading() {
    const loadingState = document.getElementById('loading-state');
    const contentState = document.getElementById('story-detail-content');
    
    if (loadingState) loadingState.style.display = 'none';
    if (contentState) contentState.style.display = 'block';
  }

  showError(message) {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const contentState = document.getElementById('story-detail-content');
    const errorMessage = document.getElementById('error-message');
    
    if (loadingState) loadingState.style.display = 'none';
    if (contentState) contentState.style.display = 'none';
    if (errorState) errorState.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = message;
  }
}