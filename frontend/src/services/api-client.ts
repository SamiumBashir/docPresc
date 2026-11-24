export class ApiError extends Error {
  public status?: number;
  public code: string;
  public errors?: Record<string, string> | any[];
  public isNetworkError: boolean;

  constructor(
    message: string,
    errors?: Record<string, string> | any[],
    status?: number,
    code = 'API_ERROR',
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.status = status;
    this.code = code;
    this.isNetworkError = isNetworkError;
  }
}

let inMemoryToken: string | null = null;

export const getAccessToken = (): string | null => {
  return inMemoryToken || localStorage.getItem('docrx_token');
};

export const setAccessToken = (token: string | null): void => {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('docrx_token', token);
  } else {
    localStorage.removeItem('docrx_token');
  }
};

export const clearAuthTokens = (): void => {
  inMemoryToken = null;
  localStorage.removeItem('docrx_token');
  localStorage.removeItem('docrx_user');
  localStorage.removeItem('docrx_doctor');
  localStorage.removeItem('docrx_chambers');
  localStorage.removeItem('docrx_active_chamber_id');
};

export const getApiUrl = (endpoint: string): string => {
  let base = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? 'https://presc-backend.vercel.app/api' : '/api')
  ).replace(/\/+$/, '');

  // Self-healing migration safeguard: route to active Vercel serverless backend
  if (base.includes('docpresc.onrender.com') || base.includes('presc-backend.onrender.com')) {
    base = 'https://presc-backend.vercel.app/api';
  }
  const path = endpoint.replace(/^\/+/, '');
  return `${base}/${path}`;
};

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipRetry?: boolean;
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const executeFetch = async <T = any>(
  url: string,
  options: RequestOptions
): Promise<T> => {
  const { timeoutMs = 25000, skipRetry, _retry, ...fetchOptions } = options;
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  // If body is FormData (e.g. file upload), remove Content-Type to let browser set boundary
  if (fetchOptions.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // for HTTP-only cookies
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized with token refresh if possible
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
    if (response.status === 401 && !isAuthRequest && !_retry) {
      if (isRefreshing) {
        // Queue this request until current refresh finishes
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              executeFetch<T>(url, {
                ...options,
                _retry: true,
                headers: {
                  ...fetchOptions.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              })
                .then(resolve)
                .catch(reject);
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshUrl = getApiUrl('/auth/refresh');
        const refreshRes = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!refreshRes.ok) {
          throw new Error('Session refresh failed');
        }

        const refreshData = await refreshRes.json();
        const newToken = refreshData.data?.accessToken || refreshData.token;

        if (!newToken) {
          throw new Error('No access token returned in refresh response');
        }

        setAccessToken(newToken);
        processQueue(null, newToken);

        // Retry initial request with new access token
        return await executeFetch<T>(url, {
          ...options,
          _retry: true,
          headers: {
            ...fetchOptions.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthTokens();
        throw new ApiError('Session expired. Please sign in again.', undefined, 401, 'UNAUTHORIZED');
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code =
        data.code ||
        (response.status === 400
          ? 'BAD_REQUEST'
          : response.status === 401
          ? 'UNAUTHORIZED'
          : response.status === 403
          ? 'FORBIDDEN'
          : response.status === 404
          ? 'NOT_FOUND'
          : response.status === 409
          ? 'CONFLICT'
          : response.status === 422
          ? 'VALIDATION_ERROR'
          : response.status === 429
          ? 'RATE_LIMIT_EXCEEDED'
          : response.status >= 500
          ? 'SERVER_ERROR'
          : 'API_ERROR');

      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        data.errors,
        response.status,
        code,
        false
      );
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. Please check your network connection and try again.',
        undefined,
        408,
        'REQUEST_TIMEOUT',
        true
      );
    }

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new ApiError(
      isOffline
        ? 'You appear to be offline. Please check your internet connection.'
        : 'Unable to reach the server. Please check your connection or try again later.',
      undefined,
      0,
      'NETWORK_ERROR',
      true
    );
  }
};

export const api = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();

  try {
    return await executeFetch<T>(url, options);
  } catch (err: any) {
    // Retry once for idempotent GET requests on transient network/timeout failure
    if (method === 'GET' && !options.skipRetry && err instanceof ApiError && err.isNetworkError) {
      try {
        return await executeFetch<T>(url, { ...options, skipRetry: true });
      } catch (retryErr) {
        throw retryErr;
      }
    }
    throw err;
  }
};

export const apiClient = api;
