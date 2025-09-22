import { getStories, getStoryDetail, addStory, addStoryGuest } from '../data/api.js';
import { fileToBase64, isServiceWorkerAvailable } from '../utils/index.js';
import Map from '../utils/map.js';
import { isNotificationAvailable, isNotificationGranted, isCurrentPushSubscriptionAvailable } from '../utils/notification-helper.js';
import Database from '../data/database.js';
import syncManager from '../utils/sync-manager.js';

export default class StoryModel {
  constructor() {
    this.stories = [];
    this.currentStory = null;
    this.bookmarkedStories = [];
    this.pagination = {
      page: 1,
      size: 10,
      hasMore: true
    };
  }

  async loadStories(page = 1, size = 10, locationFilter = '', reset = false) {
    try {
      if (reset) {
        this.stories = [];
        this.pagination.page = 1;
      }

      const location = locationFilter ? 1 : 0;
      const response = await getStories(page, size, location);
      
      // Add location names to stories with coordinates
      let storiesWithLocation = await Promise.all(response.listStory.map(async story => {
        if(story.lat && story.lon) {
          story.location = await Map.getPlaceNameByCoordinate(story.lat, story.lon);
        }
        return story;
      }));
      
      // Filter stories by location if locationFilter is provided
      if (locationFilter) {
        storiesWithLocation = storiesWithLocation.filter(story => {
          if (!story.location) return false;
          return story.location.toLowerCase().includes(locationFilter.toLowerCase());
        });
      }
      
      if (reset) {
        this.stories = storiesWithLocation;
      } else {
        this.stories = [...this.stories, ...storiesWithLocation];
      }
      
      this.pagination.page = page;
      this.pagination.hasMore = response.listStory.length === size && storiesWithLocation.length > 0;
      
      return { success: true, stories: this.stories };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async loadStoryDetail(id) {
    try {
      const response = await getStoryDetail(id);
      this.currentStory = response.story;
      
      // Add location name if coordinates exist
      if (this.currentStory.lat && this.currentStory.lon) {
        this.currentStory.location = await Map.getPlaceNameByCoordinate(
          this.currentStory.lat, 
          this.currentStory.lon
        );
      }
      
      return { success: true, story: this.currentStory };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Bookmark methods
  async bookmarkStory(story) {
    try {
      await Database.bookmarkStory(story);
      return { success: true, message: 'Story berhasil di-bookmark' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async removeBookmark(storyId) {
    try {
      await Database.removeBookmark(storyId);
      return { success: true, message: 'Bookmark berhasil dihapus' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async isStoryBookmarked(storyId) {
    return await Database.isStoryBookmarked(storyId);
  }

  async loadBookmarkedStories() {
    try {
      this.bookmarkedStories = await Database.getAllBookmarkedStories();
      return { success: true, stories: this.bookmarkedStories };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async createStory({description, photo, lat = null, lon = null}, useAuth = true) {
    try {
      if (syncManager.isOnline) { 
        try {
          let response;
          
          if (useAuth) {
            response = await addStory(description, photo, lat, lon);
          } else {
            response = await addStoryGuest(description, photo, lat, lon);
          }
          
          if (useAuth && await this.#shouldSendNotification()) {
            await this.#sendPushNotification(description);
          }
          
          return { success: true, message: response.message, online: true };
          
        } catch (apiError) {
          console.error('API call failed:', apiError);
          
          // If it's a network error, fall back to offline mode
          if (apiError.name === 'AbortError' || 
              apiError.name === 'TypeError' || 
              apiError.message.includes('fetch') ||
              apiError.message.includes('Failed to fetch')) {
            
            console.log('Network error detected, falling back to offline mode');
            // Update sync manager status
            syncManager.isOnline = false;
            
            // Fall through to offline logic
          } else {
            // Other API errors (auth, validation, etc.)
            throw apiError;
          }
        }
      }
      
      // Offline mode or API call failed
      if (!useAuth) {
        throw new Error('Tidak dapat membuat story sebagai guest saat offline');
      }

      console.log('Creating story in offline mode...');
      
      // Convert photo to base64 for storage
      const photoBase64 = await fileToBase64(photo);
      
      const tempId = await Database.saveOfflineStory({
        description,
        photo: photoBase64,
        lat,
        lon
      });

      console.log('Story saved offline with tempId:', tempId);

      return { 
        success: true, 
        message: 'Story disimpan offline. Akan disinkronkan saat online.', 
        tempId,
        online: false 
      };
      
    } catch (error) {
      console.error('Story creation failed:', error);
      return { success: false, message: error.message };
    }
  }

  async getOfflineStories() {
    try {
      const offlineStories = await Database.getOfflineStories();
      return { success: true, stories: offlineStories };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async #shouldSendNotification() {
    // Periksa apakah notifikasi tersedia, permission granted, DAN user masih subscribe
    return isNotificationAvailable() && 
           isNotificationGranted() && 
           await isCurrentPushSubscriptionAvailable();
  }

  async #sendPushNotification(description, photoFile = null) {
    try {
      
      // Get current user info - PERBAIKAN: definisikan currentUser
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!currentUser) {
        console.log('No current user found, skipping notification');
        return;
      }
  
      // Get latest stories to find the one created by current user
      const storiesResponse = await getStories(1, 10, 0);
      const latestUserStory = storiesResponse.listStory.find(story => 
        story.name === currentUser.name || story.userId === currentUser.userId
      );
  
      if (latestUserStory && isServiceWorkerAvailable()) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.active) {
          // Prepare notification options with story image
          const notificationOptions = {
            body: `${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`, // Perbaiki panjang body
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'story-created', // Use same tag to replace previous notifications
            requireInteraction: false,
            renotify: true, // Allow replacing previous notification
            data: {
              url: `#/story/${latestUserStory.id}`,
              storyId: latestUserStory.id,
              type: 'story_created'
            }
          };

          // Add story image if available
          if (latestUserStory.photoUrl) {
            notificationOptions.image = latestUserStory.photoUrl;
          }

          // Add action buttons
          notificationOptions.actions = [
            {
              action: 'view',
              title: 'Lihat Story',
              icon: '/favicon.png'
            },
            {
              action: 'close',
              title: 'Tutup',
              icon: '/favicon.png'
            }
          ];

          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            data: {
              title: '📸 Story Berhasil Dibuat!',
              options: notificationOptions
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  getStories() {
    return this.stories;
  }

  getCurrentStory() {
    return this.currentStory;
  }

  getPagination() {
    return this.pagination;
  }

  hasMoreStories() {
    return this.pagination.hasMore;
  }

  async loadMoreStories(locationFilter = '') {
    if (!this.hasMoreStories()) {
      return { success: false, message: 'No more stories to load' };
    }

    const nextPage = this.pagination.page + 1;
    return await this.loadStories(nextPage, this.pagination.size, locationFilter, false);
  }
}