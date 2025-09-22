import Database from '../../data/database.js';
import syncManager from '../../utils/sync-manager.js';
import OfflineStoriesPresenter from '../../presenters/offline-stories-presenter.js';

export default class OfflineStoriesPage {
  #presenter;

  constructor() {
    this.#presenter = new OfflineStoriesPresenter({ view: this });
    this.#setupSyncListeners();
  }

  #setupSyncListeners() {
    // Listen for connection changes
    window.addEventListener('online', () => {
      this.#updateConnectionStatus(true);
      this.#updateSyncButtons(true);
    });
    
    window.addEventListener('offline', () => {
      this.#updateConnectionStatus(false);
      this.#updateSyncButtons(false);
    });
    
    // Listen for sync events
    window.addEventListener('storySynced', (event) => {
      const { tempId, serverStory } = event.detail;
      this.#updateStoryStatus(tempId, 'synced', serverStory);
      this.showMessage(`Story berhasil disinkronkan!`, 'success');
    });

    window.addEventListener('syncComplete', (event) => {
      const { syncedCount } = event.detail;
      if (syncedCount > 0) {
        this.showMessage(`${syncedCount} story berhasil disinkronkan!`, 'success');
        this.#refreshStoryList();
      }
      this.#hideSyncProgress();
    });
  }

  async render() {
    return `
      <div class="offline-stories-container min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <!-- Main Content -->
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <!-- Breadcrumb Navigation -->
          <nav class="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <a href="#/" class="hover:text-blue-600 transition-colors">Beranda</a>
            <span class="mx-2">›</span>
            <span class="text-gray-900 font-medium" aria-current="page">Story Offline</span>
          </nav>

          <!-- Page Header -->
          <div class="text-center mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Story Offline</h1>
            <p class="text-gray-600">Kelola story yang tersimpan offline dan menunggu sinkronisasi</p>
          </div>

          <!-- Connection Status -->
          <div id="connection-banner" class="mb-6 p-4 rounded-lg border">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span id="connection-icon" class="text-2xl"></span>
                <div>
                  <p id="connection-status" class="font-medium"></p>
                  <p id="connection-description" class="text-sm text-gray-600"></p>
                </div>
              </div>
              <button id="sync-all-btn" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      disabled>
                <span class="flex items-center space-x-2">
                  <span id="sync-icon">🔄</span>
                  <span>Sync Semua</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Sync Progress -->
          <div id="sync-progress" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg hidden">
            <div class="flex items-center space-x-3">
              <div class="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span class="text-blue-800 font-medium">Menyinkronkan story...</span>
            </div>
          </div>

          <!-- Stories Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <!-- Section Header -->
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Story Menunggu Sinkronisasi</h2>
                <span id="story-count" class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">0 story</span>
              </div>
            </div>

            <!-- Stories List -->
            <div id="stories-container">
              <!-- Loading State -->
              <div id="loading-state" class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                  <p class="text-gray-600">Memuat story offline...</p>
                </div>
              </div>

              <!-- Stories Grid -->
              <div id="stories-grid" class="hidden p-6 space-y-4">
                <!-- Stories will be populated here -->
              </div>

              <!-- Empty State -->
              <div id="empty-state" class="hidden text-center py-12">
                <div class="text-6xl mb-4">📱</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Story Offline</h3>
                <p class="text-gray-600 mb-6">Semua story Anda sudah tersinkronisasi atau belum ada story offline.</p>
                <a href="#/add-story" class="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <span>📝</span>
                  <span>Tambah Story Baru</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">⏳</span>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Menunggu Sync</p>
                  <p id="pending-count" class="text-2xl font-bold text-amber-600">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">✅</span>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Tersinkronisasi</p>
                  <p id="synced-count" class="text-2xl font-bold text-green-600">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">📊</span>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Total Offline</p>
                  <p id="total-count" class="text-2xl font-bold text-blue-600">0</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  async afterRender() {
    this.#setupEventListeners();
    this.#updateConnectionStatus(navigator.onLine);
    this.#updateSyncButtons(navigator.onLine);
    await this.#loadOfflineStories();
  }

  #setupEventListeners() {
    const syncAllBtn = document.getElementById('sync-all-btn');
    if (syncAllBtn) {
      syncAllBtn.addEventListener('click', () => {
        this.#handleSyncAll();
      });
    }
  }

  async #loadOfflineStories() {
    try {
      const stories = await this.#presenter.getOfflineStories();
      this.displayStories(stories);
      this.#updateStatistics(stories);
    } catch (error) {
      console.error('Error loading offline stories:', error);
      this.showMessage('Gagal memuat story offline', 'error');
    }
  }

  displayStories(stories) {
    const loadingState = document.getElementById('loading-state');
    const storiesGrid = document.getElementById('stories-grid');
    const emptyState = document.getElementById('empty-state');
    const storyCount = document.getElementById('story-count');

    // Hide loading
    if (loadingState) loadingState.classList.add('hidden');

    if (stories.length === 0) {
      if (storiesGrid) storiesGrid.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      if (storyCount) storyCount.textContent = '0 story';
      return;
    }

    // Show stories
    if (emptyState) emptyState.classList.add('hidden');
    if (storiesGrid) {
      storiesGrid.classList.remove('hidden');
      storiesGrid.innerHTML = '';
      
      stories.forEach(story => {
        const storyElement = this.#createStoryElement(story);
        storiesGrid.appendChild(storyElement);
      });
    }

    if (storyCount) {
      storyCount.textContent = `${stories.length} story`;
    }
  }

  #createStoryElement(story) {
    const storyElement = document.createElement('div');
    storyElement.className = 'story-item bg-gray-50 rounded-lg p-4 border border-gray-200';
    storyElement.dataset.tempId = story.tempId;

    const statusBadge = story.synced 
      ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>Tersinkronisasi</span>'
      : '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><span class="w-2 h-2 bg-amber-400 rounded-full mr-1 animate-pulse"></span>Menunggu sync</span>';

    storyElement.innerHTML = `
      <div class="flex items-start space-x-4">
        <!-- Photo Preview -->
        <div class="flex-shrink-0">
          <img src="${story.photo}" alt="Story preview" class="w-16 h-16 object-cover rounded-lg">
        </div>
        
        <!-- Story Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">${story.description}</p>
              <p class="text-xs text-gray-500 mt-1">📍 ${story.location || 'Lokasi tidak diketahui'}</p>
              <p class="text-xs text-gray-400 mt-1">📅 ${new Date(story.createdAt).toLocaleString('id-ID')}</p>
            </div>
            <div class="flex items-center space-x-2 ml-4">
              ${statusBadge}
              ${!story.synced ? `
                <button class="sync-single-btn px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" 
                        data-temp-id="${story.tempId}" 
                        ${!navigator.onLine ? 'disabled' : ''}>
                  Sync
                </button>
              ` : ''}
              <button class="delete-btn px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors" 
                      data-temp-id="${story.tempId}">
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const syncBtn = storyElement.querySelector('.sync-single-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        this.#handleSyncSingle(story.tempId);
      });
    }

    const deleteBtn = storyElement.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.#handleDelete(story.tempId);
      });
    }

    return storyElement;
  }

  #updateConnectionStatus(isOnline) {
    const banner = document.getElementById('connection-banner');
    const icon = document.getElementById('connection-icon');
    const status = document.getElementById('connection-status');
    const description = document.getElementById('connection-description');

    if (!banner || !icon || !status || !description) return;

    if (isOnline) {
      banner.className = 'mb-6 p-4 rounded-lg border bg-green-50 border-green-200';
      icon.textContent = '🟢';
      status.textContent = 'Online';
      status.className = 'font-medium text-green-800';
      description.textContent = 'Terhubung ke internet. Story dapat disinkronisasi.';
    } else {
      banner.className = 'mb-6 p-4 rounded-lg border bg-amber-50 border-amber-200';
      icon.textContent = '🔴';
      status.textContent = 'Offline';
      status.className = 'font-medium text-amber-800';
      description.textContent = 'Tidak terhubung ke internet. Sync akan dilakukan saat online.';
    }
  }

  #updateSyncButtons(isOnline) {
    const syncAllBtn = document.getElementById('sync-all-btn');
    const syncSingleBtns = document.querySelectorAll('.sync-single-btn');

    if (syncAllBtn) {
      syncAllBtn.disabled = !isOnline;
    }

    syncSingleBtns.forEach(btn => {
      btn.disabled = !isOnline;
    });
  }

  async #handleSyncAll() {
    this.#showSyncProgress();
    try {
      await syncManager.syncOfflineStories();
    } catch (error) {
      console.error('Sync all failed:', error);
      this.showMessage('Gagal menyinkronkan story', 'error');
      this.#hideSyncProgress();
    }
  }

  async #handleSyncSingle(tempId) {
    try {
      await this.#presenter.syncSingleStory(tempId);
    } catch (error) {
      console.error('Single sync failed:', error);
      this.showMessage('Gagal menyinkronkan story', 'error');
    }
  }

  async #handleDelete(tempId) {
    if (confirm('Apakah Anda yakin ingin menghapus story offline ini?')) {
      try {
        await this.#presenter.deleteOfflineStory(tempId);
        this.showMessage('Story berhasil dihapus', 'success');
        await this.#refreshStoryList();
      } catch (error) {
        console.error('Delete failed:', error);
        this.showMessage('Gagal menghapus story', 'error');
      }
    }
  }

  #updateStoryStatus(tempId, status, serverStory = null) {
    const storyElement = document.querySelector(`[data-temp-id="${tempId}"]`);
    if (storyElement) {
      const badge = storyElement.querySelector('.inline-flex.items-center');
      const syncBtn = storyElement.querySelector('.sync-single-btn');
      
      if (status === 'synced' && badge) {
        badge.innerHTML = '<span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>Tersinkronisasi';
        badge.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
        
        if (syncBtn) {
          syncBtn.remove();
        }
      }
    }
  }

  #updateStatistics(stories) {
    const pendingCount = stories.filter(s => !s.synced).length;
    const syncedCount = stories.filter(s => s.synced).length;
    const totalCount = stories.length;

    const pendingEl = document.getElementById('pending-count');
    const syncedEl = document.getElementById('synced-count');
    const totalEl = document.getElementById('total-count');

    if (pendingEl) pendingEl.textContent = pendingCount;
    if (syncedEl) syncedEl.textContent = syncedCount;
    if (totalEl) totalEl.textContent = totalCount;
  }

  #showSyncProgress() {
    const progress = document.getElementById('sync-progress');
    if (progress) {
      progress.classList.remove('hidden');
    }
  }

  #hideSyncProgress() {
    const progress = document.getElementById('sync-progress');
    if (progress) {
      progress.classList.add('hidden');
    }
  }

  async #refreshStoryList() {
    await this.#loadOfflineStories();
  }

  showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 transform translate-x-full`;
    
    switch (type) {
      case 'success':
        toast.classList.add('bg-green-500');
        break;
      case 'error':
        toast.classList.add('bg-red-500');
        break;
      default:
        toast.classList.add('bg-blue-500');
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
}