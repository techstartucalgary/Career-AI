const DEFAULT_API_BASE = 'http://localhost:8000';

const resolveApiBaseUrl = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE_URL) {
      const raw = String(process.env.EXPO_PUBLIC_API_BASE_URL).trim();
      if (!raw) {
        return DEFAULT_API_BASE;
      }
      // Relative values (e.g. "/api") resolve against the Expo web origin and return 404 for /profile/avatar
      if (!/^https?:\/\//i.test(raw)) {
        console.warn(
          '[api] EXPO_PUBLIC_API_BASE_URL must be absolute, e.g. http://localhost:8000 — got:',
          raw,
          '— using',
          DEFAULT_API_BASE
        );
        return DEFAULT_API_BASE;
      }
      return raw.replace(/\/$/, '');
    }
  } catch (e) {
    console.log('Environment variable not available, using default');
  }
  return DEFAULT_API_BASE;
};

export const API_BASE_URL = resolveApiBaseUrl();

/** Absolute URL for an API path (path must start with /). */
export const apiUrl = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
};
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

  const response = await fetch(apiUrl(path), {
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
