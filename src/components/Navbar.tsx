import React, {useState} from 'react';
import {Menu, ShoppingBag, X} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';
import {useCart} from '../hooks/useCart';
import {useStoreData} from '../hooks/useStoreData';
import {resolvePublicAssetUrl} from '../utils/formatters';

export const Navbar: React.FC = () => {
  const {settings} = useStoreData();
  const {totalItems, openCart} = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    {label: 'Home', to: '/'},
    {label: 'Shoes', to: '/shop?section=shoes'},
    {label: 'Jerseys', to: '/shop?section=jerseys'},
    {label: 'Accessories', to: '/shop?section=accessories'},
    {label: 'Offers', to: '/shop?offers=true'},
    {label: 'Contact', to: '/#contact'},
  ];

  const searchParams = new URLSearchParams(location.search);
  const currentSection = searchParams.get('section');
  const isOffers = searchParams.get('offers') === 'true';

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/' && !location.hash;
    if (to === '/shop?offers=true') {
      return location.pathname === '/shop' && isOffers;
    }
    if (to === '/shop?section=shoes') {
      return location.pathname === '/shop' && !isOffers && currentSection === 'shoes';
    }
    if (to === '/shop?section=jerseys') {
      return location.pathname === '/shop' && !isOffers && currentSection === 'jerseys';
    }
    if (to === '/shop?section=accessories') {
      return location.pathname === '/shop' && !isOffers && currentSection === 'accessories';
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#DDDCDB]/95 backdrop-blur-sm border-b border-[#3C4044]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single Line) */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 text-[#3C4044] font-display text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FD7B41] rounded-sm"
        >
          {settings.store_logo_url ? (
            <img
              src={resolvePublicAssetUrl(settings.store_logo_url)}
              alt={settings.store_name}
              referrerPolicy="no-referrer"
              className="h-9 w-9 object-cover rounded-full border border-[#3C4044]/20 shrink-0"
            />
          ) : null}
          <span>{settings.store_name}</span>
        </Link>

        {/* Zone 2: Clean Typography Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#3C4044]/85" aria-label="Main navigation">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#FD7B41] ${
                isActive(item.to)
                  ? 'border-[#FD7B41] text-[#1F2225] font-semibold'
                  : 'border-transparent hover:border-[#3C4044]/40 hover:text-[#1F2225]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Primary Cart Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openCart}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3C4044]"
            aria-label={`Open shopping cart with ${totalItems} items`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Cart</span>
            <span className="font-mono-num text-xs bg-[#1F2225] text-[#F7F6F5] px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">
              {totalItems}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#3C4044]/20 text-[#3C4044] hover:bg-[#3C4044]/10 transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-[#3C4044]/15 bg-[#F7F6F5] px-4 py-4 space-y-1"
          aria-label="Mobile navigation"
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-[#3C4044] hover:bg-[#DDDCDB]/60 rounded-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};
