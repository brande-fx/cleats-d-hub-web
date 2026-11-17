import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useCart} from '../hooks/useCart';
import {Product} from '../types';
import {
  formatCurrency,
  getAvailableSizes,
  getEffectivePrice,
  getSortedSizes,
  getTotalProductStock,
} from '../utils/formatters';
import {ResilientImage} from './ResilientImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({product}) => {
  const {addToCart} = useCart();
  const sortedSizes = getSortedSizes(product.sizes);
  const availableSizes = getAvailableSizes(product.sizes);
  const totalStock = getTotalProductStock(product.sizes);
  const isOutOfStock = totalStock <= 0 || availableSizes.length === 0;

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = effectivePrice < product.regular_price && product.discount_percentage > 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!selectedSize) {
      setFeedback('Select a size above first');
      return;
    }
    const result = addToCart(product, selectedSize, 1);
    if (!result.ok) {
      setFeedback(result.error || 'Could not add item');
    } else {
      setFeedback(null);
    }
  };

  return (
    <article className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-lg overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5">
      {/* 4:3 Studio Footwear Image */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative aspect-[4/3] bg-[#E8E7E5] overflow-hidden focus-visible:outline-2 focus-visible:outline-[#FD7B41]"
      >
        <ResilientImage
          src={product.image_url}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-[#FD7B41] text-[#1F2225] font-mono-num text-xs font-semibold px-2 py-1 rounded-sm">
            Save {product.discount_percentage}%
          </span>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Clean Unboxed Metadata */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#3C4044]/70">
            <span className="truncate">
              {product.brand} · {product.category_name || 'Footwear'}
            </span>
            <span
              className={`font-medium shrink-0 ${
                isOutOfStock ? 'text-red-700' : 'text-[#3C4044]'
              }`}
            >
              {isOutOfStock ? 'Out of stock' : `${totalStock} in stock`}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-display text-base font-bold text-[#1F2225] leading-snug line-clamp-1">
            <Link to={`/product/${product.slug}`} className="hover:text-[#FD7B41] transition-colors">
              {product.name}
            </Link>
          </h3>

          {/* Pricing Baseline */}
          <div className="flex items-baseline gap-2.5 pt-0.5">
            <span className="font-mono-num text-base font-bold text-[#1F2225]">
              {formatCurrency(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="font-mono-num text-xs text-[#3C4044]/60 line-through">
                {formatCurrency(product.regular_price)}
              </span>
            )}
            {product.offer_label && (
              <span className="text-xs font-medium text-[#FD7B41] ml-auto truncate">
                {product.offer_label}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Size Selector */}
        <div className="space-y-2 pt-2 border-t border-[#3C4044]/10">
          <div className="flex items-center justify-between text-xs text-[#3C4044]/75">
            <span>Select size</span>
            {selectedSize && (
              <span className="font-mono-num font-medium text-[#1F2225]">{selectedSize}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {sortedSizes.map((sz) => {
              const available = sz.is_available && sz.stock_quantity > 0;
              const active = selectedSize === sz.size_label;
              return (
                <button
                  key={sz.id}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    setSelectedSize(sz.size_label);
                    setFeedback(null);
                  }}
                  title={available ? `${sz.size_label}: ${sz.stock_quantity} left` : `${sz.size_label}: Out of stock`}
                  className={`px-2 py-1 text-xs font-mono-num rounded-sm border transition-colors duration-150 whitespace-nowrap ${
                    !available
                      ? 'border-[#3C4044]/10 text-[#3C4044]/35 bg-[#DDDCDB]/40 line-through cursor-not-allowed'
                      : active
                        ? 'border-[#3C4044] bg-[#3C4044] text-[#F7F6F5] font-semibold cursor-pointer'
                        : 'border-[#3C4044]/25 bg-white text-[#3C4044] hover:border-[#FD7B41] cursor-pointer'
                  }`}
                >
                  {sz.size_label}
                </button>
              );
            })}
          </div>

          {feedback && (
            <p className="text-xs font-medium text-[#b54708]" role="status">
              {feedback}
            </p>
          )}
        </div>

        {/* Card Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Link
            to={`/product/${product.slug}`}
            className="inline-flex items-center justify-center px-3 py-2.5 min-h-[40px] text-xs font-semibold text-[#3C4044] bg-[#E9E8E6] hover:bg-[#DDDCDB] rounded-md transition-colors whitespace-nowrap"
          >
            View Details
          </Link>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`inline-flex items-center justify-center px-3 py-2.5 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              isOutOfStock
                ? 'bg-[#DDDCDB] text-[#3C4044]/50 cursor-not-allowed'
                : 'bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] cursor-pointer'
            }`}
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
};
