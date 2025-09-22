import Database from '../data/database.js';
import { addStory } from '../data/api.js';
import { base64ToFile } from '../utils/index.js';
import syncManager from '../utils/sync-manager.js';

export default class OfflineStoriesPresenter {
  #view;

  constructor({ view }) {
    this.#view = view;
  }

  async getOfflineStories() {
    try {
      const stories = await Database.getOfflineStories();
      return stories.map(story => ({
        ...story,
        location: this.#getLocationFromCoordinates(story.lat, story.lon)
      }));
    } catch (error) {
      console.error('Error getting offline stories:', error);
      throw error;
    }
  }

  async syncAllStories() {
    this.#view.showSyncProgress();
    try {
      await syncManager.syncOfflineStories();
      return { success: true };
    } catch (error) {
      console.error('Sync all failed:', error);
      this.#view.hideSyncProgress();
      throw error;
    }
  }

  async syncSingleStory(story) {
    try {
      // If story is passed directly, use it. Otherwise find by tempId
      let targetStory = story;
      if (typeof story === 'string') {
        const stories = await Database.getOfflineStories();
        targetStory = stories.find(s => s.tempId === story);
        if (!targetStory || targetStory.synced) {
          throw new Error('Story not found or already synced');
        }
      }

      // Validate base64 photo data
      if (!targetStory.photo || !targetStory.photo.startsWith('data:')) {
        throw new Error('Invalid photo data format');
      }

      // Convert base64 photo back to File object for API
      const photoFile = await base64ToFile(targetStory.photo, 'story-photo.jpg');
      
      // Validate file size (optional, but good practice)
      if (photoFile.size === 0) {
        throw new Error('Photo file is empty');
      }
      
      const response = await addStory(targetStory.description, photoFile, targetStory.lat, targetStory.lon);
      
      // Perbaiki response handling
      if (response && (response.error === false || response.success !== false)) {
        // Mark as synced
        await Database.markStorySynced(targetStory.tempId, response.data?.story?.id || response.story?.id);
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('storySynced', {
          detail: { tempId: targetStory.tempId, serverStory: response.data?.story || response.story }
        }));
        
        return { success: true, story: response.data?.story || response.story };
      } else {
        throw new Error(response.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Single story sync failed:', error);
      throw error;
    }
  }

  async deleteOfflineStory(tempId) {
    try {
      await Database.removeOfflineStory(tempId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting offline story:', error);
      throw error;
    }
  }

  #getLocationFromCoordinates(lat, lon) {
    if (!lat || !lon) return 'Lokasi tidak diketahui';
    
    // Ensure lat and lon are numbers
    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lon === 'string' ? parseFloat(lon) : lon;
    
    // Check if conversion was successful
    if (isNaN(latitude) || isNaN(longitude)) {
      return 'Lokasi tidak valid';
    }
    
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}