import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const authStorage = localStorage.getItem('cad-auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const token = state?.user?.token; // Add token when auth is implemented
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle errors
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;

    // Don't show toast for certain status codes
    const silentErrors = [401, 403];

    if (!silentErrors.includes(status)) {
      toast.error(message);
    }

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API client wrapper with type safety
export class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const api = new APIClient();

// Export axios instance for direct use if needed
export { apiClient };

// Type-safe API methods
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: unknown) => api.post('/projects', data),
  update: (id: string, data: unknown) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const usersAPI = {
  getCurrent: () => api.get('/users/me'),
  update: (data: unknown) => api.put('/users/me', data),
};

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  signup: (email: string, password: string, name: string) =>
    api.post('/auth/signup', { email, password, name }),
  logout: () => api.post('/auth/logout'),
};
