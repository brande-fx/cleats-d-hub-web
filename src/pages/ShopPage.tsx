import React, {useEffect, useMemo, useState} from 'react';
import {Search, SlidersHorizontal, X} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {ProductCard} from '../components/ProductCard';
import {useStoreData} from '../hooks/useStoreData';
import {getEffectivePrice, getTotalProductStock} from '../utils/formatters';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'discount';

export const ShopPage: React.FC = () => {
  const {products, categories, loading} = useStoreData();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'all';
  const initialOffers = searchParams.get('offers') === 'true';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [offersOnly, setOffersOnly] = useState(initialOffers);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setOffersOnly(searchParams.get('offers') === 'true');
  }, [searchParams]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    const next = new URLSearchParams(searchParams);
    if (slug === 'all') {
      next.delete('category');
    } else {
      next.set('category', slug);
    }
    setSearchParams(next, {replace: true});
  };

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

  const resetFilters = () => {
    setSelectedCategory('all');
    setOffersOnly(false);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('newest');
    setSearchParams({}, {replace: true});
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = products.filter((product) => {
      if (selectedCategory !== 'all' && product.category_slug !== selectedCategory) {
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
          (product.category_name || '').toLowerCase().includes(q);
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
  }, [inStockOnly, offersOnly, products, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3C4044]/15 pb-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold text-[#1F2225]">
            {offersOnly ? 'Special Footwear Offers' : 'Footwear Catalogue'}
          </h1>
          <p className="text-sm text-[#3C4044]/80">
            Showing <span className="font-mono-num font-semibold text-[#1F2225]">{filteredProducts.length}</span> of{' '}
            <span className="font-mono-num">{products.length}</span> active models
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
              placeholder="Search shoe or brand…"
              aria-label="Search products by name or brand"
              className="w-full pl-9 pr-3 py-2 min-h-[40px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-sm text-[#1F2225] placeholder:text-[#3C4044]/55 focus:outline-2 focus:outline-[#FD7B41]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#3C4044]/70 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
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

      {/* Category Filter Tabs & Availability Checkboxes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#3C4044] text-[#F7F6F5]'
                : 'bg-[#F7F6F5] text-[#3C4044] border border-[#3C4044]/15 hover:border-[#3C4044]/40'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-[#3C4044] text-[#F7F6F5]'
                  : 'bg-[#F7F6F5] text-[#3C4044] border border-[#3C4044]/15 hover:border-[#3C4044]/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-[#3C4044]">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-[#FD7B41] rounded-sm"
            />
            <span>Available products only</span>
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
          <p className="font-display text-lg font-bold text-[#1F2225]">No shoes match your current filters</p>
          <p className="text-sm text-[#3C4044]/80 max-w-md mx-auto">
            Try clearing your search term or switching back to all categories.
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
