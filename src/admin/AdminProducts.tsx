import React, {useState} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  Images,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {ResilientImage} from '../components/ResilientImage';
import {useStoreData} from '../hooks/useStoreData';
import {
  deleteProduct,
  saveProduct,
  SaveProductInput,
  toggleProductFlag,
  uploadProductImages,
} from '../services/storeService';
import {Product} from '../types';
import {
  computeDiscountPercentage,
  formatCurrency,
  getEffectivePrice,
  getSortedSizes,
  getTotalProductStock,
} from '../utils/formatters';

const DEFAULT_UK_SIZES = [
  {size_label: 'UK 6', stock_quantity: 5, is_available: true, sort_order: 1},
  {size_label: 'UK 7', stock_quantity: 8, is_available: true, sort_order: 2},
  {size_label: 'UK 8', stock_quantity: 10, is_available: true, sort_order: 3},
  {size_label: 'UK 9', stock_quantity: 6, is_available: true, sort_order: 4},
  {size_label: 'UK 10', stock_quantity: 4, is_available: true, sort_order: 5},
];

function createEmptyDraft(): SaveProductInput {
  return {
    name: '',
    brand: '',
    category_id: null,
    description: '',
    regular_price: 3999,
    discounted_price: null,
    image_url: '',
    gallery_urls: [],
    is_active: true,
    is_featured: false,
    is_new_arrival: true,
    is_best_seller: false,
    is_special_offer: false,
    offer_label: '',
    sizes: DEFAULT_UK_SIZES.map((s) => ({...s})),
  };
}

