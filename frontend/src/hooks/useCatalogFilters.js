import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook for managing catalog filters (marketplace and buy requests)
 * Handles URL state management for filters like species, category, breed, province, and search query
 */
export function useCatalogFilters(basePath) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const getValue = useCallback((key) => {
    return searchParams.get(key) || '';
  }, [searchParams]);
  
  const state = {
    species: getValue('species'),
    category: getValue('category'),
    breed: getValue('breed'),
    province: getValue('province'),
    q: getValue('q'),
    min_qty: getValue('min_qty'),
    max_qty: getValue('max_qty'),
    min_price: getValue('min_price'),
    max_price: getValue('max_price'),
  };
  
  const setFilters = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    // Clear breed when species changes (cascade effect)
    if (updates.species !== undefined && updates.breed === undefined) {
      params.delete('breed');
    }
    
    const newUrl = `${basePath}?${params.toString()}`;
    router.push(newUrl);
  }, [basePath, router, searchParams]);
  
  const clearFilters = useCallback(() => {
    router.push(basePath);
  }, [basePath, router]);
  
  const getFilterParams = useCallback(() => {
    const params = {};
    Object.entries(state).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    return params;
  }, [state]);
  
  return {
    state,
    setFilters,
    clearFilters,
    getFilterParams,
    hasActiveFilters: Object.values(state).some(value => value !== ''),
  };
}