import Database from '../data/database.js';
import { addStory } from '../data/api.js';
import { base64ToFile } from './index.js'; // Import fungsi yang benar

class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.isOnline = true;
      this.syncOfflineStories();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.isOnline = false;
    });
  }

  async syncOfflineStories() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    console.log('Starting sync of offline stories...');

    try {
      const unsyncedStories = await Database.getUnsyncedStories();
      console.log(`Found ${unsyncedStories.length} unsynced stories`);
      
      let syncedCount = 0;

      for (const story of unsyncedStories) {
        try {
          // Convert base64 photo back to File object for API - gunakan fungsi yang benar
          const photoFile = await base64ToFile(story.photo, 'story-photo.jpg');
          
          const response = await addStory(story.description, photoFile, story.lat, story.lon);
          
          // Mark as synced - perbaiki response handling
          await Database.markStorySynced(story.tempId, response.data?.story?.id || response.story?.id);
          console.log(`Synced story: ${story.tempId}`);
          syncedCount++;

          // Dispatch event for UI updates
          window.dispatchEvent(new CustomEvent('storySynced', {
            detail: { tempId: story.tempId, serverStory: response.data?.story || response.story }
          }));

        } catch (error) {
          console.error(`Failed to sync story ${story.tempId}:`, error);
        }
      }

      // Dispatch sync complete event dengan count yang benar
      window.dispatchEvent(new CustomEvent('syncComplete', {
        detail: { syncedCount }
      }));

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Hapus method base64ToFile yang duplikat
  // base64ToFile sudah diimport dari utils/index.js

  getConnectionStatus() {
    return this.isOnline;
  }
}

// Singleton instance
const syncManager = new SyncManager();
export default syncManager;