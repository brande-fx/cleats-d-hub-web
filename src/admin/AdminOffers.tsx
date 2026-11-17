import React, {useState} from 'react';
import {Save, Tag, Trash2} from 'lucide-react';
import {useStoreData} from '../hooks/useStoreData';
import {toggleProductFlag, updateStoreSettings} from '../services/storeService';
import {Product} from '../types';
import {computeDiscountPercentage, formatCurrency} from '../utils/formatters';

export const AdminOffers: React.FC = () => {
  const {allProducts, settings, refreshStore} = useStoreData();
  const [bannerText, setBannerText] = useState(settings.promo_banner_text);
  const [bannerActive, setBannerActive] = useState(settings.promo_banner_active);
  const [savingBanner, setSavingBanner] = useState(false);

  const [saleEdits, setSaleEdits] = useState<Record<string, {price: string; label: string}>>({});
  const [feedback, setFeedback] = useState<{type: 'error' | 'success'; text: string} | null>(null);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    setFeedback(null);
    try {
      await updateStoreSettings({
        promo_banner_text: bannerText.trim(),
        promo_banner_active: bannerActive,
      });
      await refreshStore(true);
      setFeedback({type: 'success', text: 'Promotional banner updated.'});
    } catch (err) {
      setFeedback({type: 'error', text: err instanceof Error ? err.message : 'Failed to update banner.'});
    } finally {
      setSavingBanner(false);
    }
  };

  const handleApplyDiscount = async (product: Product) => {
    setFeedback(null);
    const edit = saleEdits[product.id];
    const salePriceNum = edit ? Number(edit.price) : product.discounted_price || 0;
    const label = edit ? edit.label : product.offer_label;

    if (!salePriceNum || salePriceNum <= 0 || salePriceNum >= product.regular_price) {
      setFeedback({
        type: 'error',
        text: `Sale price for ${product.name} must be greater than ₹0 and less than ${formatCurrency(product.regular_price)}.`,
      });
      return;
    }

    const pct = computeDiscountPercentage(product.regular_price, salePriceNum);
    try {
      await toggleProductFlag(product.id, {
        discounted_price: salePriceNum,
        discount_percentage: pct,
        is_special_offer: true,
        offer_label: label.trim() || `${pct}% Off`,
      });
      await refreshStore(true);
      setFeedback({type: 'success', text: `Applied ${pct}% discount to ${product.name}.`});
    } catch (err) {
      setFeedback({type: 'error', text: err instanceof Error ? err.message : 'Failed to apply discount.'});
    }
  };

  const handleRemoveDiscount = async (product: Product) => {
    setFeedback(null);
    try {
      await toggleProductFlag(product.id, {
        discounted_price: null,
        discount_percentage: 0,
        is_special_offer: false,
        offer_label: '',
      });
      await refreshStore(true);
      setSaleEdits((prev) => {
        const next = {...prev};
        delete next[product.id];
        return next;
      });
      setFeedback({type: 'success', text: `Removed discount from ${product.name}.`});
    } catch (err) {
      setFeedback({type: 'error', text: err instanceof Error ? err.message : 'Failed to remove discount.'});
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Discounts &amp; Promotional Offers</h2>
        <p className="text-sm text-[#3C4044]/80">
          Configure sale prices, automatic discount percentages, and the storefront promotional banner.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium ${
            feedback.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-[#EDBF9B]/45 border border-[#3C4044]/15 text-[#1F2225]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Storefront Promo Banner Card */}
      <form
        onSubmit={handleSaveBanner}
        className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#FD7B41]" />
            <h3 className="font-display text-base font-bold text-[#1F2225]">Top Promotional Banner</h3>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#3C4044] cursor-pointer">
            <input
              type="checkbox"
              checked={bannerActive}
              onChange={(e) => setBannerActive(e.target.checked)}
              className="w-4 h-4 accent-[#FD7B41]"
            />
            <span>Banner Active</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            placeholder="e.g. Free delivery on orders above ₹2,999 · Instant WhatsApp Checkout"
            className="flex-1 px-3.5 py-2.5 bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225]"
          />
          <button
            type="submit"
            disabled={savingBanner}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-xs font-semibold rounded-md cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingBanner ? 'Saving…' : 'Save Banner'}</span>
          </button>
        </div>
      </form>

      {/* Product Discounts Table */}
      <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#3C4044]/10">
          <h3 className="font-display text-base font-bold text-[#1F2225]">Product Discount Pricing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E9E8E6] text-[#3C4044]">
              <tr>
                <th className="px-4 py-3 font-semibold">Shoe</th>
                <th className="px-4 py-3 font-semibold text-right">Regular Price</th>
                <th className="px-4 py-3 font-semibold">Sale Price (₹)</th>
                <th className="px-4 py-3 font-semibold">Offer Label</th>
                <th className="px-4 py-3 font-semibold">Computed %</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3C4044]/10">
              {allProducts.map((product) => {
                const currentEdit = saleEdits[product.id] ?? {
                  price: product.discounted_price ? String(product.discounted_price) : '',
                  label: product.offer_label || '',
                };
                const numericSale = currentEdit.price ? Number(currentEdit.price) : null;
                const previewPct = computeDiscountPercentage(product.regular_price, numericSale);

                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1F2225]">{product.name}</p>
                      <p className="text-[#3C4044]/70">{product.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold">
                      {formatCurrency(product.regular_price)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={product.regular_price - 1}
                        value={currentEdit.price}
                        onChange={(e) =>
                          setSaleEdits((prev) => ({
                            ...prev,
                            [product.id]: {...currentEdit, price: e.target.value},
                          }))
                        }
                        placeholder="Sale price"
                        className="w-28 px-2.5 py-1.5 bg-white border border-[#3C4044]/25 rounded-sm font-mono-num text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={currentEdit.label}
                        onChange={(e) =>
                          setSaleEdits((prev) => ({
                            ...prev,
                            [product.id]: {...currentEdit, label: e.target.value},
                          }))
                        }
                        placeholder="e.g. Weekend Drop"
                        className="w-36 px-2.5 py-1.5 bg-white border border-[#3C4044]/25 rounded-sm text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono-num font-semibold text-[#FD7B41]">
                      {previewPct > 0 ? `Save ${previewPct}%` : 'No discount'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleApplyDiscount(product)}
                          className="px-3 py-1.5 bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold rounded-sm cursor-pointer"
                        >
                          Apply
                        </button>
                        {product.discounted_price && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveDiscount(product)}
                            title="Remove discount"
                            className="p-1.5 text-[#3C4044]/70 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
