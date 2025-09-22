import StoryModel from '../../models/story-model.js';
import BookmarkPresenter from '../../presenters/bookmark-presenter.js';

export default class BookmarkPage {
  #presenter;

  constructor() {
    const storyModel = new StoryModel();
    this.#presenter = new BookmarkPresenter({storyModel, view: this});
  }

  render() {
    return `
      <div class="bookmark-container min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        
        <!-- Hero Section -->
        <section class="hero-section relative overflow-hidden pt-24">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div class="text-center">
              <h1 class="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8 leading-tight">
                📚 Bookmark Saya
              </h1>
              <h2 class="hero-subtitle text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Koleksi cerita favorit yang tersimpan untuk dibaca offline
              </h2>
            </div>
          </div>
        </section>

        <!-- Empty State -->
        <div id="empty-state" class="empty-container max-w-2xl mx-auto px-4 text-center py-16" style="display: none;">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div class="text-gray-400 text-8xl mb-6">📖</div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">Belum Ada Bookmark</h3>
            <p class="text-gray-600 mb-8 leading-relaxed">
              Anda belum menyimpan cerita apapun. Mulai jelajahi cerita menarik dan bookmark yang Anda sukai!
            </p>
            <a href="#/story" class="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <span>🔍</span>
              <span>Jelajahi Cerita</span>
            </a>
          </div>
        </div>

        <!-- Bookmark Stories Grid -->
        <main id="bookmark-content" class="bookmark-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" style="display: none;">
          
          <!-- Stats Bar -->
          <div class="stats-bar bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 text-xl">📚</span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Bookmark Tersimpan</h3>
                  <p id="bookmark-count" class="text-gray-600">0 cerita</p>
                </div>
              </div>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Tersedia offline</span>
              </div>
            </div>
          </div>

          <!-- Stories Grid -->
          <div id="bookmark-stories-grid" class="stories-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Stories will be inserted here -->
          </div>
        </main>

        <!-- Success/Info Messages -->
        <div id="message-container" class="fixed top-20 right-4 z-50 space-y-2">
          <!-- Messages will be inserted here -->
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this.#presenter.loadBookmarkedStories();
  }

  showBookmarkedStories(stories) {
    const grid = document.getElementById('bookmark-stories-grid');
    const content = document.getElementById('bookmark-content');
    const countElement = document.getElementById('bookmark-count');
    
    if (stories.length === 0) {
      this.showEmptyState();
      return;
    }

    // Update count
    countElement.textContent = `${stories.length} cerita`;
    
    // Render stories
    grid.innerHTML = stories.map(story => this.#createStoryCard(story)).join('');
    
    // Bind events for story cards
    this.#bindStoryCardEvents();
    
    content.style.display = 'block';
  }

  showEmptyState() {
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('bookmark-content').style.display = 'none';
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

  updateBookmarkButton(storyId, isBookmarked) {
    const button = document.querySelector(`[data-story-id="${storyId}"] .bookmark-btn`);
    if (button) {
      const icon = button.querySelector('.bookmark-icon');
      const text = button.querySelector('.bookmark-text');
      
      if (isBookmarked) {
        icon.textContent = '❤️';
        text.textContent = 'Tersimpan';
        button.classList.add('bookmarked');
      } else {
        icon.textContent = '🤍';
        text.textContent = 'Bookmark';
        button.classList.remove('bookmarked');
      }
    }
  }

  #createStoryCard(story) {
    const date = new Date(story.createdAt);
    const bookmarkedDate = new Date(story.bookmarkedAt);
    
    return `
      <article class="story-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group" data-story-id="${story.id}">
        <div class="story-image-container relative overflow-hidden">
          <img src="${story.photoUrl}" alt="Story image" class="story-image w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
          <div class="absolute top-3 right-3">
            <span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              📱 Offline
            </span>
          </div>
        </div>
        
        <div class="story-content p-6">
          <div class="story-meta mb-3">
            <div class="flex items-center space-x-3 mb-2">
              <div class="author-avatar w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${story.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 class="author-name text-sm font-semibold text-gray-900">${story.name}</h3>
                <time class="story-date text-xs text-gray-500" datetime="${story.createdAt}">
                  ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              </div>
            </div>
          </div>
          
          <p class="story-description text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
            ${story.description}
          </p>
          
          <div class="story-actions flex items-center justify-between">
            <button class="read-btn flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors" data-story-id="${story.id}">
              <span>📖</span>
              <span>Baca</span>
            </button>
            
            <div class="flex items-center space-x-2">
              <button class="bookmark-btn bookmarked flex items-center space-x-1 text-red-500 hover:text-red-600 text-sm transition-colors" data-story-id="${story.id}">
                <span class="bookmark-icon">❤️</span>
                <span class="bookmark-text">Tersimpan</span>
              </button>
            </div>
          </div>
          
          <div class="bookmark-info mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-500">
              📚 Disimpan ${bookmarkedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </article>
    `;
  }

  #bindStoryCardEvents() {
    // Read story buttons
    document.querySelectorAll('.read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const storyId = e.currentTarget.dataset.storyId;
        window.location.hash = `#/story/${storyId}`;
      });
    });

    // Bookmark buttons
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const storyId = e.currentTarget.dataset.storyId;
        const storyCard = e.currentTarget.closest('.story-card');
        
        // Get story data from card
        const story = {
          id: storyId,
          name: storyCard.querySelector('.author-name').textContent,
          description: storyCard.querySelector('.story-description').textContent,
          photoUrl: storyCard.querySelector('.story-image').src,
          createdAt: storyCard.querySelector('.story-date').getAttribute('datetime')
        };
        
        await this.#presenter.toggleBookmark(story);
        
        // Remove from grid if unbookmarked
        if (!btn.classList.contains('bookmarked')) {
          storyCard.remove();
          // Reload to update count and check if empty
          await this.#presenter.loadBookmarkedStories();
        }
      });
    });
  }
}