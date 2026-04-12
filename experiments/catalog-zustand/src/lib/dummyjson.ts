import type { Product, ProductsResponse, Category } from '@/features/products/types';

const BASE_URL = 'https://dummyjson.com';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function fetchProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}): Promise<ProductsResponse> {
  const skip = (params.page - 1) * params.limit;
  const qs = `limit=${params.limit}&skip=${skip}`;

  if (params.search) {
    return apiFetch(`${BASE_URL}/products/search?q=${encodeURIComponent(params.search)}&${qs}`);
  }
  if (params.category) {
    return apiFetch(`${BASE_URL}/products/category/${encodeURIComponent(params.category)}?${qs}`);
  }
  return apiFetch(`${BASE_URL}/products?${qs}`);
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch(`${BASE_URL}/products/categories`);
}

export function fetchProduct(id: number): Promise<Product> {
  return apiFetch(`${BASE_URL}/products/${id}`);
}

export function createProduct(
  data: Omit<Product, 'id' | 'rating' | 'stock' | 'images'>
): Promise<Product> {
  return apiFetch(`${BASE_URL}/products/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
  return apiFetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteProduct(
  id: number
): Promise<{ id: number; isDeleted: boolean; deletedOn: string }> {
  return apiFetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
}
