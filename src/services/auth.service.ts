import axios, { AxiosInstance, AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenPayload {
  userId: string;
  role: string;
  sessionId: string;
  exp: number;
}

class AuthService {
  private readonly apiClient: AxiosInstance;
  private readonly storage: Storage;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
    });
    this.storage = this.getSecureStorage();
    this.setupInterceptors();
  }

  /**
   * Get secure storage mechanism
   * Falls back to memory storage if secure storage is not available
   */
  private getSecureStorage(): Storage {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage; // Prefer sessionStorage over localStorage for security
    }
    
    // Fallback to in-memory storage
    const memoryStorage = new Map<string, string>();
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
      clear: () => memoryStorage.clear(),
      length: memoryStorage.size,
      key: () => null,
    };
  }

  /**
   * Setup axios interceptors for automatic token handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Handle 401 errors
        if (
          error.response?.status === 401 &&
          !originalRequest.headers['X-Retry-Count']
        ) {
          // Prevent multiple simultaneous refresh attempts
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshAccessToken();
          }

          try {
            const newToken = await this.refreshPromise;
            this.refreshPromise = null;

            if (!newToken) {
              this.logout();
              return Promise.reject(error);
            }

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            originalRequest.headers['X-Retry-Count'] = '1';
            return this.apiClient(originalRequest);
          } catch (refreshError) {
            this.refreshPromise = null;
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.apiClient.post<AuthTokens>('/auth/login', {
        email,
        password,
      });

      this.setTokens(response.data);
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.storage.getItem('refreshToken');
      if (refreshToken) {
        await this.apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
      window.location.href = '/login';
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.storage.getItem('refreshToken');
      if (!refreshToken) {
        return null;
      }

      const response = await this.apiClient.post<AuthTokens>('/auth/refresh', {
        refreshToken,
      });

      this.setTokens(response.data);
      return response.data.accessToken;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get current access token
   */
  private getAccessToken(): string | null {
    const token = this.storage.getItem('accessToken');
    if (!token) {
      return null;
    }

    try {
      const payload = jwtDecode<TokenPayload>(token);
      // Check if token is expired or about to expire (within 30 seconds)
      if (payload.exp * 1000 <= Date.now() + 30000) {
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Set authentication tokens
   */
  private setTokens(tokens: AuthTokens): void {
    this.storage.setItem('accessToken', tokens.accessToken);
    this.storage.setItem('refreshToken', tokens.refreshToken);
  }

  /**
   * Clear authentication tokens
   */
  private clearTokens(): void {
    this.storage.removeItem('accessToken');
    this.storage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Get current user information from token
   */
  getCurrentUser(): { userId: string; role: string } | null {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const payload = jwtDecode<TokenPayload>(token);
      return {
        userId: payload.userId,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService(); 