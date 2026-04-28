import { request } from './client.js';

export function getReviewsDue() {
  return request('/api/reviews/due');
}

export function getReviewSchedule() {
  return request('/api/reviews/schedule');
}
