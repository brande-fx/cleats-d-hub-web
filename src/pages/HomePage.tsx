import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, Mail, MapPin, MessageCircle, Phone} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';
import {SEED_IMAGES} from '../assets/seedImages';
import {ProductCard} from '../components/ProductCard';
import {ResilientImage} from '../components/ResilientImage';
import {useStoreData} from '../hooks/useStoreData';
import {buildWhatsAppSupportUrl} from '../services/whatsappService';
import {resolvePublicAssetUrl} from '../utils/formatters';

type HomeCollectionTab = 'featured' | 'new' | 'bestsellers' | 'offers';

export const HomePage: React.FC = () => {
  const {products, settings, loading} = useStoreData();
  const [activeTab, setActiveTab] = useState<HomeCollectionTab>('featured');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.replace('#', ''));
      if (target) {
        target.scrollIntoView({behavior: 'smooth'});
      }
    }
  }, [location.hash]);

  const availableBrands = useMemo(() => {
    const unique = new Map<string, string>();
    for (const p of products) {
      const trimmed = p.brand.trim();
      if (trimmed && !unique.has(trimmed.toLowerCase())) {
        unique.set(trimmed.toLowerCase(), trimmed);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const curatedProducts = useMemo(() => {
    const brandFiltered =
      selectedBrand === 'all'
        ? products
        : products.filter((p) => p.brand.trim().toLowerCase() === selectedBrand.trim().toLowerCase());

    let list = brandFiltered;
    if (activeTab === 'featured') {
      list = brandFiltered.filter((p) => p.is_featured);
    } else if (activeTab === 'new') {
      list = brandFiltered.filter((p) => p.is_new_arrival);
    } else if (activeTab === 'bestsellers') {
      list = brandFiltered.filter((p) => p.is_best_seller);
    } else if (activeTab === 'offers') {
      list = brandFiltered.filter((p) => p.is_special_offer || p.discount_percentage > 0);
    }
    return (list.length > 0 ? list : brandFiltered).slice(0, 6);
  }, [activeTab, products, selectedBrand]);

  const supportWhatsAppUrl = buildWhatsAppSupportUrl(settings);

  const tabs: Array<{key: HomeCollectionTab; label: string}> = [
    {key: 'featured', label: 'Featured'},
    {key: 'new', label: 'New Arrivals'},
    {key: 'bestsellers', label: 'Best Sellers'},
    {key: 'offers', label: 'Special Offers'},
  ];

  return (
    <div>
      {/* 1. Hero Campaign Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 lg:pt-10 lg:pb-14">
        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#3C4044]/70">
                Football Shoes, Boots &amp; Cleats · Direct WhatsApp Ordering
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#1F2225] leading-[1.1] tracking-tight text-balance">
                Best Performance Cleats
              </h1>
              <p className="text-base text-[#3C4044]/85 leading-relaxed max-w-md">
                Explore matchday football boots, firm-ground cleats, and turf trainers with real-time UK size availability and instant WhatsApp order confirmation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors whitespace-nowrap"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/shop?offers=true"
                className="inline-flex items-center justify-center px-5 py-3 min-h-[44px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] font-semibold text-sm rounded-md transition-colors whitespace-nowrap"
              >
                Special Offers
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[360px] lg:min-h-[460px] bg-[#E8E7E5]">
            <ResilientImage
              src={resolvePublicAssetUrl(settings.hero_image_url || SEED_IMAGES.heroCampaign)}
              alt="Cleats D Hub flagship performance cleats"
              priority
              className="w-full h-full lg:h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Curated Collections (Featured / New Arrivals / Best Sellers / Special Offers) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#3C4044]/15">
          <div className="space-y-1">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2225]">
              Football Cleats &amp; Boots
            </h2>
            <p className="text-sm text-[#3C4044]/80">
              Select your UK boot size directly on any pair or open full pitch specifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {availableBrands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                aria-label="Filter showcase by brand"
                className="px-3 py-2 min-h-[38px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-lg text-xs font-semibold text-[#3C4044] focus:outline-2 focus:outline-[#FD7B41] cursor-pointer"
              >
                <option value="all">All Brands</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            )}

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#E9E8E6] border border-[#3C4044]/10 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[#3C4044] text-[#F7F6F5]'
                      : 'text-[#3C4044] hover:text-[#1F2225]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[420px] rounded-lg bg-[#F7F6F5] border border-[#3C4044]/10 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {curatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="pt-8 flex justify-center">
          <Link
            to={selectedBrand === 'all' ? '/shop' : `/shop?brand=${encodeURIComponent(selectedBrand)}`}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-sm font-semibold rounded-md transition-colors"
          >
            <span>
              {selectedBrand === 'all'
                ? `Explore Full Cleats Lineup (${products.length} Pairs)`
                : `View All ${selectedBrand} Cleats`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. Customer Support Band */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#1F2225]">Customer Support</h2>
              <p className="text-sm text-[#3C4044]/80">
                Need help choosing your UK boot size, stud soleplate, or dispatch timing? Reach our team directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-1 text-sm text-[#3C4044]">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FD7B41] shrink-0" />
                <a href={`tel:${settings.contact_phone}`} className="hover:underline font-mono-num">
                  {settings.contact_phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FD7B41] shrink-0" />
                <a href={`mailto:${settings.store_email}`} className="hover:underline break-all">
                  {settings.store_email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#FD7B41] shrink-0" />
                <span>{settings.store_address}</span>
              </div>
            </div>
          </div>

          <a
            href={supportWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] text-sm font-semibold rounded-md transition-colors shrink-0 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
};
