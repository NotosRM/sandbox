import { http, HttpResponse } from 'msw';
import type { Product, ProductsResponse, Category } from '@/features/products/types';

export const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: 'A great test product for experiments.',
  category: 'electronics',
  price: 99.99,
  discountPercentage: 10,
  rating: 4.5,
  stock: 100,
  brand: 'TestBrand',
  thumbnail: 'https://cdn.dummyjson.com/products/images/1/thumbnail.webp',
  images: ['https://cdn.dummyjson.com/products/images/1/1.webp'],
};

export const mockCategories: Category[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    url: 'https://dummyjson.com/products/category/electronics',
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    url: 'https://dummyjson.com/products/category/beauty',
  },
];

export type ApiMode = 'success' | 'error';

export function createHandlers(mode: ApiMode = 'success') {
  if (mode === 'error') {
    return [
      http.get('https://dummyjson.com/products', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
      http.get('https://dummyjson.com/products/categories', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
      http.get('https://dummyjson.com/products/:id', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
    ];
  }

  const listResponse: ProductsResponse = {
    products: [mockProduct],
    total: 1,
    skip: 0,
    limit: 12,
  };

  return [
    http.get('https://dummyjson.com/products', () => HttpResponse.json(listResponse)),
    http.get('https://dummyjson.com/products/search', () => HttpResponse.json(listResponse)),
    http.get('https://dummyjson.com/products/categories', () => HttpResponse.json(mockCategories)),
    http.get('https://dummyjson.com/products/category/:category', () =>
      HttpResponse.json(listResponse)
    ),
    http.get('https://dummyjson.com/products/:id', () => HttpResponse.json(mockProduct)),
    http.post('https://dummyjson.com/products/add', () =>
      HttpResponse.json({ ...mockProduct, id: 195 })
    ),
    http.put('https://dummyjson.com/products/:id', () => HttpResponse.json(mockProduct)),
    http.delete('https://dummyjson.com/products/:id', () =>
      HttpResponse.json({ id: 1, isDeleted: true, deletedOn: '2026-04-12T00:00:00.000Z' })
    ),
  ];
}

// Named export used by main.tsx for the browser dev worker
export const handlers = createHandlers('success');
