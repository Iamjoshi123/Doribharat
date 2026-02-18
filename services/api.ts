import { Category, HomepageConfig, Product, User, UserRole } from '../types';

const rawBaseUrl =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') ||
  import.meta.env.VITE_CLOUD_RUN_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:8080';
export const API_BASE_URL = `${rawBaseUrl}/v1`;
export const FRONTEND_ORIGIN =
  import.meta.env.VITE_FRONTEND_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');

const ACCESS_TOKEN_KEY = 'doribharat_access_token';
const REFRESH_TOKEN_KEY = 'doribharat_refresh_token';
const USER_KEY = 'doribharat_user';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  _retried?: boolean;
}

const parseJson = async (res: Response) => {
  try {
    return await res.json();
  } catch (error) {
    console.warn('Non-JSON response received from API', error);
    return null;
  }
};

export const getStoredTokens = (): StoredTokens | null => {
  if (typeof localStorage === 'undefined') return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAtRaw = localStorage.getItem(`${ACCESS_TOKEN_KEY}_expires`);

  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtRaw ? Number(expiresAtRaw) : undefined,
  };
};

export const getStoredUser = (): User | null => {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem(USER_KEY);
  return saved ? (JSON.parse(saved) as User) : null;
};

const persistTokens = (tokens: StoredTokens) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (tokens.expiresAt) {
    localStorage.setItem(`${ACCESS_TOKEN_KEY}_expires`, String(tokens.expiresAt));
  }
};

const persistSession = (user: User, tokens: StoredTokens) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  persistTokens(tokens);
};

export const clearStoredSession = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(`${ACCESS_TOKEN_KEY}_expires`);
};

const buildAuthHeaders = (auth: boolean) => {
  const headers: Record<string, string> = {};
  if (FRONTEND_ORIGIN) {
    headers['X-Frontend-Origin'] = FRONTEND_ORIGIN;
  }
  if (auth) {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }
  return headers;
};

const refreshAccessToken = async (): Promise<StoredTokens | null> => {
  const stored = getStoredTokens();
  if (!stored?.refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(false),
    },
    body: JSON.stringify({ refreshToken: stored.refreshToken }),
    mode: 'cors',
  });

  if (!response.ok) {
    clearStoredSession();
    return null;
  }

  const data = await parseJson(response);
  const refreshed: StoredTokens = {
    accessToken: data?.accessToken || data?.token || stored.accessToken,
    refreshToken: data?.refreshToken || data?.refresh_token || stored.refreshToken,
    expiresAt: data?.expiresAt || (data?.expiresIn ? Date.now() + data.expiresIn * 1000 : undefined),
  };
  persistTokens(refreshed);
  return refreshed;
};

export const apiFetch = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers = {}, auth = false, _retried = false } = options;
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    method,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(auth),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !_retried && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.accessToken) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await parseJson(response)) as T;
};

const extractData = <T>(payload: any): T => {
  if (!payload) return payload as T;
  if ('data' in payload) return payload.data as T;
  return (payload.items || payload.result || payload) as T;
};

export const fetchProductsFromApi = async (): Promise<Product[]> => {
  const payload = await apiFetch<any>('/products');
  return extractData<Product[]>(payload);
};

export const fetchCategoriesFromApi = async (): Promise<Category[]> => {
  const payload = await apiFetch<any>('/categories');
  return extractData<Category[]>(payload);
};

export const fetchHomepageConfigFromApi = async (): Promise<HomepageConfig> => {
  const payload = await apiFetch<any>('/homepage');
  return extractData<HomepageConfig>(payload);
};

export const loginAdmin = async (username: string, password: string): Promise<User> => {
  const payload = await apiFetch<any>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  const tokens: StoredTokens = {
    accessToken: payload?.accessToken || payload?.token,
    refreshToken: payload?.refreshToken || payload?.refresh_token,
    expiresAt: payload?.expiresAt || (payload?.expiresIn ? Date.now() + payload.expiresIn * 1000 : undefined),
  };

  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('Login response did not include authentication tokens.');
  }

  const user: User =
    payload?.user ||
    ({
      id: payload?.userId || 'admin',
      username: payload?.username || username,
      role: payload?.role || UserRole.ADMIN,
    } as User);

  persistSession(user, tokens);
  return user;
};

export const refreshSession = async (): Promise<User | null> => {
  const refreshed = await refreshAccessToken();
  if (!refreshed) return null;
  return getStoredUser();
};
