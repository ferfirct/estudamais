import { request } from './client.js';

export function createSession(theme) {
  return request('/api/sessions', {
    method: 'POST',
    body: { theme, startTime: new Date().toISOString() },
  });
}

export function finishSession(id, durationMinutes) {
  return request(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: {
      endTime: new Date().toISOString(),
      durationMinutes,
    },
  });
}

export function listSessions({ needsReview = false } = {}) {
  const qs = needsReview ? '?needsReview=true' : '';
  return request(`/api/sessions${qs}`);
}

export function getSession(id) {
  return request(`/api/sessions/${id}`);
}
