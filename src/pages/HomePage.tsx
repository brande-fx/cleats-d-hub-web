import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, Mail, MapPin, MessageCircle, Phone} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';
import {ProductCard} from '../components/ProductCard';
import {ResilientImage} from '../components/ResilientImage';
import {useStoreData} from '../hooks/useStoreData';
import {buildWhatsAppSupportUrl} from '../services/whatsappService';
import {getTotalProductStock, resolvePublicAssetUrl} from '../utils/formatters';

type HomeCollectionTab = 'featured' | 'new' | 'bestsellers' | 'offers';

export const HomePage: React.FC = () => {
  const {products, categories, settings, loading} = useStoreData();
  const [activeTab, setActiveTab] = useState<HomeCollectionTab>('featured');
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.replace('#', ''));
      if (target) {
        target.scrollIntoView({behavior: 'smooth'});
      }
    }
  }, [location.hash]);

  const curatedProducts = useMemo(() => {
    let list = products;
    if (activeTab === 'featured') {
      list = products.filter((p) => p.is_featured);
    } else if (activeTab === 'new') {
      list = products.filter((p) => p.is_new_arrival);
    } else if (activeTab === 'bestsellers') {
      list = products.filter((p) => p.is_best_seller);
    } else if (activeTab === 'offers') {
      list = products.filter((p) => p.is_special_offer || p.discount_percentage > 0);
    }
    return (list.length > 0 ? list : products).slice(0, 6);
  }, [activeTab, products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.category_id) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

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
                Performance Footwear · Direct WhatsApp Ordering
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#1F2225] leading-[1.1] tracking-tight text-balance">
                Best Performance Cleats
              </h1>
              <p className="text-base text-[#3C4044]/85 leading-relaxed max-w-md">
                Explore lightweight athletic silhouettes crafted with real-time UK size availability and effortless WhatsApp order confirmation.
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
              src={resolvePublicAssetUrl('/assets/aistudio/download_6a122e79.jpg')}
              alt="Cleats D Hub flagship performance cleats"
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
              Footwear Lineup
            </h2>
            <p className="text-sm text-[#3C4044]/80">
              Select your UK size directly on any pair or open full specifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#E9E8E6] border border-[#3C4044]/10 rounded-lg self-start md:self-auto">
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
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-sm font-semibold rounded-md transition-colors"
          >
            <span>Explore Full Catalogue ({products.length} Styles)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. Shop by Category */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between gap-4 pb-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-[#1F2225]">Shop by Category</h2>
            <p className="text-sm text-[#3C4044]/80">Purpose-built footwear across five athletic disciplines.</p>
          </div>
          <Link
            to="/shop"
            className="text-sm font-semibold text-[#3C4044] hover:text-[#FD7B41] whitespace-nowrap"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const inStockCount = products
              .filter((p) => p.category_id === cat.id)
              .reduce((acc, p) => acc + (getTotalProductStock(p.sizes) > 0 ? 1 : 0), 0);

            return (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="group bg-[#F7F6F5] hover:bg-[#EDBF9B]/45 border border-[#3C4044]/15 rounded-lg p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#3C4044]/70 font-mono-num">
                    <span>{count} {count === 1 ? 'model' : 'models'}</span>
                    <span>{inStockCount} ready</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1F2225] group-hover:text-[#3C4044]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#3C4044]/80 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3C4044] group-hover:text-[#1F2225]">
                  <span>Browse {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Customer Support Band */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#1F2225]">Customer Support</h2>
              <p className="text-sm text-[#3C4044]/80">
                Need help choosing your UK size or checking dispatch timing? Reach our team directly.
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
