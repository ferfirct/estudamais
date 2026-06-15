import { request } from './client.js';

export function listNotes(params = {}) {
  const qs = new URLSearchParams();
  if (params.theme) qs.set('theme', params.theme);
  if (params.sessionId) qs.set('sessionId', params.sessionId);
  const q = qs.toString();
  return request(`/api/notes${q ? `?${q}` : ''}`);
}

export function createNote(data) {
  return request('/api/notes', { method: 'POST', body: data });
}

export function updateNote(id, content) {
  return request(`/api/notes/${id}`, { method: 'PUT', body: { content } });
}

export function deleteNote(id) {
  return request(`/api/notes/${id}`, { method: 'DELETE' });
}
