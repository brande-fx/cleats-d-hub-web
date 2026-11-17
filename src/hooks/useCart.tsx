import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {CartItem, Product} from '../types';
import {getEffectivePrice} from '../utils/formatters';
import {useStoreData} from './useStoreData';

const CART_STORAGE_KEY = 'calcite_footwear_cart_v1';

interface CartValidationIssue {
  productId: string;
  sizeLabel: string;
  message: string;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, sizeLabel: string, quantity?: number) => {ok: boolean; error?: string};
  removeFromCart: (productId: string, sizeLabel: string) => void;
  updateQuantity: (productId: string, sizeLabel: string, quantity: number) => {ok: boolean; error?: string};
  changeItemSize: (productId: string, oldSizeLabel: string, newSizeLabel: string) => {ok: boolean; error?: string};
  clearCart: () => void;
  validateCartAvailability: () => CartValidationIssue[];
}

const CartContext = createContext<CartContextValue | null>(null);

function readPersistedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {products, settings} = useStoreData();
  const [items, setItems] = useState<CartItem[]>(() => readPersistedCart());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write errors
    }
  }, [items]);

  // Keep cart item prices synced with latest product catalog prices (never rely on stale local prices)
  const syncedItems = useMemo(() => {
    if (products.length === 0) return items;
    return items.map((item) => {
      const liveProduct = products.find((p) => p.id === item.product_id);
      if (!liveProduct) return item;
      const livePrice = getEffectivePrice(liveProduct);
      return {
        ...item,
        name: liveProduct.name,
        brand: liveProduct.brand,
        image_url: liveProduct.image_url || item.image_url,
        regular_price: liveProduct.regular_price,
        unit_price: livePrice,
        discount_percentage: liveProduct.discount_percentage,
      };
    });
  }, [items, products]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback(
    (product: Product, sizeLabel: string, quantity = 1): {ok: boolean; error?: string} => {
      if (!sizeLabel) {
        return {ok: false, error: 'Please select a shoe size first.'};
      }
      const sizeRecord = product.sizes.find((s) => s.size_label === sizeLabel);
      if (!sizeRecord || !sizeRecord.is_available || sizeRecord.stock_quantity <= 0) {
        return {ok: false, error: `${sizeLabel} is currently out of stock.`};
      }

      const existing = items.find((i) => i.product_id === product.id && i.size_label === sizeLabel);
      const nextQty = (existing?.quantity || 0) + quantity;
      if (nextQty > sizeRecord.stock_quantity) {
        return {
          ok: false,
          error: `Only ${sizeRecord.stock_quantity} pair(s) available in ${sizeLabel}.`,
        };
      }

      const effectivePrice = getEffectivePrice(product);
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.product_id === product.id && i.size_label === sizeLabel);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            quantity: nextQty,
            unit_price: effectivePrice,
            regular_price: product.regular_price,
            discount_percentage: product.discount_percentage,
          };
          return copy;
        }
        return [
          ...prev,
          {
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image_url: product.image_url,
            size_label: sizeLabel,
            quantity,
            regular_price: product.regular_price,
            unit_price: effectivePrice,
            discount_percentage: product.discount_percentage,
          },
        ];
      });
      setIsOpen(true);
      return {ok: true};
    },
    [items]
  );

  const removeFromCart = useCallback((productId: string, sizeLabel: string) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === productId && i.size_label === sizeLabel)));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, sizeLabel: string, quantity: number): {ok: boolean; error?: string} => {
      if (quantity <= 0) {
        removeFromCart(productId, sizeLabel);
        return {ok: true};
      }
      const liveProduct = products.find((p) => p.id === productId);
      const sizeRecord = liveProduct?.sizes.find((s) => s.size_label === sizeLabel);
      if (sizeRecord && quantity > sizeRecord.stock_quantity) {
        return {
          ok: false,
          error: `Maximum ${sizeRecord.stock_quantity} pair(s) available for ${sizeLabel}.`,
        };
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId && i.size_label === sizeLabel ? {...i, quantity} : i
        )
      );
      return {ok: true};
    },
    [products, removeFromCart]
  );

  const changeItemSize = useCallback(
    (productId: string, oldSizeLabel: string, newSizeLabel: string): {ok: boolean; error?: string} => {
      if (oldSizeLabel === newSizeLabel) return {ok: true};

      const liveProduct = products.find((p) => p.id === productId);
      const newSizeRecord = liveProduct?.sizes.find((s) => s.size_label === newSizeLabel);
      if (!newSizeRecord || !newSizeRecord.is_available || newSizeRecord.stock_quantity <= 0) {
        return {ok: false, error: `${newSizeLabel} is out of stock.`};
      }

      const currentItem = items.find((i) => i.product_id === productId && i.size_label === oldSizeLabel);
      if (!currentItem) return {ok: false, error: 'Cart item not found.'};

      const existingTarget = items.find((i) => i.product_id === productId && i.size_label === newSizeLabel);
      const combinedQty = currentItem.quantity + (existingTarget?.quantity || 0);
      const clampedQty = Math.min(combinedQty, newSizeRecord.stock_quantity);

      setItems((prev) => {
        const filtered = prev.filter(
          (i) => !(i.product_id === productId && (i.size_label === oldSizeLabel || i.size_label === newSizeLabel))
        );
        return [
          ...filtered,
          {
            ...currentItem,
            size_label: newSizeLabel,
            quantity: clampedQty,
          },
        ];
      });
      return {ok: true};
    },
    [items, products]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const validateCartAvailability = useCallback((): CartValidationIssue[] => {
    const issues: CartValidationIssue[] = [];
    for (const item of syncedItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || !product.is_active) {
        issues.push({
          productId: item.product_id,
          sizeLabel: item.size_label,
          message: `${item.name} is currently unavailable.`,
        });
        continue;
      }
      const sizeRow = product.sizes.find((s) => s.size_label === item.size_label);
      if (!sizeRow || !sizeRow.is_available || sizeRow.stock_quantity <= 0) {
        issues.push({
          productId: item.product_id,
          sizeLabel: item.size_label,
          message: `${item.name} (${item.size_label}) is out of stock.`,
        });
      } else if (item.quantity > sizeRow.stock_quantity) {
        issues.push({
          productId: item.product_id,
          sizeLabel: item.size_label,
          message: `Only ${sizeRow.stock_quantity} left for ${item.name} (${item.size_label}).`,
        });
      }
    }
    return issues;
  }, [products, syncedItems]);

  const totalItems = useMemo(() => syncedItems.reduce((sum, i) => sum + i.quantity, 0), [syncedItems]);
  const subtotal = useMemo(
    () => syncedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    [syncedItems]
  );
  const deliveryCharge = useMemo(() => {
    if (syncedItems.length === 0) return 0;
    if (settings.free_delivery_threshold > 0 && subtotal >= settings.free_delivery_threshold) {
      return 0;
    }
    return settings.delivery_charge;
  }, [settings.delivery_charge, settings.free_delivery_threshold, subtotal, syncedItems.length]);
  const totalAmount = subtotal + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        items: syncedItems,
        isOpen,
        totalItems,
        subtotal,
        deliveryCharge,
        totalAmount,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        changeItemSize,
        clearCart,
        validateCartAvailability,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}
