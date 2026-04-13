import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/features/ui/store';
import { useCreateProduct, useUpdateProduct, useProduct } from '../api';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  thumbnail: z.string().url('Must be a valid URL').or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const { isProductFormOpen, editingProductId, closeForm } = useUIStore();
  const isEditMode = editingProductId !== null;

  const { data: existingProduct } = useProduct(editingProductId ?? 0);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: '',
      brand: '',
      thumbnail: '',
    },
  });

  // Prefill form when editing
  useEffect(() => {
    if (isEditMode && existingProduct) {
      reset({
        title: existingProduct.title,
        description: existingProduct.description,
        price: existingProduct.price,
        category: existingProduct.category,
        brand: existingProduct.brand,
        thumbnail: existingProduct.thumbnail,
      });
    } else {
      reset({
        title: '',
        description: '',
        price: 0,
        category: '',
        brand: '',
        thumbnail: '',
      });
    }
  }, [isEditMode, existingProduct, reset]);

  async function onSubmit(data: FormData) {
    if (isEditMode && editingProductId !== null) {
      await updateMutation.mutateAsync({ id: editingProductId, data });
    } else {
      await createMutation.mutateAsync(data as Parameters<typeof createMutation.mutateAsync>[0]);
    }
    closeForm();
  }

  return (
    <Dialog open={isProductFormOpen} onOpenChange={(open) => !open && closeForm()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} />
            {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input id="thumbnail" type="url" {...register('thumbnail')} />
            {errors.thumbnail && (
              <p className="text-xs text-destructive">{errors.thumbnail.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
