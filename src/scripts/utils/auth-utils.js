import { getActiveRoute } from "../routes/url-parser";
import CONFIG from "../config.js";

export function getAccessToken() {
  try {
    const accessToken = localStorage.getItem(CONFIG.ACCESS_TOKEN_KEY);

    if (accessToken === 'null' || accessToken === 'undefined') {
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('getAccessToken: error:', error);
    return null;
  }
}

export function requireAuth(page) {
  const isLogin = !!getAccessToken();
  if (!isLogin) {
    // Use setTimeout to ensure redirect happens after current render cycle
    setTimeout(() => {
      location.hash = '/login';
    }, 0);
    return null;
  }
  return page;
}

const unauthenticatedRoutesOnly = ['/login', '/register'];

export function redirectIfAuthenticated(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  if (unauthenticatedRoutesOnly.includes(url) && isLogin) {
    location.hash = '/';
    return null;
  }

  return page;
}

export function getAuthHeader() {
  const token = getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}