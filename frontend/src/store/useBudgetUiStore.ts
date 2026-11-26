'use client';

import { create } from 'zustand';

export type BudgetCategoryFilter =
  | 'all'
  | 'food'
  | 'transport'
  | 'stay'
  | 'ticket'
  | 'other';

interface BudgetUiState {
  selectedCategory: BudgetCategoryFilter;
  searchQuery: string;
  isAddExpenseModalOpen: boolean;
  editingExpenseId: string | number | null;
  setSelectedCategory: (category: BudgetCategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  openAddExpenseModal: () => void;
  closeAddExpenseModal: () => void;
  setEditingExpenseId: (id: string | number | null) => void;
  resetBudgetUi: () => void;
}

export const useBudgetUiStore = create<BudgetUiState>((set) => ({
  selectedCategory: 'all',
  searchQuery: '',
  isAddExpenseModalOpen: false,
  editingExpenseId: null,
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  openAddExpenseModal: () => set({ isAddExpenseModalOpen: true }),
  closeAddExpenseModal: () => set({ isAddExpenseModalOpen: false }),
  setEditingExpenseId: (editingExpenseId) => set({ editingExpenseId }),
  resetBudgetUi: () =>
    set({
      selectedCategory: 'all',
      searchQuery: '',
      isAddExpenseModalOpen: false,
      editingExpenseId: null,
    }),
}));