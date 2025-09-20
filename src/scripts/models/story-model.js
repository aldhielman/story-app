import { getStories, getStoryDetail, addStory, addStoryGuest } from '../data/api.js';
import Map from '../utils/map.js';

class StoryModel {
  constructor() {
    this.stories = [];
    this.currentStory = null;
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

      // If locationFilter is provided, set location to 1 to get stories with coordinates
      // Otherwise use 0 to get all stories
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

  async createStory({description, photo, lat = null, lon = null}, useAuth = true) {
    try {
      let response;
      if (useAuth) {
        response = await addStory(description, photo, lat, lon);
      } else {
        response = await addStoryGuest(description, photo, lat, lon);
      }
      
      // Send push notification if enabled and authenticated
      if (useAuth && this.#shouldSendNotification()) {
        await this.#sendPushNotification(description);
      }
      
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  #shouldSendNotification() {
    const isEnabled = localStorage.getItem('pushNotificationEnabled') === 'true';
    const hasPermission = 'Notification' in window && Notification.permission === 'granted';
    return isEnabled && hasPermission;
  }

  async #sendPushNotification(description) {
    try {
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!currentUser) return;
  
      // Get latest stories to find the one created by current user
      const storiesResponse = await getStories(1, 10, 0);
      const latestUserStory = storiesResponse.listStory.find(story => 
        story.name === currentUser.name || story.userId === currentUser.userId
      );
  
      if (latestUserStory && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            data: {
              title: 'Story berhasil dibuat',
              options: {
                body: `${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
                icon: '/favicon.png',
                badge: '/favicon.png',
                data: {
                  url: `/#/story/${latestUserStory.id}`,
                  storyId: latestUserStory.id
                }
              }
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

export default StoryModel;