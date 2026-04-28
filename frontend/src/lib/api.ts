import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Attaches the access token from localStorage to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ──────────────────────────────────────────────────────
// Automatically refreshes the access token when a 401 is received
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        // Redirect to login
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
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
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (code: string) => api.post('/auth/verify-email', { code }),
  resendVerification: () => api.post('/auth/resend-verification'),
};

export const courseApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/courses', { params }),
  getBySlug: (slug: string) => api.get(`/courses/${slug}`),
  getById: (id: string) => api.get(`/courses/id/${id}`),
  create: (data: Record<string, unknown>) => api.post('/courses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/courses/${id}`, data),
  uploadThumbnail: (id: string, file: File) => {
    const form = new FormData();
    form.append('thumbnail', file);
    return api.post(`/courses/${id}/thumbnail`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  publish: (id: string) => api.patch(`/courses/${id}/publish`),
  delete: (id: string) => api.delete(`/courses/${id}`),
  getMyCourses: (params?: Record<string, unknown>) =>
    api.get('/courses/my', { params }),
  createSection: (courseId: string, data: { title: string; order?: number }) =>
    api.post(`/courses/${courseId}/sections`, data),
  updateSection: (courseId: string, sectionId: string, data: { title?: string }) =>
    api.put(`/courses/${courseId}/sections/${sectionId}`, data),
  deleteSection: (courseId: string, sectionId: string) =>
    api.delete(`/courses/${courseId}/sections/${sectionId}`),
};

export const lectureApi = {
  create: (courseId: string, sectionId: string, data: Record<string, unknown>) =>
    api.post(`/courses/${courseId}/sections/${sectionId}/lectures`, data),
  update: (courseId: string, sectionId: string, lectureId: string, data: Record<string, unknown>) =>
    api.put(`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}`, data),
  delete: (courseId: string, sectionId: string, lectureId: string) =>
    api.delete(`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}`),
  uploadVideo: (courseId: string, sectionId: string, lectureId: string, file: File, onProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append('video', file);
    return api.post(
      `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/video`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
        timeout: 0,
      },
    );
  },
  get: (lectureId: string) => api.get(`/lectures/${lectureId}`),
  uploadAttachment: (courseId: string, sectionId: string, lectureId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(
      `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/attachments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  deleteResource: (courseId: string, sectionId: string, lectureId: string, url: string) =>
    api.delete(
      `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/resources`,
      { data: { url } },
    ),
  addQuestion: (
    courseId: string,
    sectionId: string,
    lectureId: string,
    data: { question: string; options: string[]; correctIndex: number; showAtSecond: number; explanation?: string },
  ) => api.post(`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/questions`, data),
  deleteQuestion: (courseId: string, sectionId: string, lectureId: string, questionId: string) =>
    api.delete(`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/questions/${questionId}`),
  getTranscript: (lectureId: string) => api.get(`/lectures/${lectureId}/transcript`),
};

export const enrollmentApi = {
  getMyEnrollments: (params?: Record<string, unknown>) => api.get('/enrollments/my', { params }),
  check: (courseId: string) => api.get(`/enrollments/check/${courseId}`),
  getStudents: (courseId: string, params?: Record<string, unknown>) =>
    api.get(`/enrollments/course/${courseId}/students`, { params }),
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

export const dashboardApi = {
  getInstructorStats: () => api.get('/dashboard/instructor'),
  getAdminStats: () => api.get('/dashboard/admin'),
  getAllCourses: (params?: Record<string, unknown>) => api.get('/courses/admin/all', { params }),
  adminUpdateCourse: (id: string, data: Record<string, unknown>) =>
    api.patch(`/dashboard/admin/courses/${id}`, data),
};

export const userApi = {
  getProfile: (id: string) => api.get(`/users/${id}/profile`),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.put('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/change-password', { currentPassword, newPassword }),
  // Admin
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
};

export const instructorApi = {
  apply: (data: {
    teachingExperience: string;
    expertise: string[];
    bio: string;
    linkedIn?: string;
    website?: string;
  }) => api.post('/instructor/apply', data),
  getMyApplication: () => api.get('/instructor/my-application'),
  // Admin
  listApplications: (status?: string) =>
    api.get('/instructor/applications', { params: status ? { status } : undefined }),
  reviewApplication: (id: string, data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
    api.patch(`/instructor/applications/${id}`, data),
};
