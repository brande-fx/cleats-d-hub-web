import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, Check, ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck} from 'lucide-react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ResilientImage} from '../components/ResilientImage';
import {useCart} from '../hooks/useCart';
import {useStoreData} from '../hooks/useStoreData';
import {
  formatCurrency,
  getEffectivePrice,
  getSortedSizes,
  getTotalProductStock,
  PRODUCT_SECTION_MAP,
} from '../utils/formatters';

export const ProductDetailsPage: React.FC = () => {
  const {slug} = useParams<{slug: string}>();
  const {products, loading} = useStoreData();
  const {addToCart} = useCart();
  const navigate = useNavigate();

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [feedback, setFeedback] = useState<{type: 'error' | 'success'; text: string} | null>(null);

  useEffect(() => {
    setSelectedImage('');
    setSelectedSize('');
    setQuantity(1);
    setFeedback(null);
  }, [product?.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-[500px] rounded-xl bg-[#F7F6F5] border border-[#3C4044]/10 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#1F2225]">Product not found</h1>
        <p className="text-sm text-[#3C4044]/80">
          This item may have been removed or deactivated by the store administrator.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FD7B41] text-[#1F2225] font-semibold text-sm rounded-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>
      </div>
    );
  }

  const sectionMeta = PRODUCT_SECTION_MAP[product.product_section || 'shoes'];

  const gallery = Array.from(
    new Set([product.image_url, ...(product.gallery_urls || [])].filter(Boolean))
  );
  const activeImage = selectedImage && gallery.includes(selectedImage) ? selectedImage : gallery[0] || '';
  const activeIndex = Math.max(0, gallery.indexOf(activeImage));
  const sortedSizes = getSortedSizes(product.sizes);
  const totalStock = getTotalProductStock(product.sizes);
  const selectedSizeRow = sortedSizes.find((s) => s.size_label === selectedSize);
  const maxSelectableQty = selectedSizeRow?.is_available ? selectedSizeRow.stock_quantity : 0;

  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = effectivePrice < product.regular_price && product.discount_percentage > 0;

  const handleSizeSelect = (sizeLabel: string, stock: number) => {
    setSelectedSize(sizeLabel);
    setQuantity((prev) => Math.min(Math.max(1, prev), Math.max(1, stock)));
    setFeedback(null);
  };

  const handleAddToCart = (goToCheckout = false) => {
    if (!selectedSize) {
      setFeedback({type: 'error', text: 'Please select an available size before continuing.'});
      return;
    }
    const res = addToCart(product, selectedSize, quantity);
    if (!res.ok) {
      setFeedback({type: 'error', text: res.error || 'Unable to add item to cart.'});
      return;
    }
    setFeedback({type: 'success', text: `Added ${quantity} × ${product.name} (${selectedSize}) to cart.`});
    if (goToCheckout) {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#3C4044]/75">
        <Link
          to={`/shop?section=${sectionMeta.key}`}
          className="inline-flex items-center gap-1.5 hover:text-[#1F2225] font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{sectionMeta.fullTitle}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.brand}</span>
        <span aria-hidden="true">/</span>
        <span className="text-[#1F2225] font-medium truncate">{product.name}</span>
      </div>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden group">
            <ResilientImage
              src={activeImage}
              alt={`${product.name} — Photo ${activeIndex + 1}`}
              fallbackLabel={product.name}
              priority
              className="w-full h-full object-cover"
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage(gallery[(activeIndex - 1 + gallery.length) % gallery.length])
                  }
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#F7F6F5]/90 hover:bg-white text-[#1F2225] border border-[#3C4044]/15 inline-flex items-center justify-center shadow-sm cursor-pointer transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(gallery[(activeIndex + 1) % gallery.length])}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#F7F6F5]/90 hover:bg-white text-[#1F2225] border border-[#3C4044]/15 inline-flex items-center justify-center shadow-sm cursor-pointer transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 right-3 bg-[#1F2225]/80 text-[#F7F6F5] font-mono-num text-xs font-medium px-2.5 py-1 rounded-sm">
                  {activeIndex + 1} / {gallery.length}
                </span>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  aria-label={`View photo ${idx + 1} of ${gallery.length}`}
                  className={`w-24 h-20 rounded-md overflow-hidden border-2 shrink-0 cursor-pointer transition-colors ${
                    activeImage === imgUrl ? 'border-[#FD7B41]' : 'border-[#3C4044]/15 hover:border-[#3C4044]/40'
                  }`}
                >
                  <ResilientImage src={imgUrl} alt={`${product.name} angle ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications, Size Inventory & Purchase Controls */}
        <div className="lg:col-span-5 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-[#3C4044]/10 pb-5">
            <div className="flex items-center justify-between gap-3 text-xs text-[#3C4044]/75">
              <span>
                {product.brand} · {sectionMeta.fullTitle}
              </span>
              <span className={`font-medium ${totalStock > 0 ? 'text-[#3C4044]' : 'text-red-700'}`}>
                {totalStock > 0
                  ? `${totalStock} total ${sectionMeta.unit} in stock`
                  : 'Currently out of stock'}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1F2225] leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-mono-num text-2xl font-bold text-[#1F2225]">
                {formatCurrency(effectivePrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="font-mono-num text-base text-[#3C4044]/55 line-through">
                    {formatCurrency(product.regular_price)}
                  </span>
                  <span className="font-mono-num text-xs font-semibold bg-[#FD7B41] text-[#1F2225] px-2 py-0.5 rounded-sm">
                    Save {product.discount_percentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#3C4044]/90 leading-relaxed">{product.description}</p>

          {/* Size Selector with Per-Size Stock */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#1F2225]">{sectionMeta.sizeHeading}</span>
              {selectedSizeRow ? (
                <span className="font-mono-num text-xs text-[#3C4044]">
                  {selectedSizeRow.size_label} · {selectedSizeRow.stock_quantity}{' '}
                  {selectedSizeRow.stock_quantity === 1
                    ? sectionMeta.unitSingular
                    : sectionMeta.unit}{' '}
                  left
                </span>
              ) : (
                <span className="text-xs text-[#3C4044]/70">Required before adding to cart</span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {sortedSizes.map((sz) => {
                const available = sz.is_available && sz.stock_quantity > 0;
                const active = selectedSize === sz.size_label;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    disabled={!available}
                    onClick={() => handleSizeSelect(sz.size_label, sz.stock_quantity)}
                    className={`p-2.5 rounded-md border text-left transition-colors ${
                      !available
                        ? 'bg-[#DDDCDB]/45 border-[#3C4044]/10 text-[#3C4044]/40 cursor-not-allowed'
                        : active
                          ? 'bg-[#3C4044] border-[#3C4044] text-[#F7F6F5] cursor-pointer'
                          : 'bg-white border-[#3C4044]/20 text-[#1F2225] hover:border-[#FD7B41] cursor-pointer'
                    }`}
                  >
                    <span className="block font-mono-num text-xs font-bold">{sz.size_label}</span>
                    <span
                      className={`block font-mono-num text-[11px] ${
                        !available
                          ? 'text-[#3C4044]/40'
                          : active
                            ? 'text-[#EDBF9B]'
                            : sz.stock_quantity <= 3
                              ? 'text-[#b54708]'
                              : 'text-[#3C4044]/70'
                      }`}
                    >
                      {available ? `${sz.stock_quantity} left` : 'Out'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#3C4044]/10">
            <span className="text-sm font-semibold text-[#1F2225]">Quantity</span>
            <div className="inline-flex items-center border border-[#3C4044]/25 rounded-md bg-white">
              <button
                type="button"
                disabled={quantity <= 1 || !selectedSize}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 inline-flex items-center justify-center text-[#3C4044] hover:bg-[#DDDCDB]/50 disabled:opacity-40 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono-num text-sm font-bold px-4 text-[#1F2225]">{quantity}</span>
              <button
                type="button"
                disabled={!selectedSize || quantity >= maxSelectableQty}
                onClick={() => setQuantity((q) => Math.min(maxSelectableQty, q + 1))}
                className="w-10 h-10 inline-flex items-center justify-center text-[#3C4044] hover:bg-[#DDDCDB]/50 disabled:opacity-40 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              role="status"
              className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-[#EDBF9B]/45 border border-[#3C4044]/15 text-[#1F2225]'
              }`}
            >
              {feedback.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={totalStock <= 0}
              onClick={() => handleAddToCart(false)}
              className="w-full py-3.5 px-5 min-h-[46px] bg-[#FD7B41] hover:bg-[#fc6b2b] disabled:bg-[#DDDCDB] disabled:text-[#3C4044]/50 text-[#1F2225] font-bold text-sm rounded-md transition-colors cursor-pointer"
            >
              {totalStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button
              type="button"
              disabled={totalStock <= 0}
              onClick={() => handleAddToCart(true)}
              className="w-full py-3 px-5 min-h-[44px] bg-[#3C4044] hover:bg-[#1F2225] disabled:opacity-40 text-[#F7F6F5] font-semibold text-sm rounded-md transition-colors cursor-pointer"
            >
              Checkout via WhatsApp
            </button>
          </div>

          <div className="flex items-start gap-2.5 pt-2 text-xs text-[#3C4044]/75">
            <ShieldCheck className="w-4 h-4 text-[#3C4044] shrink-0 mt-0.5" />
            <span>
              No online card payment required now. Submit your order via WhatsApp and confirm delivery directly with our team.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
