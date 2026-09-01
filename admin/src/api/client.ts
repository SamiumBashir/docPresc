export class ApiError extends Error {
  errors?: any[];
  constructor(message: string, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
  }
}

const getApiUrl = (endpoint: string): string => {
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const path = endpoint.replace(/^\/+/, '');
  return `${base}/${path}`;
};

export const api = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('docrx_admin_token') || localStorage.getItem('docrx_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || `Request failed with status ${response.status}`, data.errors);
  }

  return data;
};
