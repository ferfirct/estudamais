// Cliente HTTP centralizado para o backend Estuda+.
// Base URL configurável via VITE_API_URL; fallback para localhost:3333.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // Degradação graciosa: backend offline.
    throw new ApiError('Não foi possível conectar ao servidor.', 0, err);
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
