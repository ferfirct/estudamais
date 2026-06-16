import { request } from './client.js';

export function getAggregatedData(userId) {
  return request(`/aggregated-data?userId=${encodeURIComponent(userId)}`);
}
