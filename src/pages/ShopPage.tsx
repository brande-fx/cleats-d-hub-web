import React, {useEffect, useMemo, useState} from 'react';
import {Search, SlidersHorizontal, X} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {ProductCard} from '../components/ProductCard';
import {useStoreData} from '../hooks/useStoreData';
import {getEffectivePrice, getTotalProductStock} from '../utils/formatters';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'discount';

export const ShopPage: React.FC = () => {
  const {products, loading} = useStoreData();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialOffers = searchParams.get('offers') === 'true';
  const initialBrand = searchParams.get('brand') || 'all';

  const [offersOnly, setOffersOnly] = useState(initialOffers);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    setOffersOnly(searchParams.get('offers') === 'true');
    setSelectedBrand(searchParams.get('brand') || 'all');
  }, [searchParams]);

  const availableBrands = useMemo(() => {
    const counts = new Map<string, {label: string; count: number}>();
    for (const p of products) {
      const trimmed = p.brand.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {label: trimmed, count: 1});
      }
    }
    return Array.from(counts.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const handleOffersToggle = (checked: boolean) => {
    setOffersOnly(checked);
    const next = new URLSearchParams(searchParams);
    if (checked) {
      next.set('offers', 'true');
    } else {
      next.delete('offers');
    }
    setSearchParams(next, {replace: true});
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    const next = new URLSearchParams(searchParams);
    if (brand && brand !== 'all') {
      next.set('brand', brand);
    } else {
      next.delete('brand');
    }
    setSearchParams(next, {replace: true});
  };

  const resetFilters = () => {
    setOffersOnly(false);
    setSelectedBrand('all');
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('newest');
    setSearchParams({}, {replace: true});
  };

  const hasActiveFilters =
    selectedBrand !== 'all' || offersOnly || inStockOnly || searchQuery.trim().length > 0;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeBrand = selectedBrand.trim().toLowerCase();

    const matched = products.filter((product) => {
      if (activeBrand !== 'all' && product.brand.trim().toLowerCase() !== activeBrand) {
        return false;
      }
      if (offersOnly && !product.is_special_offer && product.discount_percentage <= 0) {
        return false;
      }
      if (inStockOnly && getTotalProductStock(product.sizes) <= 0) {
        return false;
      }
      if (q) {
        const matchesText =
          product.name.toLowerCase().includes(q) ||
          product.brand.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'price-asc') {
        return getEffectivePrice(a) - getEffectivePrice(b);
      }
      if (sortBy === 'price-desc') {
        return getEffectivePrice(b) - getEffectivePrice(a);
      }
      if (sortBy === 'discount') {
        return b.discount_percentage - a.discount_percentage;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [inStockOnly, offersOnly, products, searchQuery, selectedBrand, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3C4044]/15 pb-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold text-[#1F2225]">
            {offersOnly ? 'Special Cleat Offers' : 'Football Boots & Cleats'}
          </h1>
          <p className="text-sm text-[#3C4044]/80">
            Showing <span className="font-mono-num font-semibold text-[#1F2225]">{filteredProducts.length}</span> of{' '}
            <span className="font-mono-num">{products.length}</span> active pairs
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#3C4044]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cleat, boot, or brand…"
              aria-label="Search football boots by name or brand"
              className="w-full pl-9 pr-3 py-2 min-h-[40px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-sm text-[#1F2225] placeholder:text-[#3C4044]/55 focus:outline-2 focus:outline-[#FD7B41]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#3C4044]/70 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort football boots"
              className="px-3 py-2 min-h-[40px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brand & Availability Filters */}
      <div className="space-y-4">
        {availableBrands.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter products by brand">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3C4044]/75 mr-1">
              Brand
            </span>
            <button
              type="button"
              onClick={() => handleBrandChange('all')}
              className={`px-3.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedBrand === 'all'
                  ? 'bg-[#3C4044] text-[#F7F6F5]'
                  : 'bg-[#F7F6F5] border border-[#3C4044]/20 text-[#3C4044] hover:border-[#3C4044]/45 hover:text-[#1F2225]'
              }`}
            >
              All Brands ({products.length})
            </button>
            {availableBrands.map((brand) => {
              const isSelected = selectedBrand.trim().toLowerCase() === brand.label.toLowerCase();
              return (
                <button
                  key={brand.label}
                  type="button"
                  onClick={() => handleBrandChange(isSelected ? 'all' : brand.label)}
                  className={`px-3.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#3C4044] text-[#F7F6F5]'
                      : 'bg-[#F7F6F5] border border-[#3C4044]/20 text-[#3C4044] hover:border-[#3C4044]/45 hover:text-[#1F2225]'
                  }`}
                >
                  {brand.label} ({brand.count})
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5 text-sm text-[#3C4044]">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#FD7B41] rounded-sm"
              />
              <span>Available pairs only</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={offersOnly}
                onChange={(e) => handleOffersToggle(e.target.checked)}
                className="w-4 h-4 accent-[#FD7B41] rounded-sm"
              />
              <span>Special offers only</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3C4044] hover:text-[#FD7B41] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-[420px] rounded-lg bg-[#F7F6F5] border border-[#3C4044]/10 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-12 text-center space-y-4">
          <p className="font-display text-lg font-bold text-[#1F2225]">No football boots match your current filters</p>
          <p className="text-sm text-[#3C4044]/80 max-w-md mx-auto">
            Try clearing your search term or resetting your filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
