import { request } from './client.js';

export function getSettings() {
  return request('/api/settings');
}

export function updateSettings(patch) {
  return request('/api/settings', { method: 'PATCH', body: patch });
}
