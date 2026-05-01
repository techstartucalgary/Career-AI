import { apiFetch, getAuthToken, API_BASE_URL } from './api';

export const getShowcaseStatus = () => apiFetch('/api/showcase/status');

export const showcaseWarmup = () =>
  apiFetch('/api/showcase/warmup', { method: 'POST' });

export const runShowcaseCycle = () =>
  apiFetch('/api/showcase/run-cycle', { method: 'POST' });

export const endShowcaseCycle = () =>
  apiFetch('/api/showcase/end-cycle', { method: 'POST' });

export const checkShowcaseProfile = () =>
  apiFetch('/api/showcase/check-profile');

/**
 * Connect to the activity SSE stream for live showcase events.
 * Uses native EventSource API for reliable incremental event delivery.
 * Returns a cleanup function to close the connection.
 */
export const connectShowcaseStream = (onEvent) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/api/activity/stream?token=${encodeURIComponent(token)}`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onEvent) onEvent(data);
    } catch (err) {
      // skip malformed events
    }
  };

  es.onerror = (err) => {
    console.error('[showcase] SSE stream error:', err);
  };

  return () => es.close();
};
