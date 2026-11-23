import React, {useEffect} from 'react';
import {BrowserRouter, Route, Routes, useLocation} from 'react-router-dom';
import {AdminLayout} from './admin/AdminLayout';
import {AdminLoginPage} from './admin/AdminLoginPage';
import {AuthProvider, useAuth} from './hooks/useAuth';
import {CartProvider} from './hooks/useCart';
import {StoreDataProvider, useStoreData} from './hooks/useStoreData';
import {StoreLayout} from './layouts/StoreLayout';
import {CheckoutPage} from './pages/CheckoutPage';
import {HomePage} from './pages/HomePage';
import {NotFoundPage} from './pages/NotFoundPage';
import {ProductDetailsPage} from './pages/ProductDetailsPage';
import {ShopPage} from './pages/ShopPage';

const ScrollAndTitleManager: React.FC = () => {
  const {pathname, hash} = useLocation();
  const {settings} = useStoreData();

  useEffect(() => {
    document.title = pathname.startsWith('/admin')
      ? `Admin Dashboard · ${settings.store_name}`
      : `${settings.store_name} — Football Shoes, Jerseys & Accessories`;
  }, [pathname, settings.store_name]);

  useEffect(() => {
    if (!hash) {
      window.scrollTo({top: 0});
    }
  }, [pathname, hash]);

  return null;
};

const ProtectedAdminRoute: React.FC = () => {
  const {admin, loading} = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#DDDCDB] flex items-center justify-center text-sm font-medium text-[#3C4044]">
        Verifying administrator session…
      </div>
    );
  }

  return admin ? <AdminLayout /> : <AdminLoginPage />;
};

export default function App() {
  const rawBase = import.meta.env.BASE_URL || '/';
  const basename = rawBase === '/' ? '/' : rawBase.replace(/\/+$/, '');

  return (
    <StoreDataProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter basename={basename}>
            <ScrollAndTitleManager />
            <Routes>
              <Route element={<StoreLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductDetailsPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="/admin" element={<ProtectedAdminRoute />} />
              <Route path="/admin/*" element={<ProtectedAdminRoute />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </StoreDataProvider>
  );
}
