import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {DEFAULT_STORE_SETTINGS} from '../services/seedData';
import {fetchCategories, fetchProducts, fetchStoreSettings} from '../services/storeService';
import {Category, Product, StoreSettings} from '../types';

interface StoreDataContextValue {
  products: Product[];
  allProducts: Product[];
  categories: Category[];
  settings: StoreSettings;
  loading: boolean;
  error: string | null;
  refreshStore: (includeInactive?: boolean) => Promise<void>;
}

const StoreDataContext = createContext<StoreDataContextValue | null>(null);

export const StoreDataProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStore = useCallback(async (includeInactive = false) => {
    try {
      setError(null);
      const [fetchedSettings, fetchedCategories, fetchedPublicProducts] = await Promise.all([
        fetchStoreSettings(),
        fetchCategories(),
        fetchProducts(false),
      ]);
      setSettings(fetchedSettings);
      setCategories(fetchedCategories);
      setProducts(fetchedPublicProducts);

      if (includeInactive) {
        const fetchedAll = await fetchProducts(true);
        setAllProducts(fetchedAll);
      } else {
        setAllProducts(fetchedPublicProducts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load store catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStore(false);
  }, [refreshStore]);

  return (
    <StoreDataContext.Provider
      value={{
        products,
        allProducts,
        categories,
        settings,
        loading,
        error,
        refreshStore,
      }}
    >
      {children}
    </StoreDataContext.Provider>
  );
};

export function useStoreData(): StoreDataContextValue {
  const ctx = useContext(StoreDataContext);
  if (!ctx) {
    throw new Error('useStoreData must be used inside StoreDataProvider');
  }
  return ctx;
}
