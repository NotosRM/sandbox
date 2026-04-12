import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  fetchCategories,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/dummyjson';
import type { ProductsResponse } from './types';

export function useProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: id > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const snapshots = queryClient.getQueriesData<ProductsResponse>({
        queryKey: ['products'],
      });
      queryClient.setQueriesData<ProductsResponse>({ queryKey: ['products'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products.filter((p) => p.id !== id),
          total: old.total - 1,
        };
      });
      return { snapshots };
    },
    onError: (_err, _id, context) => {
      context?.snapshots.forEach(([queryKey, snapshot]) => {
        queryClient.setQueryData(queryKey, snapshot);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
