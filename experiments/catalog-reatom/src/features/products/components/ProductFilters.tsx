import { useContext, useEffect, useState } from 'react';
import { wrap } from '@reatom/core';
import { reatomComponent, reatomContext } from '@reatom/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchAtom, categoryAtom, pageAtom, categoriesResource } from '../atoms';

export const ProductFilters = reatomComponent(() => {
  const frame = useContext(reatomContext)!;
  const category = categoryAtom();
  const categories = categoriesResource.data();
  const currentSearch = searchAtom();

  const [inputValue, setInputValue] = useState(currentSearch);

  // Debounce: write to searchAtom 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      frame.run(() => {
        searchAtom.set(inputValue);
        pageAtom.set(1);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue, frame]);

  // Sync input when searchAtom is cleared externally
  useEffect(() => {
    if (currentSearch === '') setInputValue('');
  }, [currentSearch]);

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
          onClick={wrap(() => {
            categoryAtom.set('');
            pageAtom.set(1);
          })}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.slug}
            variant={category === cat.slug ? 'default' : 'outline'}
            size="sm"
            onClick={wrap(() => {
              categoryAtom.set(cat.slug);
              pageAtom.set(1);
            })}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}, 'ProductFilters');
