const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  return localStorage.getItem('estudaplus:token');
}

export function setToken(token) {
  if (token) localStorage.setItem('estudaplus:token', token);
  else localStorage.removeItem('estudaplus:token');
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  const token = getToken();
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    throw new ApiError('Não foi possível conectar ao servidor.', 0, err);
  }

  if (response.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event('auth:logout'));
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Erro ${response.status}`,
      response.status,
      payload?.details
    );
  }
  return payload;
}
