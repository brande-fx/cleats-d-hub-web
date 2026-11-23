import {Product, ProductSection, ProductSize} from '../types';

export const LOW_STOCK_THRESHOLD = 4;

export interface ProductSectionMeta {
  key: ProductSection;
  label: string;
  navLabel: string;
  fullTitle: string;
  singular: string;
  unit: string;
  unitSingular: string;
  sizeHeading: string;
  description: string;
}

export const PRODUCT_SECTION_LIST: ProductSectionMeta[] = [
  {
    key: 'shoes',
    label: 'Shoes',
    navLabel: 'Shoes',
    fullTitle: 'Football Shoes & Cleats',
    singular: 'Shoe / Cleat',
    unit: 'pairs',
    unitSingular: 'pair',
    sizeHeading: 'Select Boot Size',
    description: 'Firm-ground cleats, turf boots, artificial grass studs, and indoor futsal shoes.',
  },
  {
    key: 'jerseys',
    label: 'Football Jerseys',
    navLabel: 'Jerseys',
    fullTitle: 'Football Jerseys',
    singular: 'Football Jersey',
    unit: 'pcs',
    unitSingular: 'piece',
    sizeHeading: 'Select Jersey Size',
    description: 'Matchday home, away, and breathable training kits engineered for pitch comfort.',
  },
  {
    key: 'accessories',
    label: 'Accessories',
    navLabel: 'Accessories',
    fullTitle: 'Football Accessories',
    singular: 'Accessory',
    unit: 'units',
    unitSingular: 'unit',
    sizeHeading: 'Select Size / Option',
    description: 'Match footballs, carbon shin guards, and pro-grip goalkeeper gloves.',
  },
];

export const PRODUCT_SECTION_MAP: Record<ProductSection, ProductSectionMeta> = {
  shoes: PRODUCT_SECTION_LIST[0],
  jerseys: PRODUCT_SECTION_LIST[1],
  accessories: PRODUCT_SECTION_LIST[2],
};

export function normalizeProductSection(value?: string | null): ProductSection {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'jerseys' || normalized === 'jersey' || normalized.includes('jersey')) {
    return 'jerseys';
  }
  if (
    normalized === 'accessories' ||
    normalized === 'accessory' ||
    normalized.includes('accessor')
  ) {
    return 'accessories';
  }
  return 'shoes';
}

export function getProductSectionLabel(section?: ProductSection | string | null): string {
  const key = normalizeProductSection(section);
  return PRODUCT_SECTION_MAP[key].label;
}

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
  if (cleanBase !== '/' && url.startsWith(cleanBase)) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${cleanBase}${cleanPath}`;
}
