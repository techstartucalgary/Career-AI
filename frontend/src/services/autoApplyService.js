import { apiFetch, getAuthToken, API_BASE_URL } from './api';

// Settings
export const getAutoApplySettings = () => apiFetch('/api/auto-apply/settings');
export const updateAutoApplySettings = (data) =>
  apiFetch('/api/auto-apply/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Pipeline
export const getPipeline = () => apiFetch('/api/auto-apply/pipeline');
export const updatePipelineStatus = (jobId, status) =>
  apiFetch(`/api/auto-apply/pipeline/${encodeURIComponent(jobId)}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
export const removeFromPipeline = (jobId) =>
  apiFetch(`/api/auto-apply/pipeline/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
  });

// Matches
export const getMatches = () => apiFetch('/api/auto-apply/matches');
export const saveMatch = (jobId, jobData) =>
  apiFetch(`/api/auto-apply/matches/${encodeURIComponent(jobId)}/save`, {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
export const dismissMatch = (jobId) =>
  apiFetch(`/api/auto-apply/matches/${encodeURIComponent(jobId)}/dismiss`, {
    method: 'POST',
  });

// Actions
export const applyToJob = (jobId) =>
  apiFetch(`/api/auto-apply/apply/${encodeURIComponent(jobId)}`, {
    method: 'POST',
  });
export const generateCoverLetter = (jobId) =>
  apiFetch(`/api/auto-apply/generate-cover-letter/${encodeURIComponent(jobId)}`, {
    method: 'POST',
  });

// Activity & Analytics
export const getActivity = () => apiFetch('/api/auto-apply/activity');
export const getAnalytics = () => apiFetch('/api/auto-apply/analytics');

// Agent Control
export const getAgentStatus = () => apiFetch('/api/auto-apply/agent/status');
export const startAgent = () =>
  apiFetch('/api/auto-apply/agent/start', { method: 'POST' });
export const pauseAgent = () =>
  apiFetch('/api/auto-apply/agent/pause', { method: 'POST' });
export const runAgentCycle = () =>
  apiFetch('/api/auto-apply/agent/run-cycle', { method: 'POST' });

// Browser Apply (SSE streaming)
export const browserApplyToJob = async (jobId, onStep) => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/auto-apply/browser-apply/${encodeURIComponent(jobId)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let msg = `Browser apply failed (${response.status})`;
    try { msg = JSON.parse(text).detail || msg; } catch (e) {}
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.substring(6));
          if (onStep) onStep(event);
          finalResult = event;
        } catch (e) {
          // skip malformed events
        }
      }
    }
  }

  return finalResult;
};
