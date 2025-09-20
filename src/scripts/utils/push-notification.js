import CONFIG from '../config.js';

class PushNotificationManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.isEnabled = localStorage.getItem('pushNotificationEnabled') === 'true';
    this.subscription = null;
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Get existing subscription
      this.subscription = await registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribe() {
    if (!this.isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY)
      });

      this.subscription = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      // Save enabled state
      localStorage.setItem('pushNotificationEnabled', 'true');
      this.isEnabled = true;
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  async unsubscribe() {
    if (!this.subscription) return true;

    try {
      // Unsubscribe from server
      await this.removeSubscriptionFromServer(this.subscription);
      
      // Unsubscribe locally
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      // Save disabled state
      localStorage.setItem('pushNotificationEnabled', 'false');
      this.isEnabled = false;
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    return response.json();
  }

  async removeSubscriptionFromServer(subscription) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription from server');
    }

    return response.json();
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  isNotificationEnabled() {
    return this.isEnabled && this.getPermissionStatus() === 'granted';
  }
}

export default PushNotificationManager;