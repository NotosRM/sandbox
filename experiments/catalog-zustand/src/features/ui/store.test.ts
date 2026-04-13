import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './store';

// Reset store between tests
beforeEach(() => {
  useUIStore.setState({
    isProductFormOpen: false,
    editingProductId: null,
  });
});

describe('useUIStore', () => {
  it('initial state: form closed, no editing id', () => {
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(false);
    expect(state.editingProductId).toBeNull();
  });

  it('openCreateForm: opens form with null editing id', () => {
    useUIStore.getState().openCreateForm();
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(true);
    expect(state.editingProductId).toBeNull();
  });

  it('openEditForm: opens form with the given product id', () => {
    useUIStore.getState().openEditForm(42);
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(true);
    expect(state.editingProductId).toBe(42);
  });

  it('closeForm: closes form and clears editing id', () => {
    useUIStore.getState().openEditForm(42);
    useUIStore.getState().closeForm();
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(false);
    expect(state.editingProductId).toBeNull();
  });
});
