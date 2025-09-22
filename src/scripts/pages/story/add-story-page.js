import StoryModel from '../../models/story-model.js';
import AddStoryPresenter from '../../presenters/add-story-presenter.js';
import Map from '../../utils/map.js';
import Camera from '../../utils/camera.js';

export default class AddStoryPage {
  
  #map;
  #camera;
  #presenter ;
  #form;
  #isCameraOpen
  #storyImage;

  constructor() {
    const storyModel = new StoryModel();
    this.#presenter = new AddStoryPresenter({storyModel, view: this});
    // Move sync listeners to view layer
    this.#setupSyncListeners();
  }

  #setupSyncListeners() {
    // Listen for connection changes
    window.addEventListener('online', () => {
      this.#updateConnectionStatus(true);
    });
    
    window.addEventListener('offline', () => {
      this.#updateConnectionStatus(false);
    });
    
    // Listen for sync events - now in view layer
    window.addEventListener('storySynced', (event) => {
      const { tempId, serverStory } = event.detail;
      this.showSyncMessage(`Story "${serverStory?.description?.substring(0, 30)}..." berhasil disinkronkan!`, 'success');
    });

    window.addEventListener('syncComplete', (event) => {
      const { syncedCount } = event.detail;
      if (syncedCount > 0) {
        this.showSyncMessage(`${syncedCount} story berhasil disinkronkan saat online!`, 'success');
      }
      this.#hideSyncStatus();
    });
  }

  async render() {
    return `
        <!-- Main Content dengan padding untuk sticky header -->
        <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <!-- Breadcrumb Navigation -->
          <nav class="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <a href="#/" class="hover:text-blue-600 transition-colors">Beranda</a>
            <span class="mx-2">›</span>
            <span class="text-gray-900 font-medium" aria-current="page">Tambah Cerita</span>
          </nav>
          
          <!-- Page Header -->
          <div class="text-center mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tambah Cerita Baru</h1>
            <p class="text-gray-600">Bagikan momen menarik Anda dengan dunia</p>
          </div>
          
          <form id="add-story-form" class="space-y-8" novalidate>
            <!-- Photo Upload Section -->
            <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <span class="text-2xl">📷</span>
                <span>Foto Cerita</span>
              </h2>
              
              <div class="space-y-4">
                <div id="photo-preview" class="relative rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200" style="display: none;">
                  <img id="preview-image" src="" alt="Preview foto cerita yang akan diunggah" class="w-full h-64 sm:h-80 object-cover">
                  <button type="button" id="remove-photo" class="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors group" aria-label="Hapus foto">
                    <span class="text-xl group-hover:scale-110 transition-transform">×</span>
                  </button>
                </div>
                
                <div id="photo-upload-placeholder" class="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl p-8 sm:p-12 text-center transition-colors group">
                  <div class="flex flex-col sm:flex-row gap-4 justify-center"> 
                    <button type="button" id="toggle-camera-btn" class="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                      <span>Buka Kamera</span>
                    </button>
                  </div>
                </div>
                
                <!-- Camera View -->
                <div id="camera-view" class="hidden bg-gray-900 rounded-2xl overflow-hidden">
                  <div class="relative">
                    <video id="camera-video" class="w-full h-64 sm:h-80 object-cover" autoplay muted></video>
                    <canvas id="camera-canvas" class="hidden"></canvas>
                    
                    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                      <button type="button" id="camera-take-button" class="bg-white hover:bg-gray-100 text-gray-900 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors">
                        <span class="text-2xl">📸</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div id="photo-error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" style="display: none;" role="alert"></div>
            </section>
            
            <!-- Description Section -->
            <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <span class="text-2xl">✍️</span>
                <span>Deskripsi</span>
              </h2>
            
            <div class="space-y-4">
              <label for="story-description" class="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Cerita *
              </label>
              <textarea 
                id="story-description" 
                name="description"
                placeholder="Ceritakan momen menarik Anda..."
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                rows="4"
                maxlength="500"
                required
                aria-describedby="char-count description-error"
              ></textarea>
              <div class="flex justify-between items-center text-sm">
                <span id="char-count" class="text-gray-500">0/500</span>
              </div>
              <div id="description-error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" style="display: none;" role="alert"></div>
            </div>
          </section>
          
          <!-- Location Section -->
          <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <span class="text-2xl">📍</span>
              <span>Lokasi</span>
            </h2>
            
            <div class="space-y-4">
              <div class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="include-location" 
                  class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                >
                <label for="include-location" class="text-gray-700 font-medium cursor-pointer">
                  Sertakan lokasi dalam cerita
                </label>
              </div>
              
              <div id="location-section" class="hidden space-y-4">
                <div id="location-map" class="h-48 sm:h-64 rounded-xl border border-gray-200"></div>
                <div id="selected-location" class="text-sm text-gray-600"></div>
                
                <div id="location-loading" class="hidden flex items-center justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span class="ml-2 text-gray-600">Memuat peta...</span>
                </div>
                
                <div id="location-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p class="mb-2">Gagal memuat peta. Periksa koneksi internet Anda.</p>
                  <button id="retry-location" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Coba Lagi
                  </button>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label for="latitude" class="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      id="latitude"
                      name="latitude"
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-sm"
                      disabled
                      readonly
                    />
                  </div>
                  <div>
                    <label for="longitude" class="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      id="longitude" 
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-sm"
                      disabled
                      readonly
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Submit Section -->
          <section class="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end pt-4">
            <button 
              type="button" 
              id="cancel-btn" 
              class="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:ring-2 focus:ring-gray-300 focus:outline-none"
            >
              Batal
            </button>
            <button 
              type="submit" 
              class="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Bagikan Cerita
            </button>
          </section>
        </form>
      </main>
      
      <!-- Toast Container -->
      <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>
    </div>
  `;
  }

  #updateConnectionStatus(isOnline) {
    const statusBanner = document.getElementById('connection-status');
    const statusIcon = document.getElementById('connection-icon');
    const statusText = document.getElementById('connection-text');
    const offlineNotice = document.getElementById('offline-notice');
    
    if (!statusBanner || !statusIcon || !statusText) return;
    
    if (isOnline) {
      statusBanner.className = 'mb-4 p-3 rounded-lg border bg-green-50 border-green-200';
      statusIcon.textContent = '🟢';
      statusText.textContent = 'Terhubung ke internet';
      statusText.className = 'text-sm font-medium text-green-800';
      
      if (offlineNotice) {
        offlineNotice.classList.add('hidden');
      }
      
      // Hide after 3 seconds
      setTimeout(() => {
        statusBanner.classList.add('hidden');
      }, 3000);
      
      // Show sync status if syncing
      this.#showSyncStatus();
    } else {
      statusBanner.className = 'mb-4 p-3 rounded-lg border bg-amber-50 border-amber-200';
      statusIcon.textContent = '🔴';
      statusText.textContent = 'offline';
      statusText.className = 'text-sm font-medium text-amber-800';
      statusBanner.classList.remove('hidden');
      
      if (offlineNotice) {
        offlineNotice.classList.remove('hidden');
      }
    }
  }

  #showSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
      syncStatus.classList.remove('hidden');
    }
  }

  #hideSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
      syncStatus.classList.add('hidden');
    }
  }

  showSyncMessage(message, type = 'info') {
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
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  showOfflineMessage(message) {
    this.showSyncMessage(message, 'info');
    setTimeout(() => {
      window.location.hash = '#/offline-stories';
    }, 1500);
  }

  showOfflineIndicator() {
    const offlineNotice = document.getElementById('offline-notice');
    if (offlineNotice) {
      offlineNotice.classList.remove('hidden');
    }
  }

  afterRender() {
    this.#setupForm();
    // Initialize connection status
    this.#updateConnectionStatus(navigator.onLine);
  }

  #setupForm() {
    
    this.#form = document.getElementById('add-story-form');
    if (this.#form) {
      this.#form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Validasi form
        const description = this.#form.elements['description'].value.trim();
        if (!description) {
          this.showErrorMessage('Deskripsi cerita harus diisi');
          return;
        }
        
        if (!this.#storyImage) {
          this.showErrorMessage('Foto cerita harus diambil');
          return;
        }
        
        const lat = this.#form.elements['latitude'].value;
        const lon = this.#form.elements['longitude'].value;
        
        // Disable submit button saat proses
        const submitBtn = this.#form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengunggah...';
        this.#presenter.handleFormSubmit({
          description, 
          photo: this.#storyImage, 
          lat: lat || null, 
          lon: lon || null
        });
      });
    }

    // Event listener untuk tombol Batal
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin membatalkan? Semua data akan hilang.')) {
          this.resetForm();
          window.location.hash = '#/';
        }
      });
    }

    // Event listener untuk tombol Kembali
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin kembali? Semua data akan hilang.')) {
          this.resetForm();
          window.location.hash = '#/';
        }
      });
    }

    // Event listener untuk tombol toggle kamera
    const cameraContainer = document.getElementById('camera-view');
    document.getElementById('toggle-camera-btn').addEventListener('click', (event) => {
      cameraContainer.classList.toggle('hidden');

      this.#isCameraOpen = !cameraContainer.classList.contains('hidden');
      if(this.#isCameraOpen){
        event.currentTarget.textContent = 'Tutup Kamera';
        this.#setupCamera();
        this.#camera.launch();
        
        return
      }

      event.currentTarget.textContent = 'Buka Kamera';
      this.#camera.stop();
    });

    // Event listener untuk tombol hapus foto (silang)
    document.getElementById('remove-photo').addEventListener('click', () => {
      this.#removePhoto();
    });

    // Event listener untuk checkbox location
    const locationCheckbox = document.getElementById('include-location');
    const locationSection = document.getElementById('location-section');
    
    locationCheckbox.addEventListener('change', async (event) => {
      if (event.target.checked) {
        // Show location section and initialize map
        locationSection.classList.remove('hidden');
        document.getElementById('location-loading').classList.remove('hidden');
        
        try {
          await this.#initializeMap();
          document.getElementById('location-loading').classList.add('hidden');
        } catch (error) {
          console.error('Error initializing map:', error);
          document.getElementById('location-loading').classList.add('hidden');
          document.getElementById('location-error').style.display = 'block';
        }
      } else {
        // Hide location section and cleanup map
        locationSection.classList.add('hidden');
        this.#cleanupMap();
      }
    });

    // Event listener untuk retry location button
    const retryLocationBtn = document.getElementById('retry-location');
    if (retryLocationBtn) {
      retryLocationBtn.addEventListener('click', async () => {
        document.getElementById('location-error').style.display = 'none';
        document.getElementById('location-loading').classList.remove('hidden');
        
        try {
          await this.#initializeMap();
          document.getElementById('location-loading').classList.add('hidden');
        } catch (error) {
          console.error('Error retrying map:', error);
          document.getElementById('location-loading').classList.add('hidden');
          document.getElementById('location-error').style.display = 'block';
        }
      });
    }

    // Character counter untuk deskripsi
    const descriptionTextarea = document.getElementById('story-description');
    const charCount = document.getElementById('char-count');
    
    if (descriptionTextarea && charCount) {
      descriptionTextarea.addEventListener('input', (e) => {
        const length = e.target.value.length;
        charCount.textContent = `${length}/500`;
        
        if (length > 450) {
          charCount.classList.add('text-red-500');
        } else {
          charCount.classList.remove('text-red-500');
        }
      });
    }
  }

  async #initializeMap() {
    // Cleanup existing map if any
    this.#cleanupMap();
    
    this.#map = await Map.build('#location-map', {
      zoom: 15,
      locate: true,
    });

     // Preparing marker for select coordinate
    const centerCoordinate = this.#map.getCenter();
    this.#updateLatLngInput(centerCoordinate.latitude, centerCoordinate.longitude);
    const draggableMarker = this.#map.addMarker(
      [centerCoordinate.latitude, centerCoordinate.longitude],
      { draggable: 'true' },
    );
    
    draggableMarker.addEventListener('move', (event) => {
      const coordinate = event.target.getLatLng();
      this.#updateLatLngInput(coordinate.lat, coordinate.lng);
    });

    this.#map.addMapEventListener('click', (event) => {
      draggableMarker.setLatLng(event.latlng);
 
      // Keep center with user view
      event.sourceTarget.flyTo(event.latlng);
    });
  }

  #cleanupMap() {
    if (this.#map ) {
      this.#map = null;
      
      // Clear coordinate inputs
      const latInput = document.getElementById('latitude');
      const lngInput = document.getElementById('longitude');
      if (latInput) latInput.value = '';
      if (lngInput) lngInput.value = '';
    }
  }

  #removePhoto() {
    const previewImage = document.getElementById('preview-image');
    const photoPreview = document.getElementById('photo-preview');
    const photoUploadPlaceholder = document.getElementById('photo-upload-placeholder');
    
    // Clean up blob URL to prevent memory leak
    if (previewImage.src && previewImage.src.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage.src);
    }
    
    // Reset preview elements
    previewImage.src = '';
    photoPreview.style.display = 'none';
    photoUploadPlaceholder.style.display = 'block';
    
    // Reset stored image data
    this.#storyImage = null;
    
    // Reset camera button text if camera is open
    if (this.#isCameraOpen) {
      document.getElementById('toggle-camera-btn').textContent = 'Buka Kamera';
      document.getElementById('camera-view').classList.add('hidden');
      if (this.#camera) {
        this.#camera.stop();
      }
      this.#isCameraOpen = false;
    }
  }

  #setupCamera() {
    if (this.#camera) {
      return;
    }

    this.#camera = new Camera({
      video: document.getElementById('camera-video'),
      canvas: document.getElementById('camera-canvas'),
    });

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const imageBlob = await this.#camera.takePicture();
      if (imageBlob) {
        // Konversi Blob ke File object dengan nama dan timestamp
        const timestamp = new Date().getTime();
        const fileName = `camera-photo-${timestamp}.jpg`;
        const imageFile = new File([imageBlob], fileName, {
          type: 'image/jpeg',
          lastModified: timestamp
        });
        
        this.#storyImage = imageFile; // Simpan sebagai File object
        
        // Convert Blob to URL for preview
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Show preview of captured image
        const previewImage = document.getElementById('preview-image');
        const photoPreview = document.getElementById('photo-preview');
        const photoUploadPlaceholder = document.getElementById('photo-upload-placeholder');
        const cameraView = document.getElementById('camera-view');
        
        // Clean up previous URL if exists
        if (previewImage.src && previewImage.src.startsWith('blob:')) {
          URL.revokeObjectURL(previewImage.src);
        }
        
        previewImage.src = imageUrl;
        photoPreview.style.display = 'block';
        photoUploadPlaceholder.style.display = 'none';
        cameraView.classList.add('hidden');
        
        // Reset camera button text
        document.getElementById('toggle-camera-btn').textContent = 'Buka Kamera';
        this.#camera.stop();
        this.#isCameraOpen = false;
      }
    });
  }

  #updateLatLngInput(latitude, longitude) {
    document.getElementById('latitude').value = latitude;
    document.getElementById('longitude').value = longitude;
  }

  showSuccessMessage(message) {
    this.showToast(message, 'success');
    
    // Reset submit button
    const submitBtn = this.#form?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Bagikan Cerita';
    }
    
    // Redirect to story list after successful creation
    setTimeout(() => {
      window.location.hash = '#/story';
    }, 1500);
  }

  showErrorMessage(message) {
    this.showToast(message, 'error');
    
    // Reset submit button
    const submitBtn = this.#form?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Bagikan Cerita';
    }
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  resetForm() {
    // Reset form
    if (this.#form) {
      this.#form.reset();
    }
    
    // Reset photo
    this.#removePhoto();
    
    // Reset location
    const locationCheckbox = document.getElementById('include-location');
    if (locationCheckbox) {
      locationCheckbox.checked = false;
      document.getElementById('location-section').classList.add('hidden');
    }
    this.#cleanupMap();
    
    // Reset camera
    if (this.#isCameraOpen) {
      this.#camera?.stop();
      document.getElementById('camera-view').classList.add('hidden');
      document.getElementById('toggle-camera-btn').textContent = 'Buka Kamera';
      this.#isCameraOpen = false;
    }
    
    // Reset character count
    const charCount = document.getElementById('char-count');
    if (charCount) {
      charCount.textContent = '0/500';
      charCount.classList.remove('text-red-500');
    }
  }
}