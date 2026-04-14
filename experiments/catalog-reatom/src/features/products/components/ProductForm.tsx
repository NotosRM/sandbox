import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  isProductFormOpenAtom,
  editingProductIdAtom,
  closeForm,
  createProductAction,
  updateProductAction,
  formProductResource,
  productSchema,
  type ProductFormData,
} from '../atoms';

export const ProductForm = reatomComponent(() => {
  const isOpen = isProductFormOpenAtom();
  const editingId = editingProductIdAtom();
  const isEditMode = editingId !== null;

  const existingProduct = formProductResource.data();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { title: '', description: '', price: 0, category: '', brand: '', thumbnail: '' },
  });

  // Prefill when editing and product data arrives
  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && existingProduct) {
      reset({
        title: existingProduct.title,
        description: existingProduct.description,
        price: existingProduct.price,
        category: existingProduct.category,
        brand: existingProduct.brand,
        thumbnail: existingProduct.thumbnail,
      });
    } else if (!isEditMode) {
      reset({ title: '', description: '', price: 0, category: '', brand: '', thumbnail: '' });
    }
  }, [isOpen, isEditMode, existingProduct, reset]);

  async function onSubmit(data: ProductFormData) {
    try {
      if (isEditMode && editingId !== null) {
        await updateProductAction(editingId, data);
      } else {
        await createProductAction(data);
      }
      closeForm();
    } catch {
      // stay open on error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={wrap((open) => !open && closeForm())}>
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
            <Button type="button" variant="outline" onClick={wrap(closeForm)}>
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
}, 'ProductForm');
