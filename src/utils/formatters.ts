import {Product, ProductSize} from '../types';

export const LOW_STOCK_THRESHOLD = 4;

export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(safeAmount));
}

export function getEffectivePrice(product: Pick<Product, 'regular_price' | 'discounted_price'>): number {
  if (
    product.discounted_price !== null &&
    product.discounted_price !== undefined &&
    product.discounted_price > 0 &&
    product.discounted_price < product.regular_price
  ) {
    return product.discounted_price;
  }
  return product.regular_price;
}

export function computeDiscountPercentage(regularPrice: number, discountedPrice: number | null): number {
  if (!discountedPrice || discountedPrice <= 0 || discountedPrice >= regularPrice || regularPrice <= 0) {
    return 0;
  }
  return Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
}

export function getTotalProductStock(sizes: ProductSize[]): number {
  return sizes
    .filter((s) => s.is_available)
    .reduce((sum, s) => sum + Math.max(0, s.stock_quantity), 0);
}

export function getAvailableSizes(sizes: ProductSize[]): ProductSize[] {
  return [...sizes]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((s) => s.is_available && s.stock_quantity > 0);
}

export function getSortedSizes(sizes: ProductSize[]): ProductSize[] {
  return [...sizes].sort((a, b) => a.sort_order - b.sort_order);
}

export function isLowStockProduct(sizes: ProductSize[]): boolean {
  const total = getTotalProductStock(sizes);
  if (total === 0) return false;
  return total <= LOW_STOCK_THRESHOLD || sizes.some((s) => s.is_available && s.stock_quantity > 0 && s.stock_quantity <= 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDateShort(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export function resolvePublicAssetUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${cleanBase}${cleanPath}`;
}
