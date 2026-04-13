import { create } from 'zustand';

interface UIStore {
  isProductFormOpen: boolean;
  editingProductId: number | null;
  openCreateForm: () => void;
  openEditForm: (id: number) => void;
  closeForm: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isProductFormOpen: false,
  editingProductId: null,
  openCreateForm: () => set({ isProductFormOpen: true, editingProductId: null }),
  openEditForm: (id) => set({ isProductFormOpen: true, editingProductId: id }),
  closeForm: () => set({ isProductFormOpen: false, editingProductId: null }),
}));
