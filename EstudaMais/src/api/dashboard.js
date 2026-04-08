import { request } from './client.js';

export function getDashboardStats() {
  return request('/api/dashboard/stats');
}
