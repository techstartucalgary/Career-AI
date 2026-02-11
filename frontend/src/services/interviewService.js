import { API_BASE_URL } from './api';

const buildUrl = (path) => {
  const base = (API_BASE_URL || '').replace(/\/$/, '');
  if (base.endsWith('/api')) {
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return `${base}/api${path.startsWith('/') ? path : `/${path}`}`;
};

const jsonFetch = async (path, payload) => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && data.detail ? data.detail : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

export const startInterview = async (payload = {}) => {
  return jsonFetch('/interview/start', payload);
};

export const startInterviewWithJobAndResume = async (jobDescription, resume, additionalTopics = '') => {
  return jsonFetch('/interview/start', {
    job_description: jobDescription,
    resume: resume,
    additional_topics: additionalTopics,
    max_questions: 10,
  });
};

export const sendInterviewResponse = async (sessionId, candidateText, endInterview = false) => {
  return jsonFetch('/interview/respond', {
    session_id: sessionId,
    candidate_text: candidateText,
    end_interview: endInterview,
  });
};

export const analyzePostureFrame = async (sessionId, imageBase64) => {
  return jsonFetch('/mock-interview/analyze', {
    session_id: sessionId,
    image_base64: imageBase64,
  });
};

export const getLiveFeedback = async (sessionId, question, answer) => {
  return jsonFetch('/interview/live-feedback', {
    session_id: sessionId,
    question: question,
    answer: answer,
  });
};
