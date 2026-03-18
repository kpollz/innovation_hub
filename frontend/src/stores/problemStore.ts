import { create } from 'zustand';
import { problemsApi } from '@/api/problems';
import type {
  Problem,
  CreateProblem,
  UpdateProblem,
  ProblemFilters,
  PaginatedResponse
} from '@/types';

interface ProblemState {
  problems: Problem[];
  selectedProblem: Problem | null;
  totalProblems: number;
  currentPage: number;
  totalPages: number;
  filters: ProblemFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProblems: (filters?: ProblemFilters) => Promise<void>;
  fetchProblem: (id: string) => Promise<void>;
  createProblem: (data: CreateProblem) => Promise<Problem>;
  updateProblem: (id: string, data: UpdateProblem) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProblemFilters>) => void;
  clearSelectedProblem: () => void;
  clearError: () => void;
}

const DEFAULT_PAGE_LIMIT = 10;

const DEFAULT_FILTERS: ProblemFilters = {
  page: 1,
  limit: DEFAULT_PAGE_LIMIT,
  sort: 'newest',
};

export const useProblemStore = create<ProblemState>((set, get) => ({
  problems: [],
  selectedProblem: null,
  totalProblems: 0,
  currentPage: 1,
  totalPages: 0,
  filters: DEFAULT_FILTERS,
  isLoading: false,
  error: null,

  fetchProblems: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response: PaginatedResponse<Problem> = await problemsApi.list(mergedFilters);
      const limit = mergedFilters.limit || DEFAULT_PAGE_LIMIT;
      set({
        problems: response.items,
        totalProblems: response.total,
        currentPage: response.page,
        totalPages: Math.ceil(response.total / limit),
        filters: mergedFilters,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch problems',
        isLoading: false
      });
    }
  },

  fetchProblem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const problem = await problemsApi.getById(id);
      set({ selectedProblem: problem, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch problem',
        isLoading: false
      });
    }
  },

  createProblem: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const problem = await problemsApi.create(data);
      set((state) => ({
        problems: [problem, ...state.problems],
        totalProblems: state.totalProblems + 1,
        isLoading: false
      }));
      return problem;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create problem',
        isLoading: false
      });
      throw error;
    }
  },

  updateProblem: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const problem = await problemsApi.update(id, data);
      set((state) => ({
        problems: state.problems.map((p) => (p.id === id ? problem : p)),
        selectedProblem: state.selectedProblem?.id === id ? problem : state.selectedProblem,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update problem',
        isLoading: false
      });
      throw error;
    }
  },

  deleteProblem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await problemsApi.delete(id);
      set((state) => ({
        problems: state.problems.filter((p) => p.id !== id),
        totalProblems: state.totalProblems - 1,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete problem',
        isLoading: false
      });
      throw error;
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearSelectedProblem: () => set({ selectedProblem: null }),
  clearError: () => set({ error: null }),
}));
