import { create } from 'zustand';
import { Course, PaginationMeta } from '@/types';

interface CourseFilters {
  search: string;
  category: string;
  level: string;
  sortBy: string;
  minPrice: number | null;
  maxPrice: number | null;
}

interface CourseState {
  courses: Course[];
  meta: PaginationMeta | null;
  filters: CourseFilters;
  isLoading: boolean;

  setCourses: (courses: Course[], meta?: PaginationMeta) => void;
  setFilter: <K extends keyof CourseFilters>(key: K, value: CourseFilters[K]) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: CourseFilters = {
  search: '',
  category: '',
  level: '',
  sortBy: 'newest',
  minPrice: null,
  maxPrice: null,
};

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  meta: null,
  filters: { ...defaultFilters },
  isLoading: false,

  setCourses(courses, meta) {
    set({ courses, meta: meta ?? null });
  },

  setFilter(key, value) {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
  },

  resetFilters() {
    set({ filters: { ...defaultFilters } });
  },

  setLoading(loading) {
    set({ isLoading: loading });
  },
}));
