/**
 * FaithTech Blueprint API client.
 *
 * Wraps axios with the API Gateway base URL, attaches the JWT access token,
 * and transparently refreshes the token on 401 responses.
 *
 * @module lib/api
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

class ApiClient {
  private readonly client: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // send cookies (CSRF/refresh tokens) if used
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        (response as { data: unknown }).data = this.normalize(
          (response as { data: unknown }).data
        );
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Only attempt refresh on 401, and only once per request
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshAccessToken();
          }

          try {
            const newToken = await this.refreshPromise;
            this.refreshPromise = null;

            if (!newToken) {
              this.clearTokens();
              // Redirect to login via a custom event the AuthProvider listens to
              window.dispatchEvent(new CustomEvent('auth:logout'));
              return Promise.reject(error);
            }

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.refreshPromise = null;
            this.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:logout'));
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ── Token helpers ──────────────────────────────────────────────

  private getStorage(): Storage {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage;
  }

  private getAccessToken(): string | null {
    const token = this.getStorage().getItem('accessToken');
    if (!token) return null;

    try {
      const payload = jwtDecode<TokenPayload>(token);
      // Expired or expiring within 30 seconds
      if (payload.exp * 1000 <= Date.now() + 30000) {
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  private setTokens(tokens: AuthTokens): void {
    this.getStorage().setItem('accessToken', tokens.accessToken);
    if (tokens.refreshToken) {
      this.getStorage().setItem('refreshToken', tokens.refreshToken);
    }
  }

  private clearTokens(): void {
    const s = this.getStorage();
    s.removeItem('accessToken');
    s.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getStorage().getItem('refreshToken');
      if (!refreshToken) return null;

      const { data } = await axios.post<AuthTokens>(
        `${API_BASE}/auth/refresh`,
        { refreshToken },
        { timeout: 10000 }
      );
      this.setTokens(data);
      return data.accessToken;
    } catch {
      return null;
    }
  }

  /**
   * Normalize backend response envelopes so callers can always read
   * `.data` regardless of whether the service wraps its payload in
   * `{ status, data }`, `{ data }`, `{ user }`, `{ users }`, or returns
   * a bare array/object.
   */
  private normalize(payload: unknown): unknown {
    if (payload === null || payload === undefined) return payload;

    // Bare arrays (e.g. assessment list) — pass through.
    if (Array.isArray(payload)) return payload;

    if (typeof payload !== 'object') return payload;
    const obj = payload as Record<string, unknown>;

    // { data: [...] } or { data: {...} } — unwrap.
    if ('data' in obj) return obj.data;

    // { users: [...] } or { user: {...} } — unwrap.
    if ('users' in obj) return obj.users;
    if ('user' in obj) return obj.user;

    // { results: [...] } — unwrap.
    if ('results' in obj && Array.isArray(obj.results)) return obj.results;

    return payload;
  }

  // ── Public API ─────────────────────────────────────────────────

  get<T>(url: string, params?: Record<string, unknown>) {
    return this.client.get<T>(url, { params }).then((res) => res.data as T);
  }

  post<T>(url: string, data?: unknown) {
    return this.client.post<T>(url, data).then((res) => res.data as T);
  }

  put<T>(url: string, data?: unknown) {
    return this.client.put<T>(url, data).then((res) => res.data as T);
  }

  patch<T>(url: string, data?: unknown) {
    return this.client.patch<T>(url, data).then((res) => res.data as T);
  }

  delete<T>(url: string) {
    return this.client.delete<T>(url).then((res) => res.data as T);
  }

  /** Untyped variant that returns the raw (normalized) payload. */
  getRaw(url: string, params?: Record<string, unknown>) {
    return this.client.get<unknown>(url, { params }).then((res) => res.data);
  }

  /** Set tokens after login/register. */
  setAuthTokens(tokens: AuthTokens): void {
    this.setTokens(tokens);
  }

  /** Clear tokens on logout. */
  clearAuth(): void {
    this.clearTokens();
  }

  /** Whether a usable access token is currently stored. */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}

export const api = new ApiClient();

export default api;