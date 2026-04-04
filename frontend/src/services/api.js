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
const JOBS_CACHE_KEY = 'career_ai_jobs_cache';
const PROFILE_CACHE_KEY = 'career_ai_profile_cache';

// Memory fallback for environments without localStorage
let memoryToken = null;
let memoryProfileCache = null;
let memoryProfilePromise = null;

export const clearUserProfileCache = () => {
  memoryProfileCache = null;
  memoryProfilePromise = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch (_e) {
    // Ignore local cache issues and continue.
  }
};

export const setAuthToken = (token) => {
  clearUserProfileCache();
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
  clearUserProfileCache();
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

export const fetchLinkedInJobs = async ({
  keywords = [],
  location = '',
  page = 1,
  limit = 10,
  sources = ['linkedin', 'indeed'],
  includeDetails = true,
  jobTypes = [],
  preferredPositions = [],
  preferredLocations = [],
  minFitScore = 0,
  fitMode = 'broad',
  sortBy = 'match',
} = {}) => {
  const params = new URLSearchParams();

  if (Array.isArray(keywords)) {
    keywords
      .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
      .filter(Boolean)
      .forEach((keyword) => params.append('keywords', keyword));
  }

  params.set('location', typeof location === 'string' ? location.trim() : '');

  params.set('page', String(Math.max(1, Number(page) || 1)));
  params.set('limit', String(Math.max(1, Number(limit) || 1)));
  params.set('include_details', includeDetails ? 'true' : 'false');

  if (Array.isArray(sources)) {
    sources
      .map((source) => (typeof source === 'string' ? source.trim().toLowerCase() : ''))
      .filter(Boolean)
      .forEach((source) => params.append('sources', source));
  }

  if (Array.isArray(preferredPositions)) {
    preferredPositions
      .map((position) => (typeof position === 'string' ? position.trim() : ''))
      .filter(Boolean)
      .forEach((position) => params.append('preferred_positions', position));
  }

  if (Array.isArray(preferredLocations)) {
    preferredLocations
      .map((loc) => (typeof loc === 'string' ? loc.trim() : ''))
      .filter(Boolean)
      .forEach((loc) => params.append('preferred_locations', loc));
  }

  if (Array.isArray(jobTypes)) {
    jobTypes
      .map((jobType) => (typeof jobType === 'string' ? jobType.trim() : ''))
      .filter(Boolean)
      .forEach((jobType) => params.append('job_types', jobType));
  }

  params.set('min_fit_score', String(Math.max(0, Number(minFitScore) || 0)));
  const mode = String(fitMode || 'broad').toLowerCase();
  params.set('fit_mode', mode === 'strict' ? 'strict' : 'broad');
  const sort = String(sortBy || 'match').toLowerCase();
  const allowed = ['match', 'posted_newest', 'posted_oldest'];
  params.set('sort_by', allowed.includes(sort) ? sort : 'match');

  const query = params.toString();
  const path = query ? `/api/jobs?${query}` : '/api/jobs';
  return apiFetch(path, { method: 'GET' });
};

export const fetchAppliedJobs = async () => apiFetch('/applied-jobs', { method: 'GET' });

export const fetchSavedJobs = async () => apiFetch('/saved-jobs', { method: 'GET' });

export const recordAppliedJob = async (payload) =>
  apiFetch('/applied-jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const recordSavedJob = async (payload) =>
  apiFetch('/saved-jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const removeSavedJob = async (jobId, source = 'linkedin') => {
  const params = new URLSearchParams();
  params.set('source', String(source || 'linkedin').toLowerCase());
  return apiFetch(`/saved-jobs/${encodeURIComponent(String(jobId || '').trim())}?${params.toString()}`, {
    method: 'DELETE',
  });
};

export const recordJobSearchSignals = async ({ keywords = [], locations = [] }) =>
  apiFetch('/job-search-signals', {
    method: 'POST',
    body: JSON.stringify({ keywords, locations }),
  });

const readProfileCache = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (_e) {
    // Ignore local cache issues and continue with memory-only behavior.
  }
  return memoryProfileCache;
};

const writeProfileCache = (profileResponse) => {
  memoryProfileCache = profileResponse;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileResponse));
    }
  } catch (_e) {
    // Ignore local cache issues and continue.
  }
};

export const getUserProfile = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh) {
    const cached = readProfileCache();
    if (cached) {
      return cached;
    }

    if (memoryProfilePromise) {
      return memoryProfilePromise;
    }
  }

  const request = apiFetch('/profile');
  if (!forceRefresh) {
    memoryProfilePromise = request;
  }

  try {
    const response = await request;
    writeProfileCache(response);
    return response;
  } finally {
    if (!forceRefresh) {
      memoryProfilePromise = null;
    }
  }
};

const readJobsCache = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(JOBS_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    }
  } catch (_e) {
    // Ignore local cache issues and continue with memory-only behavior.
  }
  return {};
};

const writeJobsCache = (cache) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (_e) {
    // Ignore local cache issues and continue.
  }
};

export const cacheJobs = (jobs = []) => {
  if (!Array.isArray(jobs) || !jobs.length) return;

  const nextCache = readJobsCache();
  jobs.forEach((job) => {
    const id = job?.id;
    const source = (job?.source || 'linkedin').toLowerCase();
    if (!id) return;
    nextCache[`${source}:${id}`] = job;
  });
  writeJobsCache(nextCache);
};

export const getCachedJob = (id, source = 'linkedin') => {
  if (!id) return null;
  const cache = readJobsCache();
  return cache[`${String(source).toLowerCase()}:${id}`] || null;
};

export const fetchJobById = async (jobId, source = 'linkedin') => {
  const id = String(jobId || '').trim();
  if (!id) throw new Error('Missing job ID');

  const params = new URLSearchParams();
  if (source) params.set('source', String(source).toLowerCase());
  const path = `/api/jobs/${encodeURIComponent(id)}${params.toString() ? `?${params.toString()}` : ''}`;
  return apiFetch(path, { method: 'GET' });
};
