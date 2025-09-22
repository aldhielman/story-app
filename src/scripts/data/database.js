import { openDB } from 'idb';
 
const DATABASE_NAME = 'story-app';
const DATABASE_VERSION = 1;
const BOOKMARKS_STORE = 'bookmarked-stories';
const OFFLINE_STORIES_STORE = 'offline-stories';
 
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database, oldVersion) => {
    // Create bookmarks store
    if (!database.objectStoreNames.contains(BOOKMARKS_STORE)) {
      database.createObjectStore(BOOKMARKS_STORE, {
        keyPath: 'id',
      });
    }
    
    // Create offline stories store
    if (!database.objectStoreNames.contains(OFFLINE_STORIES_STORE)) {
      const offlineStore = database.createObjectStore(OFFLINE_STORIES_STORE, {
        keyPath: 'tempId',
      });
      offlineStore.createIndex('synced', 'synced', { unique: false });
    }
  },
});

const Database = {
  // Bookmark methods
  async bookmarkStory(story) {
    if (!story.id) {
      throw new Error('Story ID is required to bookmark.');
    }
    const bookmarkedStory = {
      ...story,
      bookmarkedAt: new Date().toISOString()
    };
    return (await dbPromise).put(BOOKMARKS_STORE, bookmarkedStory);
  },

  async removeBookmark(storyId) {
    if (!storyId) {
      throw new Error('Story ID is required.');
    }
    return (await dbPromise).delete(BOOKMARKS_STORE, storyId);
  },

  async getBookmarkedStory(storyId) {
    if (!storyId) {
      throw new Error('Story ID is required.');
    }
    return (await dbPromise).get(BOOKMARKS_STORE, storyId);
  },

  async getAllBookmarkedStories() {
    return (await dbPromise).getAll(BOOKMARKS_STORE);
  },

  async isStoryBookmarked(storyId) {
    const story = await this.getBookmarkedStory(storyId);
    return !!story;
  },

  // Offline stories methods
  async saveOfflineStory(storyData) {
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineStory = {
      tempId,
      ...storyData,
      createdAt: new Date().toISOString(),
      synced: false
    };
    await (await dbPromise).put(OFFLINE_STORIES_STORE, offlineStory);
    return tempId;
  },

  async getOfflineStories() {
    return (await dbPromise).getAll(OFFLINE_STORIES_STORE);
  },

  async getUnsyncedStories() {
    const db = await dbPromise;
    const tx = db.transaction(OFFLINE_STORIES_STORE, 'readonly');
    const store = tx.objectStore(OFFLINE_STORIES_STORE);
    const allStories = await store.getAll();
    
    // Filter unsynced stories manually to avoid index key issues
    return allStories.filter(story => !story.synced);
  },

  async markStorySynced(tempId, serverId = null) {
    const db = await dbPromise;
    const story = await db.get(OFFLINE_STORIES_STORE, tempId);
    if (story) {
      story.synced = true;
      story.serverId = serverId;
      story.syncedAt = new Date().toISOString();
      await db.put(OFFLINE_STORIES_STORE, story);
    }
  },

  async removeOfflineStory(tempId) {
    return (await dbPromise).delete(OFFLINE_STORIES_STORE, tempId);
  }
};

export default Database;