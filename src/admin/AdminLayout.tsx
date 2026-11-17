import React, {useEffect, useState} from 'react';
import {
  ClipboardList,
  ExternalLink,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Tag,
  X,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {useStoreData} from '../hooks/useStoreData';
import {fetchOrders} from '../services/storeService';
import {Order} from '../types';
import {AdminInventory} from './AdminInventory';
import {AdminOffers} from './AdminOffers';
import {AdminOrders} from './AdminOrders';
import {AdminOverview} from './AdminOverview';
import {AdminProducts} from './AdminProducts';
import {AdminSettings} from './AdminSettings';

export type AdminSection = 'overview' | 'products' | 'inventory' | 'offers' | 'orders' | 'settings';

export const AdminLayout: React.FC = () => {
  const {admin, signOut, isPreviewMode} = useAuth();
  const {settings, refreshStore} = useStoreData();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    void refreshStore(true);
    void loadOrders();
  }, [refreshStore]);

  const navItems: Array<{key: AdminSection; label: string; icon: React.ReactNode}> = [
    {key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />},
    {key: 'products', label: 'Products', icon: <Package className="w-4 h-4" />},
    {key: 'inventory', label: 'Size & Stock', icon: <Layers className="w-4 h-4" />},
    {key: 'offers', label: 'Discounts & Offers', icon: <Tag className="w-4 h-4" />},
    {key: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" />},
    {key: 'settings', label: 'Store Settings', icon: <Settings className="w-4 h-4" />},
  ];

  const currentTitle = navItems.find((i) => i.key === activeSection)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#DDDCDB] text-[#3C4044] flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1F2225]/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#3C4044] text-[#DDDCDB] flex flex-col justify-between transition-transform duration-150 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-[#DDDCDB]/15 pb-4">
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-[#F7F6F5] truncate">
                {settings.store_name}
              </p>
              <p className="text-xs text-[#EDBF9B]">Admin Workspace</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-[#DDDCDB] hover:text-white cursor-pointer"
              aria-label="Close admin sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1" aria-label="Admin navigation">
            {navItems.map((item) => {
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#FD7B41] text-[#1F2225] font-semibold'
                      : 'text-[#DDDCDB]/85 hover:bg-[#F7F6F5]/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-[#DDDCDB]/15 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-[#F7F6F5] truncate">{admin?.full_name}</p>
            <p className="text-[#DDDCDB]/70 truncate">{admin?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 min-h-[40px] bg-[#1F2225]/50 hover:bg-[#1F2225] text-[#F7F6F5] text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="bg-[#F7F6F5] border-b border-[#3C4044]/15 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md border border-[#3C4044]/20 text-[#3C4044] cursor-pointer"
              aria-label="Open admin sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#3C4044]/65 hidden sm:inline">Admin</span>
              <span className="text-[#3C4044]/40 hidden sm:inline">/</span>
              <h1 className="font-display font-bold text-[#1F2225] truncate">{currentTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isPreviewMode && (
              <span className="hidden sm:inline-block text-xs font-medium text-[#3C4044] bg-[#EDBF9B]/60 px-2.5 py-1 rounded-sm">
                Local Preview Storage
              </span>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#1F2225] text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Active Section */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <AdminOverview orders={orders} ordersLoading={ordersLoading} onNavigate={setActiveSection} />
          )}
          {activeSection === 'products' && <AdminProducts />}
          {activeSection === 'inventory' && <AdminInventory />}
          {activeSection === 'offers' && <AdminOffers />}
          {activeSection === 'orders' && (
            <AdminOrders orders={orders} loading={ordersLoading} onRefresh={loadOrders} />
          )}
          {activeSection === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};
