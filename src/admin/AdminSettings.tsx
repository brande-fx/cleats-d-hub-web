import React, {useEffect, useState} from 'react';
import {Image as ImageIcon, RotateCcw, Save, Upload} from 'lucide-react';
import {ResilientImage} from '../components/ResilientImage';
import {useStoreData} from '../hooks/useStoreData';
import {DEFAULT_STORE_SETTINGS} from '../services/seedData';
import {updateStoreSettings, uploadHeroImage, uploadProductImage} from '../services/storeService';
import {StoreSettings} from '../types';
import {resolvePublicAssetUrl} from '../utils/formatters';

export const AdminSettings: React.FC = () => {
  const {settings, refreshStore} = useStoreData();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'error' | 'success'; text: string} | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setFeedback(null);
    try {
      const url = await uploadProductImage(file);
      setForm((prev) => ({...prev, store_logo_url: url}));
    } catch (err) {
      setFeedback({type: 'error', text: err instanceof Error ? err.message : 'Logo upload failed.'});
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    setFeedback(null);
    try {
      const url = await uploadHeroImage(file);
      setForm((prev) => ({...prev, hero_image_url: url}));
      await updateStoreSettings({hero_image_url: url});
      await refreshStore(true);
      setFeedback({type: 'success', text: 'Homepage hero image updated.'});
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Hero image upload failed.',
      });
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleResetHeroImage = async () => {
    setUploadingHero(true);
    setFeedback(null);
    try {
      const fallbackUrl = DEFAULT_STORE_SETTINGS.hero_image_url;
      setForm((prev) => ({...prev, hero_image_url: fallbackUrl}));
      await updateStoreSettings({hero_image_url: fallbackUrl});
      await refreshStore(true);
      setFeedback({type: 'success', text: 'Homepage hero image reset to default.'});
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reset hero image.',
      });
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updateStoreSettings({
        ...form,
        whatsapp_country_code: form.whatsapp_country_code.replace(/[^0-9]/g, '') || '91',
        whatsapp_number: form.whatsapp_number.replace(/[^0-9]/g, ''),
        delivery_charge: Math.max(0, Number(form.delivery_charge) || 0),
        free_delivery_threshold: Math.max(0, Number(form.free_delivery_threshold) || 0),
      });
      await refreshStore(true);
      setFeedback({type: 'success', text: 'Store settings saved permanently.'});
    } catch (err) {
      setFeedback({type: 'error', text: err instanceof Error ? err.message : 'Failed to save settings.'});
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Store Settings</h2>
        <p className="text-sm text-[#3C4044]/80">
          Configure your store identity, WhatsApp checkout number, delivery charges, and contact details without editing code.
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

      <form
        onSubmit={handleSubmit}
        className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 sm:p-8 space-y-6"
      >
        {/* Brand Identity */}
        <div className="space-y-4">
          <h3 className="font-display text-base font-bold text-[#1F2225] border-b border-[#3C4044]/10 pb-2">
            Store Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Store Name</label>
              <input
                type="text"
                required
                value={form.store_name}
                onChange={(e) => setForm({...form, store_name: e.target.value})}
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Store Logo URL or Upload</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.store_logo_url}
                  onChange={(e) => setForm({...form, store_logo_url: e.target.value})}
                  placeholder="Optional logo image URL"
                  className="flex-1 px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E9E8E6] hover:bg-[#DDDCDB] text-xs font-semibold rounded-md cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingLogo ? '…' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Homepage Hero Image */}
          <div className="pt-2 space-y-2.5">
            <label className="block text-xs font-semibold text-[#3C4044]">
              Homepage Hero Image (Main Banner)
            </label>
            <div className="bg-white border border-[#3C4044]/15 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-44 aspect-[16/10] rounded-md overflow-hidden bg-[#E8E7E5] border border-[#3C4044]/10 shrink-0">
                <ResilientImage
                  src={resolvePublicAssetUrl(form.hero_image_url || DEFAULT_STORE_SETTINGS.hero_image_url)}
                  alt="Homepage hero preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] text-xs font-bold rounded-md cursor-pointer transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{uploadingHero ? 'Uploading Image…' : 'Change Hero Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingHero}
                      onChange={handleHeroUpload}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={uploadingHero}
                    onClick={() => void handleResetHeroImage()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] text-xs font-semibold rounded-md cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={form.hero_image_url}
                  onChange={(e) => setForm({...form, hero_image_url: e.target.value})}
                  placeholder="Or paste any image URL (https://...)"
                  aria-label="Homepage hero image URL"
                  className="w-full px-3 py-2 bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-xs text-[#1F2225]"
                />
                <p className="text-[11px] text-[#3C4044]/70">
                  Upload any photo from your device or paste an image link to update the main hero banner on the storefront.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp & Contact */}
        <div className="space-y-4">
          <h3 className="font-display text-base font-bold text-[#1F2225] border-b border-[#3C4044]/10 pb-2">
            WhatsApp Checkout &amp; Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Country Code (digits)</label>
              <input
                type="text"
                required
                value={form.whatsapp_country_code}
                onChange={(e) => setForm({...form, whatsapp_country_code: e.target.value})}
                placeholder="91"
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">
                Business WhatsApp Number (receives customer orders)
              </label>
              <input
                type="text"
                required
                value={form.whatsapp_number}
                onChange={(e) => setForm({...form, whatsapp_number: e.target.value})}
                placeholder="6909367070"
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Customer Support Phone</label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => setForm({...form, contact_phone: e.target.value})}
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Store Support Email</label>
              <input
                type="email"
                value={form.store_email}
                onChange={(e) => setForm({...form, store_email: e.target.value})}
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#3C4044]">Store Address</label>
            <input
              type="text"
              value={form.store_address}
              onChange={(e) => setForm({...form, store_address: e.target.value})}
              className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Delivery & Promo Banner */}
        <div className="space-y-4">
          <h3 className="font-display text-base font-bold text-[#1F2225] border-b border-[#3C4044]/10 pb-2">
            Delivery Charges &amp; Promotional Banner
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Standard Delivery Charge (₹)</label>
              <input
                type="number"
                min={0}
                value={form.delivery_charge}
                onChange={(e) => setForm({...form, delivery_charge: Number(e.target.value)})}
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">
                Free Delivery Threshold (₹, 0 to disable)
              </label>
              <input
                type="number"
                min={0}
                value={form.free_delivery_threshold}
                onChange={(e) => setForm({...form, free_delivery_threshold: Number(e.target.value)})}
                className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#3C4044]">Promotional Banner Text</label>
              <label className="inline-flex items-center gap-1.5 text-xs text-[#3C4044] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.promo_banner_active}
                  onChange={(e) => setForm({...form, promo_banner_active: e.target.checked})}
                  className="accent-[#FD7B41]"
                />
                <span>Show Banner</span>
              </label>
            </div>
            <input
              type="text"
              value={form.promo_banner_text}
              onChange={(e) => setForm({...form, promo_banner_text: e.target.value})}
              className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <h3 className="font-display text-base font-bold text-[#1F2225] border-b border-[#3C4044]/10 pb-2">
            Social Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Instagram URL</label>
              <input
                type="url"
                value={form.instagram_url}
                onChange={(e) => setForm({...form, instagram_url: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">Facebook URL</label>
              <input
                type="url"
                value={form.facebook_url}
                onChange={(e) => setForm({...form, facebook_url: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3C4044]">YouTube URL</label>
              <input
                type="url"
                value={form.youtube_url}
                onChange={(e) => setForm({...form, youtube_url: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-bold text-sm rounded-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings…' : 'Save Store Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
