import { getAuthToken, API_BASE_URL } from './api';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Check if current user has GitHub connected. Returns { connected, username } */
export const getGithubStatus = async () => {
  const res = await fetch(`${API_BASE_URL}/api/github/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) return { connected: false, username: null };
  return res.json();
};

/**
 * Open the GitHub OAuth connect flow in a new tab.
 * The backend will redirect to GitHub, then back, then to the success page.
 */
export const openGithubConnect = () => {
  const token = getAuthToken();
  if (!token) {
    alert('Please log in first.');
    return;
  }
  const url = `${API_BASE_URL}/api/github/connect?token=${encodeURIComponent(token)}`;
  window.open(url, '_blank', 'width=600,height=700');
};

/**
 * Fetch the GitHub context string (plain text) ready to inject into resume tailor.
 * Will trigger repo analysis on first call (can take 30-90s).
 * Returns the context string, or null on failure.
 */
export const fetchGithubContext = async () => {
  // First try to get cached context
  const ctxRes = await fetch(`${API_BASE_URL}/api/github/context`, {
    headers: authHeaders(),
  });

  if (ctxRes.ok) {
    const data = await ctxRes.json();
    return data.context || null;
  }

  // If no cache yet (404/400), trigger a profile fetch first
  if (ctxRes.status === 400) {
    const profileRes = await fetch(`${API_BASE_URL}/api/github/profile`, {
      headers: authHeaders(),
    });
    if (!profileRes.ok) return null;

    // Now get context
    const ctxRes2 = await fetch(`${API_BASE_URL}/api/github/context`, {
      headers: authHeaders(),
    });
    if (!ctxRes2.ok) return null;
    const data2 = await ctxRes2.json();
    return data2.context || null;
  }

  return null;
};

/** Force re-fetch and re-analyze repos (ignores cache). */
export const refreshGithubProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/api/github/profile?force_refresh=true`, {
    headers: authHeaders(),
  });
  return res.ok;
};

/** Disconnect GitHub from account. */
export const disconnectGithub = async () => {
  const res = await fetch(`${API_BASE_URL}/api/github/disconnect`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return res.ok;
};
