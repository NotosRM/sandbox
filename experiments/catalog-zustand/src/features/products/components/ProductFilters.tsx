import { useEffect, useState } from 'react';
import { useCategories } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: ProductFiltersProps) {
  const [inputValue, setInputValue] = useState(search);
  const { data: categories } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(inputValue), 400);
    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange]);

  // Sync when parent clears the search (e.g. category change resets search)
  useEffect(() => {
    if (search === '') setInputValue('');
  }, [search]);

  return (
    <div className="flex flex-col gap-4 mb-6">
      <Input
        placeholder="Search products..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={category === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('')}
        >
          All
        </Button>
        {categories?.map((cat) => (
          <Button
            key={cat.slug}
            variant={category === cat.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat.slug)}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
