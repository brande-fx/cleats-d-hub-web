import React, {useState} from 'react';
import {Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {useCart} from '../hooks/useCart';
import {useStoreData} from '../hooks/useStoreData';
import {formatCurrency, getAvailableSizes} from '../utils/formatters';
import {ResilientImage} from './ResilientImage';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    totalItems,
    subtotal,
    deliveryCharge,
    totalAmount,
    closeCart,
    updateQuantity,
    changeItemSize,
    removeFromCart,
  } = useCart();
  const {products, settings} = useStoreData();
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F2225]/50 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-md bg-[#F7F6F5] h-full flex flex-col border-l border-[#3C4044]/15 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3C4044]/15 flex items-center justify-between gap-4 bg-[#DDDCDB]/60">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#3C4044]" />
            <h2 className="font-display text-base font-bold text-[#1F2225]">
              Shopping Cart ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="w-10 h-10 inline-flex items-center justify-center rounded-md text-[#3C4044] hover:bg-[#3C4044]/10 cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Notice */}
        {cartNotice && (
          <div className="px-6 py-2.5 bg-[#EDBF9B]/40 border-b border-[#3C4044]/10 text-xs font-medium text-[#1F2225] flex items-center justify-between gap-2">
            <span>{cartNotice}</span>
            <button
              type="button"
              onClick={() => setCartNotice(null)}
              className="underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#DDDCDB] flex items-center justify-center text-[#3C4044]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-base font-semibold text-[#1F2225]">Your cart is empty</p>
                <p className="text-sm text-[#3C4044]/75 max-w-xs">
                  Select a shoe size on any product to add it to your bag.
                </p>
              </div>
              <Link
                to="/shop"
                onClick={closeCart}
                className="px-5 py-2.5 bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] text-sm font-semibold rounded-md transition-colors"
              >
                Browse Footwear
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const liveProduct = products.find((p) => p.id === item.product_id);
              const availableSizes = liveProduct ? getAvailableSizes(liveProduct.sizes) : [];
              const currentSizeStock =
                liveProduct?.sizes.find((s) => s.size_label === item.size_label)?.stock_quantity ?? 99;

              return (
                <div
                  key={`${item.product_id}-${item.size_label}`}
                  className="flex gap-4 pb-5 border-b border-[#3C4044]/10 last:border-b-0"
                >
                  <Link
                    to={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="w-24 h-20 rounded-md overflow-hidden bg-[#E8E7E5] shrink-0 border border-[#3C4044]/10"
                  >
                    <ResilientImage src={item.image_url} alt={item.name} />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-[#3C4044]/70 truncate">{item.brand}</p>
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-display text-sm font-semibold text-[#1F2225] hover:text-[#FD7B41] block truncate"
                        >
                          {item.name}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id, item.size_label)}
                        className="p-1.5 text-[#3C4044]/60 hover:text-red-700 cursor-pointer shrink-0"
                        aria-label={`Remove ${item.name} size ${item.size_label}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Size Switcher & Price */}
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs text-[#3C4044]">
                        <span>Size:</span>
                        <select
                          value={item.size_label}
                          onChange={(e) => {
                            const res = changeItemSize(item.product_id, item.size_label, e.target.value);
                            if (!res.ok && res.error) setCartNotice(res.error);
                          }}
                          className="font-mono-num text-xs bg-white border border-[#3C4044]/25 rounded-sm px-1.5 py-1 text-[#1F2225]"
                          aria-label={`Change size for ${item.name}`}
                        >
                          {availableSizes.length > 0 ? (
                            availableSizes.map((sz) => (
                              <option key={sz.id} value={sz.size_label}>
                                {sz.size_label} ({sz.stock_quantity} left)
                              </option>
                            ))
                          ) : (
                            <option value={item.size_label}>{item.size_label}</option>
                          )}
                        </select>
                      </label>

                      <div className="text-right">
                        <span className="font-mono-num text-sm font-bold text-[#1F2225]">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                        {item.unit_price < item.regular_price && (
                          <span className="block font-mono-num text-[11px] text-[#3C4044]/60 line-through">
                            {formatCurrency(item.regular_price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center border border-[#3C4044]/25 rounded-sm bg-white">
                        <button
                          type="button"
                          onClick={() => {
                            setCartNotice(null);
                            updateQuantity(item.product_id, item.size_label, item.quantity - 1);
                          }}
                          className="w-8 h-8 inline-flex items-center justify-center text-[#3C4044] hover:bg-[#DDDCDB]/60 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-num text-xs font-semibold px-3 text-[#1F2225]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= currentSizeStock}
                          onClick={() => {
                            const res = updateQuantity(item.product_id, item.size_label, item.quantity + 1);
                            if (!res.ok && res.error) setCartNotice(res.error);
                          }}
                          className="w-8 h-8 inline-flex items-center justify-center text-[#3C4044] hover:bg-[#DDDCDB]/60 disabled:opacity-40 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono-num text-xs text-[#3C4044]/70">
                        {formatCurrency(item.unit_price)} each
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary & Actions */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#3C4044]/15 bg-[#E9E8E6] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-[#3C4044]">
                <span>Subtotal</span>
                <span className="font-mono-num font-semibold text-[#1F2225]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#3C4044]">
                <span>Delivery</span>
                <span className="font-mono-num font-medium text-[#1F2225]">
                  {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                </span>
              </div>
              {settings.free_delivery_threshold > 0 && subtotal < settings.free_delivery_threshold && (
                <p className="text-xs text-[#3C4044]/80">
                  Add {formatCurrency(settings.free_delivery_threshold - subtotal)} more for free delivery.
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#3C4044]/15 text-base font-bold text-[#1F2225]">
                <span>Total</span>
                <span className="font-mono-num">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3 px-4 min-h-[44px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors cursor-pointer"
              >
                Proceed to WhatsApp Checkout
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="w-full py-2.5 px-4 min-h-[40px] bg-white hover:bg-[#DDDCDB] border border-[#3C4044]/20 text-[#3C4044] font-medium text-sm rounded-md transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
