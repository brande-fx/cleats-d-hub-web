import React, {useState} from 'react';
import {AlertTriangle, Plus, Save, Trash2} from 'lucide-react';
import {useStoreData} from '../hooks/useStoreData';
import {updateProductSizes} from '../services/storeService';
import {Product, ProductSection} from '../types';
import {
  getSortedSizes,
  getTotalProductStock,
  PRODUCT_SECTION_LIST,
  PRODUCT_SECTION_MAP,
} from '../utils/formatters';

interface EditableSizeRow {
  size_label: string;
  stock_quantity: number;
  is_available: boolean;
  sort_order: number;
}

export const AdminInventory: React.FC = () => {
  const {allProducts, refreshStore} = useStoreData();
  const [sectionFilter, setSectionFilter] = useState<'all' | ProductSection>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>(allProducts[0]?.id || '');
  const [draftSizes, setDraftSizes] = useState<Record<string, EditableSizeRow[]>>({});
  const [newSizeLabel, setNewSizeLabel] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: 'error' | 'success'; text: string} | null>(null);

  const visibleProducts =
    sectionFilter === 'all'
      ? allProducts
      : allProducts.filter((p) => (p.product_section || 'shoes') === sectionFilter);

  const getRows = (product: Product): EditableSizeRow[] => {
    if (draftSizes[product.id]) return draftSizes[product.id];
    return getSortedSizes(product.sizes).map((s) => ({
      size_label: s.size_label,
      stock_quantity: s.stock_quantity,
      is_available: s.is_available,
      sort_order: s.sort_order,
    }));
  };

  const setRows = (productId: string, rows: EditableSizeRow[]) => {
    setDraftSizes((prev) => ({...prev, [productId]: rows}));
  };

  const handleSaveSizes = async (product: Product) => {
    setSavingId(product.id);
    setFeedback(null);
    try {
      const rows = getRows(product);
      await updateProductSizes(product.id, rows);
      await refreshStore(true);
      setDraftSizes((prev) => {
        const next = {...prev};
        delete next[product.id];
        return next;
      });
      setFeedback({type: 'success', text: `Updated size inventory for ${product.name}.`});
    } catch (err) {
      setFeedback({type: 'error', text: err instanceof Error ? err.message : 'Failed to save inventory.'});
    } finally {
      setSavingId(null);
    }
  };

  const activeProduct = visibleProducts.find((p) => p.id === selectedProductId) || visibleProducts[0];
  const activeSectionMeta = activeProduct
    ? PRODUCT_SECTION_MAP[activeProduct.product_section || 'shoes']
    : PRODUCT_SECTION_MAP.shoes;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Size &amp; Stock Inventory</h2>
        <p className="text-sm text-[#3C4044]/80">
          Manage individual sizes, variants, and stock quantities across Shoes, Football Jerseys, and Accessories.
        </p>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter inventory by section">
        <button
          type="button"
          onClick={() => setSectionFilter('all')}
          className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            sectionFilter === 'all'
              ? 'bg-[#3C4044] text-[#F7F6F5]'
              : 'bg-[#F7F6F5] border border-[#3C4044]/20 text-[#3C4044] hover:border-[#3C4044]/45'
          }`}
        >
          All ({allProducts.length})
        </button>
        {PRODUCT_SECTION_LIST.map((sec) => {
          const count = allProducts.filter((p) => (p.product_section || 'shoes') === sec.key).length;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => setSectionFilter(sec.key)}
              className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                sectionFilter === sec.key
                  ? 'bg-[#3C4044] text-[#F7F6F5]'
                  : 'bg-[#F7F6F5] border border-[#3C4044]/20 text-[#3C4044] hover:border-[#3C4044]/45'
              }`}
            >
              {sec.label} ({count})
            </button>
          );
        })}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Picker */}
        <div className="lg:col-span-4 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#E9E8E6] border-b border-[#3C4044]/10 text-xs font-semibold text-[#3C4044]">
            Select Product ({visibleProducts.length})
          </div>
          <div className="divide-y divide-[#3C4044]/10 max-h-[520px] overflow-y-auto">
            {visibleProducts.map((product) => {
              const total = getTotalProductStock(product.sizes);
              const selected = activeProduct?.id === product.id;
              const secMeta = PRODUCT_SECTION_MAP[product.product_section || 'shoes'];
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setFeedback(null);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                    selected ? 'bg-[#3C4044] text-[#F7F6F5]' : 'hover:bg-[#DDDCDB]/40 text-[#1F2225]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{product.name}</p>
                    <p className={selected ? 'text-[#DDDCDB]/80' : 'text-[#3C4044]/70'}>
                      {product.brand} · {secMeta.label}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num font-semibold shrink-0 ${
                      total === 0 ? (selected ? 'text-[#EDBF9B]' : 'text-red-700') : ''
                    }`}
                  >
                    {total} {secMeta.unit}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Product Size Matrix */}
        {activeProduct ? (
          <div className="lg:col-span-8 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3C4044]/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1F2225]">{activeProduct.name}</h3>
                <p className="text-xs text-[#3C4044]/75">
                  {activeProduct.brand} · {activeSectionMeta.label} · {activeProduct.sizes.length}{' '}
                  configured sizes
                </p>
              </div>
              <button
                type="button"
                disabled={savingId === activeProduct.id}
                onClick={() => void handleSaveSizes(activeProduct)}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-bold text-xs rounded-md transition-colors cursor-pointer self-start"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingId === activeProduct.id ? 'Saving…' : 'Save Size Inventory'}</span>
              </button>
            </div>

            {/* Add Size Control */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={newSizeLabel}
                onChange={(e) => setNewSizeLabel(e.target.value)}
                placeholder={
                  activeProduct.product_section === 'jerseys'
                    ? 'New size (e.g. XXL)'
                    : activeProduct.product_section === 'accessories'
                      ? 'New option (e.g. Size 5)'
                      : 'New size (e.g. UK 11)'
                }
                className="px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs w-48"
              />
              <button
                type="button"
                onClick={() => {
                  const label = newSizeLabel.trim();
                  if (!label) return;
                  const rows = getRows(activeProduct);
                  if (rows.some((r) => r.size_label.toLowerCase() === label.toLowerCase())) {
                    setFeedback({type: 'error', text: `Size ${label} already exists.`});
                    return;
                  }
                  setRows(activeProduct.id, [
                    ...rows,
                    {
                      size_label: label,
                      stock_quantity: 5,
                      is_available: true,
                      sort_order: rows.length + 1,
                    },
                  ]);
                  setNewSizeLabel('');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-xs font-semibold rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Size</span>
              </button>
            </div>

            {/* Size Table */}
            <div className="overflow-x-auto border border-[#3C4044]/15 rounded-lg bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E9E8E6] text-[#3C4044]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Stock Quantity</th>
                    <th className="px-4 py-3 font-semibold">Availability</th>
                    <th className="px-4 py-3 font-semibold">Alert</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3C4044]/10">
                  {getRows(activeProduct).map((row, idx) => {
                    const isOut = !row.is_available || row.stock_quantity === 0;
                    const isLow = row.is_available && row.stock_quantity > 0 && row.stock_quantity <= 2;
                    return (
                      <tr key={`${row.size_label}-${idx}`}>
                        <td className="px-4 py-3 font-mono-num font-bold text-[#1F2225]">
                          {row.size_label}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            value={row.stock_quantity}
                            onChange={(e) => {
                              const nextQty = Math.max(0, Math.floor(Number(e.target.value) || 0));
                              const rows = getRows(activeProduct);
                              setRows(
                                activeProduct.id,
                                rows.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        stock_quantity: nextQty,
                                        is_available: nextQty > 0 ? true : false,
                                      }
                                    : r
                                )
                              );
                            }}
                            className="w-24 px-2.5 py-1.5 border border-[#3C4044]/25 rounded-sm font-mono-num text-right text-xs"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              const rows = getRows(activeProduct);
                              setRows(
                                activeProduct.id,
                                rows.map((r, i) => (i === idx ? {...r, is_available: !r.is_available} : r))
                              );
                            }}
                            className={`px-2.5 py-1 rounded-sm text-xs font-semibold cursor-pointer ${
                              row.is_available && row.stock_quantity > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-[#DDDCDB] text-[#3C4044]'
                            }`}
                          >
                            {row.is_available && row.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {isOut ? (
                            <span className="text-red-700 font-medium">Out of stock</span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Low stock</span>
                            </span>
                          ) : (
                            <span className="text-[#3C4044]/70">Healthy</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const rows = getRows(activeProduct);
                              setRows(
                                activeProduct.id,
                                rows.filter((_, i) => i !== idx)
                              );
                            }}
                            className="p-1.5 text-[#3C4044]/60 hover:text-red-700 cursor-pointer"
                            aria-label={`Remove size ${row.size_label}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
