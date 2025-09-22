import { convertBase64ToUint8Array } from './index';
import CONFIG from '../config';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../data/api';

export function isNotificationAvailable() {
    return 'Notification' in window;
}

export function isNotificationGranted() {
    return Notification.permission === 'granted';
}

export async function getPushSubscription() {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.pushManager?.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
    return !!(await getPushSubscription());
}

export function generateSubscribeOptions(){
    return {
        userVisibleOnly: true,
        applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    };
}

export async function subscribe(){
    if(!(await requestNotificationPermission())){
        return false;
    }

    if(await isCurrentPushSubscriptionAvailable()){
        console.log('Already subscribed to notifications');
        return true;
    }

    console.log('Subscribing to push notifications...');

    let pushSubscription;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            console.error('No service worker registration found');
            return false;
        }
        
        pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

        const {endpoint, keys} = pushSubscription.toJSON();
        
        try {
            const response = await subscribeToNotifications({ endpoint, keys });
            console.log('Successfully subscribed to notifications');
            return true;
        } catch (serverError) {
            console.warn('Server subscription failed, but local subscription successful:', serverError);
            // Keep local subscription even if server fails
            return true;
        }

    } catch (error) {
        console.error('Error during subscription:', error);
        
        // Clean up failed subscription
        if (pushSubscription) {
            try {
                await pushSubscription.unsubscribe();
            } catch (unsubError) {
                console.error('Failed to clean up subscription:', unsubError);
            }
        }
        
        return false;
    }
}

export async function unsubscribe(){
    try{
        const pushSubscription = await getPushSubscription();

        if(!pushSubscription){
            console.log('No active subscription found');
            return true; // Already unsubscribed
        }

        const {endpoint, keys} = pushSubscription.toJSON();

        // Try to unsubscribe from server first
        try {
            await unsubscribeFromNotifications({endpoint});
            console.log('Successfully unsubscribed from server');
        } catch (serverError) {
            console.warn('Server unsubscription failed:', serverError);
            // Continue with local unsubscription even if server fails
        }

        // Unsubscribe locally
        const unsubscribed = await pushSubscription.unsubscribe();

        if(!unsubscribed){
            console.error('Failed to unsubscribe locally');
            return false;
        }
        
        console.log('Successfully unsubscribed from notifications');
        return true;
        
    } catch (error) {
        console.error('Error during unsubscription:', error);
        return false;
    }
}

export async function requestNotificationPermission() {
    if (!isNotificationAvailable()) {
        console.log('Notifications not supported in this browser.');
        return false;
    }

    if (isNotificationGranted()) {
      return true;
    }

    try {
        const status = await Notification.requestPermission();
        
        if(status === 'granted') {
            return true;
        }
        
        console.log('Notification permission denied or dismissed:', status);
        return false;
        
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}