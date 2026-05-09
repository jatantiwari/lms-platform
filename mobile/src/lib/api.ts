import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = 'http://192.168.29.141:5010/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getAccessToken = () => SecureStore.getItemAsync('accessToken');
export const getRefreshToken = () => SecureStore.getItemAsync('refreshToken');
export const setAccessToken = (t: string) => SecureStore.setItemAsync('accessToken', t);
export const setRefreshToken = (t: string) => SecureStore.setItemAsync('refreshToken', t);
export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor (auto-refresh) ─────────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
      }
      orig._retry = true;
      isRefreshing = true;
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        await clearTokens();
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRT } = data.data;
        await setAccessToken(accessToken);
        await setRefreshToken(newRT);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        orig.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(orig);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── Typed API helpers ─────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', { ...data, role: 'STUDENT' }),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (code: string) => api.post('/auth/verify-email', { code }),
  resendVerification: () => api.post('/auth/resend-verification'),
  sendPhoneOtp: () => api.post('/auth/send-phone-otp'),
  verifyPhoneOtp: (otp: string) => api.post('/auth/verify-phone-otp', { otp }),
};

export const courseApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/courses', { params }),
  getBySlug: (slug: string) => api.get(`/courses/${slug}`),
  getById: (id: string) => api.get(`/courses/id/${id}`),
};

export const lectureApi = {
  get: (lectureId: string) => api.get(`/lectures/${lectureId}`),
  getTranscript: (lectureId: string) => api.get(`/lectures/${lectureId}/transcript`),
};

export const enrollmentApi = {
  getMyEnrollments: (params?: Record<string, unknown>) => api.get('/enrollments/my', { params }),
  check: (courseId: string) => api.get(`/enrollments/check/${courseId}`),
};

export const progressApi = {
  update: (lectureId: string, data: { completed?: boolean; watchedSeconds?: number }) =>
    api.put(`/progress/lecture/${lectureId}`, data),
  getCourse: (courseId: string) => api.get(`/progress/course/${courseId}`),
};

export const reviewApi = {
  getCourse: (courseId: string, params?: Record<string, unknown>) =>
    api.get(`/reviews/course/${courseId}`, { params }),
  create: (courseId: string, data: { rating: number; comment?: string }) =>
    api.post(`/reviews/course/${courseId}`, data),
  update: (reviewId: string, data: { rating?: number; comment?: string }) =>
    api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
};

export const paymentApi = {
  createOrder: (courseId: string) => api.post('/payments/create-order', { courseId }),
  verify: (data: { orderId: string }) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
};

export const lectureRatingApi = {
  rate: (lectureId: string, rating: number) =>
    api.post(`/lecture-ratings/lecture/${lectureId}`, { rating }),
  getMyRating: (lectureId: string) => api.get(`/lecture-ratings/lecture/${lectureId}/my`),
};

export const userApi = {
  getProfile: (id: string) => api.get(`/users/${id}/profile`),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
  uploadAvatar: (formData: FormData) =>
    api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/change-password', { currentPassword, newPassword }),
};
