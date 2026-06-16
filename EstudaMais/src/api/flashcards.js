import { request } from './client.js';

export function listFlashcards(params = {}) {
  const qs = new URLSearchParams();
  if (params.theme) qs.set('theme', params.theme);
  if (params.dueOnly) qs.set('dueOnly', 'true');
  const q = qs.toString();
  return request(`/api/flashcards${q ? `?${q}` : ''}`);
}

export function generateFlashcards(theme, count, difficulty) {
  return request('/api/flashcards/generate', {
    method: 'POST',
    body: { theme, count, difficulty },
  });
}

export function reviewFlashcard(id, remembered) {
  return request(`/api/flashcards/${id}/review`, {
    method: 'PATCH',
    body: { remembered },
  });
}

export function deleteFlashcard(id) {
  return request(`/api/flashcards/${id}`, { method: 'DELETE' });
}
