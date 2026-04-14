import { context } from '@reatom/core';
import {
  pageAtom,
  searchAtom,
  categoryAtom,
  LIMIT,
  productsResource,
  categoriesResource,
  productIdAtom,
  productResource,
  productsRefreshAtom,
  isProductFormOpenAtom,
  editingProductIdAtom,
  openCreateForm,
  openEditForm,
  closeForm,
} from './atoms';

describe('filter atoms — defaults', () => {
  it('pageAtom defaults to 1', () => {
    const frame = context.start();
    frame.run(() => {
      expect(pageAtom()).toBe(1);
    });
  });

  it('searchAtom defaults to empty string', () => {
    const frame = context.start();
    frame.run(() => {
      expect(searchAtom()).toBe('');
    });
  });

  it('categoryAtom defaults to empty string', () => {
    const frame = context.start();
    frame.run(() => {
      expect(categoryAtom()).toBe('');
    });
  });

  it('LIMIT is 12', () => {
    expect(LIMIT).toBe(12);
  });
});

describe('filter atoms — updates', () => {
  it('pageAtom can be set', () => {
    const frame = context.start();
    frame.run(() => {
      pageAtom.set(5);
      expect(pageAtom()).toBe(5);
    });
  });

  it('searchAtom can be set', () => {
    const frame = context.start();
    frame.run(() => {
      searchAtom.set('phone');
      expect(searchAtom()).toBe('phone');
    });
  });

  it('categoryAtom can be set', () => {
    const frame = context.start();
    frame.run(() => {
      categoryAtom.set('electronics');
      expect(categoryAtom()).toBe('electronics');
    });
  });
});

describe('resource atoms — initial data', () => {
  it('productsResource.data() defaults to null', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productsResource.data()).toBeNull();
    });
  });

  it('categoriesResource.data() defaults to empty array', () => {
    const frame = context.start();
    frame.run(() => {
      expect(categoriesResource.data()).toEqual([]);
    });
  });

  it('productIdAtom defaults to 0', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productIdAtom()).toBe(0);
    });
  });

  it('productResource.data() defaults to null', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productResource.data()).toBeNull();
    });
  });
});

describe('UI flag atoms', () => {
  it('isProductFormOpenAtom defaults to false', () => {
    const frame = context.start();
    frame.run(() => {
      expect(isProductFormOpenAtom()).toBe(false);
    });
  });

  it('editingProductIdAtom defaults to null', () => {
    const frame = context.start();
    frame.run(() => {
      expect(editingProductIdAtom()).toBeNull();
    });
  });

  it('openCreateForm opens form with no editing ID', () => {
    const frame = context.start();
    frame.run(() => {
      openCreateForm();
      expect(isProductFormOpenAtom()).toBe(true);
      expect(editingProductIdAtom()).toBeNull();
    });
  });

  it('openEditForm opens form with product ID', () => {
    const frame = context.start();
    frame.run(() => {
      openEditForm(42);
      expect(isProductFormOpenAtom()).toBe(true);
      expect(editingProductIdAtom()).toBe(42);
    });
  });

  it('closeForm resets form state', () => {
    const frame = context.start();
    frame.run(() => {
      openEditForm(42);
      closeForm();
      expect(isProductFormOpenAtom()).toBe(false);
      expect(editingProductIdAtom()).toBeNull();
    });
  });
});

describe('productsRefreshAtom', () => {
  it('defaults to 0', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productsRefreshAtom()).toBe(0);
    });
  });

  it('increments when bumped', () => {
    const frame = context.start();
    frame.run(() => {
      productsRefreshAtom.set((v: number) => v + 1);
      expect(productsRefreshAtom()).toBe(1);
    });
  });
});
