import { request } from './client.js';

export function getStreak() {
  return request('/api/streak');
}

export function activateFreeze() {
  return request('/api/streak/freeze', { method: 'PATCH' });
}