export const AdminProducts: React.FC = () => {
  const {allProducts, refreshStore} = useStoreData();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<SaveProductInput>(() => createEmptyDraft());
  const [newSizeInput, setNewSizeInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{completed: number; total: number} | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null);
  const [photoMessage, setPhotoMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const uploading = uploadProgress !== null;

  const openCreateModal = () => {
    setDraft(createEmptyDraft());
    setImageUrlInput('');
    setMessage(null);
    setPhotoMessage(null);
    setEditorOpen(true);
  };

  const openEditModal = (product: Product) => {
    const gallery = Array.from(
      new Set([product.image_url, ...(product.gallery_urls || [])].filter(Boolean))
    );
    setDraft({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category_id: product.category_id,
      description: product.description,
      regular_price: product.regular_price,
      discounted_price: product.discounted_price,
      image_url: gallery[0] || '',
      gallery_urls: gallery,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_best_seller: product.is_best_seller,
      is_special_offer: product.is_special_offer,
      offer_label: product.offer_label,
      sizes: getSortedSizes(product.sizes).map((s) => ({
        id: s.id,
        size_label: s.size_label,
        stock_quantity: s.stock_quantity,
        is_available: s.is_available,
        sort_order: s.sort_order,
      })),
    });
    setImageUrlInput('');
    setMessage(null);
    setPhotoMessage(null);
    setEditorOpen(true);
  };

  const uploadBatchFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploadProgress({completed: 0, total: files.length});
    setPhotoMessage(null);

    try {
      const {urls, failed} = await uploadProductImages(files, (completed, total) => {
        setUploadProgress({completed, total});
      });

      if (urls.length > 0) {
        setDraft((prev) => {
          const existing = (prev.gallery_urls || []).filter(Boolean);
          const merged = Array.from(new Set([...existing, ...urls]));
          return {
            ...prev,
            image_url: merged[0] || '',
            gallery_urls: merged,
          };
        });
      }

      if (failed.length > 0) {
        const failedSummary = failed.map((f) => `${f.name} (${f.reason})`).join(', ');
        setPhotoMessage({
          type: 'error',
          text:
            urls.length > 0
              ? `Uploaded ${urls.length} photo(s), but ${failed.length} failed: ${failedSummary}`
              : `Failed to upload photos: ${failedSummary}`,
        });
      } else {
        setPhotoMessage({
          type: 'success',
          text: `Added ${urls.length} photo${urls.length === 1 ? '' : 's'} to product gallery.`,
        });
      }
    } catch (err) {
      setPhotoMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to upload product images.',
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadBatchFiles(files);
    e.target.value = '';
  };

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadBatchFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setDraft((prev) => {
      const existing = (prev.gallery_urls || []).filter(Boolean);
      const merged = Array.from(new Set([...existing, trimmed]));
      return {
        ...prev,
        image_url: merged[0] || '',
        gallery_urls: merged,
      };
    });
    setImageUrlInput('');
  };

  const handleSetCoverImage = (index: number) => {
    setDraft((prev) => {
      const list = [...(prev.gallery_urls || [])];
      if (index < 0 || index >= list.length) return prev;
      const [chosen] = list.splice(index, 1);
      const reordered = [chosen, ...list];
      return {
        ...prev,
        image_url: reordered[0] || '',
        gallery_urls: reordered,
      };
    });
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const list = [...(prev.gallery_urls || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        image_url: list[0] || '',
        gallery_urls: list,
      };
    });
  };

  const handleRemoveImage = (index: number) => {
    setDraft((prev) => {
      const filteredGallery = (prev.gallery_urls || []).filter((_, i) => i !== index);
      return {
        ...prev,
        image_url: filteredGallery[0] || '',
        gallery_urls: filteredGallery,
      };
    });
  };

  const handleAddSizeRow = () => {
    const label = newSizeInput.trim();
    if (!label) return;
    if (draft.sizes.some((s) => s.size_label.toLowerCase() === label.toLowerCase())) {
      setMessage({type: 'error', text: `Size ${label} already exists on this product.`});
      return;
    }
    setDraft((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        {
          size_label: label,
          stock_quantity: 5,
          is_available: true,
          sort_order: prev.sizes.length + 1,
        },
      ],
    }));
    setNewSizeInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!draft.name.trim() || !draft.brand.trim()) {
      setMessage({type: 'error', text: 'Product name and brand are required.'});
      return;
    }
    if (draft.regular_price <= 0) {
      setMessage({type: 'error', text: 'Regular price must be greater than 0.'});
      return;
    }
    if (draft.sizes.length === 0) {
      setMessage({type: 'error', text: 'Add at least one shoe size with stock count.'});
      return;
    }

    setSaving(true);
    try {
      await saveProduct(draft);
      await refreshStore(true);
      setEditorOpen(false);
      setMessage({type: 'success', text: `Saved "${draft.name}" to database.`});
    } catch (err) {
      setMessage({type: 'error', text: err instanceof Error ? err.message : 'Unable to save product.'});
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleProductFlag(product.id, {is_active: !product.is_active});
      await refreshStore(true);
    } catch (err) {
      setMessage({type: 'error', text: err instanceof Error ? err.message : 'Failed to toggle visibility.'});
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      await refreshStore(true);
      setConfirmDeleteId(null);
      setMessage({type: 'success', text: 'Product deleted permanently.'});
    } catch (err) {
      setMessage({type: 'error', text: err instanceof Error ? err.message : 'Failed to delete product.'});
    }
  };

  const availableBrands = Array.from(
    new Map(
      allProducts
        .map((p) => p.brand.trim())
        .filter(Boolean)
        .map((b) => [b.toLowerCase(), b] as const)
    ).values()
  ).sort((a, b) => a.localeCompare(b));

  const filtered = allProducts.filter((p) => {
    if (brandFilter !== 'all' && p.brand.trim().toLowerCase() !== brandFilter.toLowerCase()) {
      return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  const liveDiscountPct = computeDiscountPercentage(draft.regular_price, draft.discounted_price);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Football Boots &amp; Cleats</h2>
          <p className="text-sm text-[#3C4044]/80">
            Add, edit, price, upload multiple photos, and manage visibility for all football shoes, boots, and cleats.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Cleat / Boot</span>
        </button>
      </div>

      {message && !editorOpen && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium ${
            message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-[#EDBF9B]/45 border border-[#3C4044]/15 text-[#1F2225]'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search & Brand Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-[#3C4044]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cleats or boots by name or brand…"
            className="w-full pl-9 pr-3 py-2 min-h-[40px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-sm text-[#1F2225]"
          />
        </div>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          aria-label="Filter products by brand"
          className="px-3 py-2 min-h-[40px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-sm text-[#1F2225] sm:w-52"
        >
          <option value="all">All Brands ({allProducts.length})</option>
          {availableBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E9E8E6] text-[#3C4044]">
              <tr>
                <th className="px-4 py-3 font-semibold">Cleat / Boot</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold text-right">Total Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3C4044]/10">
              {filtered.map((product) => {
                const effective = getEffectivePrice(product);
                const totalStock = getTotalProductStock(product.sizes);
                return (
                  <tr key={product.id} className="hover:bg-[#DDDCDB]/25">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-11 rounded-sm overflow-hidden bg-[#E8E7E5] shrink-0 border border-[#3C4044]/10">
                          <ResilientImage src={product.image_url} alt={product.name} />
                          {(product.gallery_urls?.length || 0) > 1 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-[#1F2225]/85 text-[#F7F6F5] font-mono-num text-[10px] leading-none px-1 py-0.5 rounded-sm">
                              +{product.gallery_urls.length - 1}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F2225] truncate max-w-[220px]">{product.name}</p>
                          <p className="text-[#3C4044]/70">
                            {product.brand}
                            {(product.gallery_urls?.length || 0) > 1 && (
                              <span className="ml-1.5 text-[#3C4044]/60">
                                · {product.gallery_urls.length} photos
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num">
                      <span className="font-semibold text-[#1F2225]">{formatCurrency(effective)}</span>
                      {effective < product.regular_price && (
                        <span className="block text-[11px] text-[#3C4044]/55 line-through">
                          {formatCurrency(product.regular_price)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold text-[#1F2225]">
                      {totalStock} pairs
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.is_active ? 'text-emerald-700 font-semibold' : 'text-[#3C4044]/60'}>
                        {product.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(product)}
                          title={product.is_active ? 'Hide from storefront' : 'Activate on storefront'}
                          className="p-2 rounded-sm hover:bg-[#DDDCDB] text-[#3C4044] cursor-pointer"
                        >
                          {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          title="Edit product"
                          className="p-2 rounded-sm hover:bg-[#DDDCDB] text-[#3C4044] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === product.id ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(product.id)}
                            className="px-2 py-1 bg-red-700 text-white rounded-sm text-[11px] font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(product.id)}
                            title="Delete product"
                            className="p-2 rounded-sm hover:bg-red-100 text-red-700 cursor-pointer"
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

      {/* Product Create / Edit Drawer Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2225]/60">
          <div className="bg-[#F7F6F5] border border-[#3C4044]/20 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#DDDCDB] px-6 py-4 border-b border-[#3C4044]/15 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#1F2225]">
                {draft.id ? 'Edit Football Boot / Cleat' : 'Add New Football Boot / Cleat'}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 text-[#3C4044] hover:text-[#1F2225] cursor-pointer"
                aria-label="Close editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Multi-Photo Upload & Gallery Manager */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!uploading) setIsDraggingFiles(true);
                }}
                onDragLeave={() => setIsDraggingFiles(false)}
                onDrop={handleDropFiles}
                className={`space-y-4 p-4 rounded-lg border transition-colors ${
                  isDraggingFiles
                    ? 'bg-[#EDBF9B]/30 border-[#FD7B41]'
                    : 'bg-[#E9E8E6] border-[#3C4044]/15'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Images className="w-4 h-4 text-[#3C4044]" />
                      <h4 className="font-display text-sm font-bold text-[#1F2225]">
                        Product Photos ({(draft.gallery_urls || []).length})
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#3C4044]/75 mt-0.5">
                      Select or drag & drop multiple photos at once. The first photo is used as the store cover image.
                    </p>
                  </div>

                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[38px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-xs font-semibold rounded-md cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadProgress
                        ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}…`
                        : 'Upload Multiple Photos'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImagesUpload}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>
                </div>

                {photoMessage && (
                  <div
                    className={`p-2.5 rounded-md text-xs font-medium ${
                      photoMessage.type === 'error'
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-[#EDBF9B]/45 border border-[#3C4044]/15 text-[#1F2225]'
                    }`}
                  >
                    {photoMessage.text}
                  </div>
                )}

                {/* Gallery Grid */}
                {(draft.gallery_urls || []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(draft.gallery_urls || []).map((imgUrl, idx) => {
                      const isCover = idx === 0;
                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className={`bg-white rounded-md overflow-hidden border ${
                            isCover ? 'border-[#FD7B41] ring-1 ring-[#FD7B41]' : 'border-[#3C4044]/15'
                          }`}
                        >
                          <div className="relative aspect-[4/3] bg-[#F7F6F5]">
                            <ResilientImage src={imgUrl} alt={`Product photo ${idx + 1}`} />
                            {isCover && (
                              <span className="absolute top-1.5 left-1.5 bg-[#FD7B41] text-[#1F2225] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Remove photo"
                              aria-label={`Remove photo ${idx + 1}`}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-sm bg-[#1F2225]/80 hover:bg-red-700 text-white inline-flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="px-2 py-1.5 flex items-center justify-between gap-1 border-t border-[#3C4044]/10 bg-[#F7F6F5]">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveImage(idx, -1)}
                                title="Move left"
                                aria-label={`Move photo ${idx + 1} left`}
                                className="p-1 rounded-sm text-[#3C4044] hover:bg-[#DDDCDB] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (draft.gallery_urls?.length || 1) - 1}
                                onClick={() => handleMoveImage(idx, 1)}
                                title="Move right"
                                aria-label={`Move photo ${idx + 1} right`}
                                className="p-1 rounded-sm text-[#3C4044] hover:bg-[#DDDCDB] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {isCover ? (
                              <span className="text-[10px] font-semibold text-[#3C4044]/75 pr-1">
                                Main
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                title="Set as cover photo"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold text-[#3C4044] hover:bg-[#EDBF9B]/60 cursor-pointer"
                              >
                                <Star className="w-3 h-3" />
                                <span>Make Cover</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white/75 border border-dashed border-[#3C4044]/25 rounded-md py-6 px-4 text-center text-xs text-[#3C4044]/75">
                    No photos added yet. Click <strong>Upload Multiple Photos</strong> or drop image files here.
                  </div>
                )}

                {/* Optional Paste Image URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="Or paste an image URL and click Add Photo"
                    className="flex-1 px-3 py-2 bg-white border border-[#3C4044]/20 rounded-md text-xs text-[#1F2225]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!imageUrlInput.trim()}
                    className="px-3.5 py-2 bg-[#3C4044] hover:bg-[#1F2225] disabled:opacity-40 text-[#F7F6F5] text-xs font-semibold rounded-md cursor-pointer shrink-0"
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Cleat / Boot Name *</label>
                  <input
                    type="text"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft({...draft, name: e.target.value})}
                    placeholder="e.g. Mercurial Vapor Pro FG Cleats"
                    className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={draft.brand}
                    onChange={(e) => setDraft({...draft, brand: e.target.value})}
                    placeholder="e.g. Nike, Adidas, Puma"
                    className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3C4044]">Description</label>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({...draft, description: e.target.value})}
                  placeholder="Upper material, stud plate (FG/TF/AG/IC), fit profile, and pitch usage…"
                  className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                />
              </div>

              {/* Pricing & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Regular Price (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={draft.regular_price}
                    onChange={(e) => setDraft({...draft, regular_price: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">
                    Discounted Price (₹) {liveDiscountPct > 0 ? `(${liveDiscountPct}% off)` : ''}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draft.discounted_price ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        discounted_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Leave blank if no sale"
                    className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Offer Label</label>
                  <input
                    type="text"
                    value={draft.offer_label}
                    onChange={(e) => setDraft({...draft, offer_label: e.target.value})}
                    placeholder="e.g. Matchday Drop"
                    className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Visibility Flags */}
              <div className="flex flex-wrap gap-5 pt-1 text-xs font-medium text-[#3C4044]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(e) => setDraft({...draft, is_active: e.target.checked})}
                    className="w-4 h-4 accent-[#FD7B41]"
                  />
                  <span>Active on Storefront</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.is_featured}
                    onChange={(e) => setDraft({...draft, is_featured: e.target.checked})}
                    className="w-4 h-4 accent-[#FD7B41]"
                  />
                  <span>Featured</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.is_new_arrival}
                    onChange={(e) => setDraft({...draft, is_new_arrival: e.target.checked})}
                    className="w-4 h-4 accent-[#FD7B41]"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.is_best_seller}
                    onChange={(e) => setDraft({...draft, is_best_seller: e.target.checked})}
                    className="w-4 h-4 accent-[#FD7B41]"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.is_special_offer}
                    onChange={(e) => setDraft({...draft, is_special_offer: e.target.checked})}
                    className="w-4 h-4 accent-[#FD7B41]"
                  />
                  <span>Special Offer</span>
                </label>
              </div>

              {/* Size-Level Inventory Table */}
              <div className="space-y-3 pt-3 border-t border-[#3C4044]/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#1F2225]">
                    Size-Level Stock Matrix
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSizeInput}
                      onChange={(e) => setNewSizeInput(e.target.value)}
                      placeholder="e.g. UK 11"
                      className="px-3 py-1.5 bg-white border border-[#3C4044]/25 rounded-md text-xs w-28"
                    />
                    <button
                      type="button"
                      onClick={handleAddSizeRow}
                      className="px-3 py-1.5 bg-[#E9E8E6] hover:bg-[#DDDCDB] text-xs font-semibold rounded-md cursor-pointer"
                    >
                      + Add Size
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {draft.sizes.map((sz, idx) => (
                    <div
                      key={`${sz.size_label}-${idx}`}
                      className="flex items-center justify-between gap-2 bg-white border border-[#3C4044]/15 rounded-md px-3 py-2"
                    >
                      <span className="font-mono-num text-xs font-bold text-[#1F2225] min-w-[54px]">
                        {sz.size_label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={sz.stock_quantity}
                        onChange={(e) => {
                          const qty = Math.max(0, Math.floor(Number(e.target.value) || 0));
                          setDraft((prev) => ({
                            ...prev,
                            sizes: prev.sizes.map((row, i) =>
                              i === idx ? {...row, stock_quantity: qty, is_available: qty > 0 ? row.is_available : false} : row
                            ),
                          }));
                        }}
                        className="w-20 px-2 py-1 border border-[#3C4044]/20 rounded-sm text-xs font-mono-num text-right"
                        aria-label={`Stock for ${sz.size_label}`}
                      />
                      <label className="inline-flex items-center gap-1 text-[11px] text-[#3C4044] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sz.is_available}
                          onChange={(e) => {
                            setDraft((prev) => ({
                              ...prev,
                              sizes: prev.sizes.map((row, i) =>
                                i === idx ? {...row, is_available: e.target.checked} : row
                              ),
                            }));
                          }}
                          className="accent-[#FD7B41]"
                        />
                        <span>Enabled</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            sizes: prev.sizes.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1 text-[#3C4044]/60 hover:text-red-700 cursor-pointer"
                        aria-label={`Remove ${sz.size_label}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-md text-xs font-medium ${
                    message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-[#EDBF9B]/45 border border-[#3C4044]/15 text-[#1F2225]'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3C4044]/15">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2.5 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] text-xs font-semibold rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-5 py-2.5 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] disabled:opacity-50 text-[#1F2225] text-xs font-bold rounded-md cursor-pointer"
                >
                  {saving ? 'Saving…' : draft.id ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
