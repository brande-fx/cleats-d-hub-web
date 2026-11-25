import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, Mail, MapPin, MessageCircle, Phone} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';
import {SEED_IMAGES} from '../assets/seedImages';
import {ProductCard} from '../components/ProductCard';
import {ResilientImage} from '../components/ResilientImage';
import {useStoreData} from '../hooks/useStoreData';
import {buildWhatsAppSupportUrl} from '../services/whatsappService';
import {PRODUCT_SECTION_MAP, resolvePublicAssetUrl} from '../utils/formatters';

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

  const shoeProducts = useMemo(
    () => products.filter((p) => (p.product_section || 'shoes') === 'shoes'),
    [products]
  );
  const jerseyProducts = useMemo(
    () => products.filter((p) => p.product_section === 'jerseys'),
    [products]
  );
  const accessoryProducts = useMemo(
    () => products.filter((p) => p.product_section === 'accessories'),
    [products]
  );

  const availableShoeBrands = useMemo(() => {
    const unique = new Map<string, string>();
    for (const p of shoeProducts) {
      const trimmed = p.brand.trim();
      if (trimmed && !unique.has(trimmed.toLowerCase())) {
        unique.set(trimmed.toLowerCase(), trimmed);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [shoeProducts]);

  const curatedShoes = useMemo(() => {
    const brandFiltered =
      selectedBrand === 'all'
        ? shoeProducts
        : shoeProducts.filter(
            (p) => p.brand.trim().toLowerCase() === selectedBrand.trim().toLowerCase()
          );

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
  }, [activeTab, shoeProducts, selectedBrand]);

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
                Shoes, Football Jerseys &amp; Accessories · WhatsApp Checkout
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#1F2225] leading-[1.1] tracking-tight text-balance">
                Best Performance Cleats
              </h1>
              <p className="text-base text-[#3C4044]/85 leading-relaxed max-w-md">
                Explore matchday football shoes, breathable jerseys, and essential pitch accessories with live size stock and instant WhatsApp order confirmation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/shop?section=shoes"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors whitespace-nowrap"
                >
                  <span>Shop Shoes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shop?section=jerseys"
                  className="inline-flex items-center justify-center px-5 py-3 min-h-[44px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] font-semibold text-sm rounded-md transition-colors whitespace-nowrap"
                >
                  Jerseys
                </Link>
                <Link
                  to="/shop?section=accessories"
                  className="inline-flex items-center justify-center px-5 py-3 min-h-[44px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] font-semibold text-sm rounded-md transition-colors whitespace-nowrap"
                >
                  Accessories
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#3C4044]/80">
                <a href="#shoes" className="hover:text-[#1F2225] underline-offset-4 hover:underline">
                  Jump to Shoes ({shoeProducts.length})
                </a>
                <span aria-hidden="true">·</span>
                <a href="#jerseys" className="hover:text-[#1F2225] underline-offset-4 hover:underline">
                  Jerseys ({jerseyProducts.length})
                </a>
                <span aria-hidden="true">·</span>
                <a href="#accessories" className="hover:text-[#1F2225] underline-offset-4 hover:underline">
                  Accessories ({accessoryProducts.length})
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[360px] lg:min-h-[460px] lg:max-h-[520px] bg-[#E8E7E5] flex items-center justify-center overflow-hidden">
            <ResilientImage
              src={resolvePublicAssetUrl(settings.hero_image_url || SEED_IMAGES.heroCampaign)}
              alt="Cleats D Hub flagship performance cleats"
              priority
              className="w-full h-full max-h-[520px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* 2. Section 1 — Football Shoes & Cleats */}
      <section id="shoes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#3C4044]/15">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FD7B41]">
              Section 01 · Footwear
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2225]">
              {PRODUCT_SECTION_MAP.shoes.fullTitle}
            </h2>
            <p className="text-sm text-[#3C4044]/80">
              {PRODUCT_SECTION_MAP.shoes.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {availableShoeBrands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                aria-label="Filter shoes by brand"
                className="px-3 py-2 min-h-[38px] bg-[#F7F6F5] border border-[#3C4044]/20 rounded-lg text-xs font-semibold text-[#3C4044] focus:outline-2 focus:outline-[#FD7B41] cursor-pointer"
              >
                <option value="all">All Brands</option>
                {availableShoeBrands.map((brand) => (
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
        ) : curatedShoes.length === 0 ? (
          <div className="mt-8 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-10 text-center text-sm text-[#3C4044]/75">
            No football shoes or cleats are listed right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {curatedShoes.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="pt-8 flex justify-center">
          <Link
            to={
              selectedBrand === 'all'
                ? '/shop?section=shoes'
                : `/shop?section=shoes&brand=${encodeURIComponent(selectedBrand)}`
            }
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-sm font-semibold rounded-md transition-colors"
          >
            <span>
              {selectedBrand === 'all'
                ? `Explore All Shoes (${shoeProducts.length} Pairs)`
                : `View All ${selectedBrand} Shoes`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. Section 2 — Football Jerseys */}
      <section id="jerseys" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#3C4044]/15">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FD7B41]">
              Section 02 · Matchday Apparel
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2225]">
              {PRODUCT_SECTION_MAP.jerseys.fullTitle}
            </h2>
            <p className="text-sm text-[#3C4044]/80">
              {PRODUCT_SECTION_MAP.jerseys.description}
            </p>
          </div>

          <Link
            to="/shop?section=jerseys"
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#1F2225] text-xs font-semibold rounded-md transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>View All Jerseys ({jerseyProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
        ) : jerseyProducts.length === 0 ? (
          <div className="mt-8 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-10 text-center text-sm text-[#3C4044]/75">
            No football jerseys listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {jerseyProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Section 3 — Football Accessories */}
      <section id="accessories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#3C4044]/15">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FD7B41]">
              Section 03 · Pitch Equipment
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2225]">
              {PRODUCT_SECTION_MAP.accessories.fullTitle}
            </h2>
            <p className="text-sm text-[#3C4044]/80">
              {PRODUCT_SECTION_MAP.accessories.description}
            </p>
          </div>

          <Link
            to="/shop?section=accessories"
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#1F2225] text-xs font-semibold rounded-md transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>View All Accessories ({accessoryProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
        ) : accessoryProducts.length === 0 ? (
          <div className="mt-8 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-10 text-center text-sm text-[#3C4044]/75">
            No accessories listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {accessoryProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Customer Support Band */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#1F2225]">Customer Support</h2>
              <p className="text-sm text-[#3C4044]/80">
                Need help choosing your boot size, jersey fit, or accessory sizing? Reach our team directly.
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
