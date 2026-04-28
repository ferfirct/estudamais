import { request } from './client.js';

export function getRecords() {
  return request('/api/records');
}

export function getThemeRecord(theme) {
  return request(`/api/records/${encodeURIComponent(theme)}`);
}
