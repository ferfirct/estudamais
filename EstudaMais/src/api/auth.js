import { request } from './client.js';

export function register(name, email, password) {
  return request('/api/auth/register', { method: 'POST', body: { name, email, password } });
}

export function login(email, password) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}

export function getMe() {
  return request('/api/auth/me');
}

export function updateProfile(data) {
  return request('/api/auth/profile', { method: 'PATCH', body: data });
}

export function changePassword(data) {
  return request('/api/auth/password', { method: 'PATCH', body: data });
}
