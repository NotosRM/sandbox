import { atom, computed, wrap } from '@reatom/core';
import { withAsyncData } from '@reatom/core';
import { fetchProducts, fetchCategories, fetchProduct } from '@/lib/dummyjson';

export const LIMIT = 12;

// ─── Filter atoms ─────────────────────────────────────────────────────────────

export const pageAtom = atom(1, 'pageAtom');
export const searchAtom = atom('', 'searchAtom');
export const categoryAtom = atom('', 'categoryAtom');

// ─── Products list (reactive: re-fetches when any filter atom changes) ────────

export const productsResource = computed(async () => {
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
