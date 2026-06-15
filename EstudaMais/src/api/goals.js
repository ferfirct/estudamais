import { request } from './client.js';

export function listGoals() {
  return request('/api/goals');
}

export function upsertGoal(theme, targetScore) {
  return request(`/api/goals/${encodeURIComponent(theme)}`, {
    method: 'PUT',
    body: { targetScore },
  });
}

export function deleteGoal(theme) {
  return request(`/api/goals/${encodeURIComponent(theme)}`, { method: 'DELETE' });
}
