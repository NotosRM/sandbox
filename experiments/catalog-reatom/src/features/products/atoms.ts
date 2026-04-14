import { atom, action, computed, wrap } from '@reatom/core';
import { withAsyncData, withAsync } from '@reatom/core';
import {
  fetchProducts,
  fetchCategories,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/dummyjson';
import { z } from 'zod';

export const LIMIT = 12;

// ─── Filter atoms ─────────────────────────────────────────────────────────────

export const pageAtom = atom(1, 'pageAtom');
export const searchAtom = atom('', 'searchAtom');
export const categoryAtom = atom('', 'categoryAtom');

// ─── Products list (reactive: re-fetches when any filter atom changes) ────────

export const productsRefreshAtom = atom(0, 'productsRefreshAtom');

export const productsResource = computed(async () => {
  productsRefreshAtom(); // re-run on bump
  const page = pageAtom();
  const search = searchAtom();
  const category = categoryAtom();
  return await wrap(fetchProducts({ page, limit: LIMIT, search, category }));
}, 'productsResource').extend(withAsyncData({ initState: null, status: true }));

// ─── Categories (fetched once, no deps) ──────────────────────────────────────

export const categoriesResource = computed(async () => {
  return await wrap(fetchCategories());
}, 'categoriesResource').extend(withAsyncData({ initState: [] }));

// ─── Product detail ───────────────────────────────────────────────────────────

export const productIdAtom = atom(0, 'productIdAtom');

export const productResource = computed(async () => {
  const id = productIdAtom();
  if (!id) return null;
  return await wrap(fetchProduct(id));
}, 'productResource').extend(withAsyncData({ initState: null, status: true }));

// ─── UI flag atoms ─────────────────────────────────────────────────────────────

export const isProductFormOpenAtom = atom(false, 'isProductFormOpenAtom');
export const editingProductIdAtom = atom<number | null>(null, 'editingProductIdAtom');

export const openCreateForm = action(() => {
  isProductFormOpenAtom.set(true);
  editingProductIdAtom.set(null);
}, 'openCreateForm');

export const openEditForm = action((id: number) => {
  isProductFormOpenAtom.set(true);
  editingProductIdAtom.set(id);
}, 'openEditForm');

export const closeForm = action(() => {
  isProductFormOpenAtom.set(false);
  editingProductIdAtom.set(null);
}, 'closeForm');

// ─── Form data schema ──────────────────────────────────────────────────────────

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  thumbnail: z.string().url('Must be a valid URL').or(z.literal('')),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ─── CRUD actions ─────────────────────────────────────────────────────────────

export const createProductAction = action(async (data: ProductFormData) => {
  await wrap(createProduct({ ...data, discountPercentage: 0 }));
  productsRefreshAtom.set((v: number) => v + 1);
}, 'createProductAction').extend(withAsync());

export const updateProductAction = action(async (id: number, data: ProductFormData) => {
  await wrap(updateProduct(id, data));
  productsRefreshAtom.set((v: number) => v + 1);
  if (productIdAtom() === id) {
    productIdAtom.set(0);
    productIdAtom.set(id);
  }
}, 'updateProductAction').extend(withAsync());

export const deleteProductAction = action(async (id: number) => {
  try {
    await wrap(deleteProduct(id));
  } finally {
    productsRefreshAtom.set((v: number) => v + 1);
  }
}, 'deleteProductAction').extend(withAsync());
