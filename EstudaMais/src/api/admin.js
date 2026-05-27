import { request } from './client.js';

export function listUsers() {
  return request('/api/auth/users');
}

export function createUser({ name, email, password, role = 'user' }) {
  return request('/api/auth/admin/create-user', {
    method: 'POST',
    body: { name, email, password, role },
  });
}

export function deleteUser(id) {
  return request(`/api/auth/users/${id}`, { method: 'DELETE' });
}
