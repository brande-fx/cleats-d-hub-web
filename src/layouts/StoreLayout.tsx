import React, {useState} from 'react';
import {X} from 'lucide-react';
import {Outlet} from 'react-router-dom';
import {CartDrawer} from '../components/CartDrawer';
import {Footer} from '../components/Footer';
import {Navbar} from '../components/Navbar';
import {useStoreData} from '../hooks/useStoreData';

export const StoreLayout: React.FC = () => {
  const {settings} = useStoreData();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#DDDCDB] text-[#3C4044]">
      {settings.promo_banner_active && settings.promo_banner_text && !bannerDismissed && (
        <div className="bg-[#3C4044] text-[#F7F6F5] px-4 py-2 text-xs font-medium flex items-center justify-center relative min-h-[36px]">
          <span className="text-center pr-6 truncate">{settings.promo_banner_text}</span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 p-1 text-[#DDDCDB]/80 hover:text-white cursor-pointer"
            aria-label="Dismiss promotional banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};
