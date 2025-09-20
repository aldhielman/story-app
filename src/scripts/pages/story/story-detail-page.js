import StoryModel from '../../models/story-model.js';
import { parseActivePathname } from '../../routes/url-parser.js';
import StoryDetailPresenter from '../../presenters/story-detail-presenter.js';
import Map from '../../utils/map.js';

export default class StoryDetailPage {

  #map
  #presenter

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
              <h1 id="story-title" class="story-title text-2xl sm:text-3xl font-bold text-gray-900 mb-4"></h1>
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
              <div class="story-actions text-center">
                <a href="#/story" class="btn btn-secondary inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <span>📚</span>
                  <span>Lihat Cerita Lain</span>
                </a>
              </div>
            </footer>
          </article>
        </main>
    `;
  }

  async afterRender() {
    // Get story ID from URL hash
    const {id} = parseActivePathname()
    await this.#presenter.getStoryDetail(id);
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

  renderStory(story) {
    
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