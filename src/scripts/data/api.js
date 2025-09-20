import CONFIG from '../config.js';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  NOTIFICATIONS_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
  NOTIFICATIONS_UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`
};

// Auth API
export async function register(name, email, password) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function login(email, password) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

// Stories API
export async function getStories(page = 1, size = 10, location = 0) {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams({ page, size, location });
  
  const response = await fetch(`${ENDPOINTS.STORIES}?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch stories');
  }
  return data;
}

export async function getStoryDetail(id) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch story detail');
  }
  return data;
}

export async function addStory(description, photo, lat = null, lon = null) {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  
  if (lat !== null && lon !== null) {
    formData.append('lat', lat);
    formData.append('lon', lon);
  }

  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add story');
  }
  return data;
}

export async function addStoryGuest(description, photo, lat = null, lon = null) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  
  if (lat !== null && lon !== null) {
    formData.append('lat', lat);
    formData.append('lon', lon);
  }

  const response = await fetch(ENDPOINTS.STORIES_GUEST, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add story');
  }
  return data;
}

export async function subscribeToNotifications(subscription) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(subscription)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to subscribe to notifications');
  }
  return data;
}

export async function unsubscribeFromNotifications(endpoint) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(ENDPOINTS.NOTIFICATIONS_UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ endpoint })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to unsubscribe from notifications');
  }
  return data;
}