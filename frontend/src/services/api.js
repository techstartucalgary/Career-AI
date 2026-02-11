const resolveApiBaseUrl = () => {
  try {
    // Check for Expo environment variable
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_API_BASE_URL;
    }
  } catch (e) {
    console.log('Environment variable not available, using default');
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = 'career_ai_token';

// Memory fallback for environments without localStorage
let memoryToken = null;

export const setAuthToken = (token) => {
  memoryToken = token;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    console.log('localStorage not available, using memory storage');
  }
};

export const getAuthToken = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(TOKEN_KEY) || memoryToken;
    }
  } catch (e) {
    console.log('localStorage not available, using memory storage');
  }
  return memoryToken;
};

export const clearAuthToken = () => {
  memoryToken = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.log('localStorage not available');
  }
};

export const apiFetch = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && data.message ? data.message : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};
