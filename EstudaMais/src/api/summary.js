import { request } from './client.js';

export function getWeeklySummary() {
  return request('/api/summary/weekly');
}
