import React from 'react';
import {Link} from 'react-router-dom';
import {useStoreData} from '../hooks/useStoreData';
import {buildWhatsAppSupportUrl} from '../services/whatsappService';

export const Footer: React.FC = () => {
  const {settings, categories} = useStoreData();
  const supportUrl = buildWhatsAppSupportUrl(settings);

  return (
    <footer className="bg-[#3C4044] text-[#DDDCDB] border-t border-[#3C4044]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#DDDCDB]/15">
          {/* Brand Summary */}
          <div className="space-y-3">
            <p className="font-display text-lg font-bold text-[#F7F6F5]">{settings.store_name}</p>
            <p className="text-sm text-[#DDDCDB]/80 leading-relaxed max-w-xs">
              Engineered athletic and everyday footwear with live size-level availability and direct WhatsApp ordering.
            </p>
            <p className="text-xs text-[#EDBF9B]">{settings.store_address}</p>
          </div>

          {/* Shop Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EDBF9B]">Footwear</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="hover:text-[#FD7B41] transition-colors">
                  All Shoes
                </Link>
              </li>
              <li>
                <Link to="/shop?offers=true" className="hover:text-[#FD7B41] transition-colors">
                  Special Offers
                </Link>
              </li>
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="hover:text-[#FD7B41] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EDBF9B]">Customer Support</h3>
            <ul className="space-y-2 text-sm text-[#DDDCDB]/90">
              <li>
                <a href={`tel:${settings.contact_phone}`} className="hover:text-[#FD7B41] transition-colors">
                  {settings.contact_phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.store_email}`} className="hover:text-[#FD7B41] transition-colors">
                  {settings.store_email}
                </a>
              </li>
              <li>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FD7B41] font-medium hover:underline"
                >
                  WhatsApp Sizing Help
                </a>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-[#FD7B41] transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Store & Admin */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EDBF9B]">Connect &amp; Store</h3>
            <ul className="space-y-2 text-sm">
              {settings.instagram_url && (
                <li>
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FD7B41] transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {settings.facebook_url && (
                <li>
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FD7B41] transition-colors"
                  >
                    Facebook
                  </a>
                </li>
              )}
              {settings.youtube_url && (
                <li>
                  <a
                    href={settings.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FD7B41] transition-colors"
                  >
                    YouTube
                  </a>
                </li>
              )}
              <li className="pt-2">
                <Link
                  to="/admin"
                  className="inline-block text-xs font-medium text-[#EDBF9B] hover:text-[#FD7B41] underline underline-offset-4"
                >
                  Store Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#DDDCDB]/70">
          <p>
            © {new Date().getFullYear()} {settings.store_name}. All rights reserved.
          </p>
          <p>Orders submitted via WhatsApp · Confirmed directly by our store team.</p>
        </div>
      </div>
    </footer>
  );
};
