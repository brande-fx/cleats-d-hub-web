import React from 'react';
import {AlertTriangle, ArrowRight, CheckCircle2, Clock, Package} from 'lucide-react';
import {useStoreData} from '../hooks/useStoreData';
import {Order} from '../types';
import {
  formatCurrency,
  formatDateShort,
  getTotalProductStock,
  isLowStockProduct,
} from '../utils/formatters';
import {AdminSection} from './AdminLayout';

interface AdminOverviewProps {
  orders: Order[];
  ordersLoading: boolean;
  onNavigate: (section: AdminSection) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  orders,
  ordersLoading,
  onNavigate,
}) => {
  const {allProducts} = useStoreData();

  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter((p) => p.is_active).length;
  const outOfStockProducts = allProducts.filter((p) => getTotalProductStock(p.sizes) === 0).length;
  const lowStockList = allProducts.filter((p) => isLowStockProduct(p.sizes));

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const confirmedOrders = orders.filter((o) =>
    ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)
  ).length;

  const stats = [
    {label: 'Total Products', value: totalProducts, icon: <Package className="w-4 h-4 text-[#3C4044]" />},
    {label: 'Active Products', value: activeProducts, icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />},
    {label: 'Out-of-Stock Products', value: outOfStockProducts, icon: <AlertTriangle className="w-4 h-4 text-red-700" />},
    {label: 'Low-Stock Products', value: lowStockList.length, icon: <AlertTriangle className="w-4 h-4 text-amber-700" />},
    {label: 'Total Orders Recorded', value: totalOrders, icon: <Clock className="w-4 h-4 text-[#3C4044]" />},
    {label: 'Pending Orders', value: pendingOrders, icon: <Clock className="w-4 h-4 text-[#FD7B41]" />},
    {label: 'Confirmed Orders', value: confirmedOrders, icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />},
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Store Overview</h2>
          <p className="text-sm text-[#3C4044]/80">
            Live snapshot of footwear catalogue, size-level inventory health, and WhatsApp order activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-xs rounded-md transition-colors cursor-pointer self-start"
        >
          <span>Manage Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-lg p-5 space-y-2"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#3C4044]/80">
              <span>{stat.label}</span>
              {stat.icon}
            </div>
            <p className="font-mono-num text-2xl font-bold text-[#1F2225]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#3C4044]/10 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#1F2225]">Recent Orders</h3>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#3C4044] hover:text-[#FD7B41] cursor-pointer"
            >
              View all orders
            </button>
          </div>

          {ordersLoading ? (
            <div className="p-6 text-sm text-[#3C4044]/70">Loading recent orders…</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-sm text-[#3C4044]/75">
              No orders recorded yet. Orders submitted through WhatsApp checkout will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E9E8E6] text-[#3C4044]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order Ref</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3C4044]/10">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-[#DDDCDB]/30">
                      <td className="px-5 py-3 font-mono-num font-semibold text-[#1F2225]">
                        <div>{order.order_number}</div>
                        <div className="text-[11px] font-normal text-[#3C4044]/65">
                          {formatDateShort(order.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#1F2225]">{order.customer_name}</div>
                        <div className="text-[#3C4044]/70 font-mono-num">{order.customer_phone}</div>
                      </td>
                      <td className="px-5 py-3 capitalize font-medium text-[#3C4044]">{order.status}</td>
                      <td className="px-5 py-3 text-right font-mono-num font-semibold text-[#1F2225]">
                        {formatCurrency(order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Warnings */}
        <div className="lg:col-span-5 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#3C4044]/10 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#1F2225]">Low-Stock Size Alerts</h3>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-[#3C4044] hover:text-[#FD7B41] cursor-pointer"
            >
              Restock sizes
            </button>
          </div>

          {lowStockList.length === 0 && outOfStockProducts === 0 ? (
            <div className="p-6 text-sm text-[#3C4044]/75">
              All active footwear sizes currently have healthy stock levels.
            </div>
          ) : (
            <div className="divide-y divide-[#3C4044]/10">
              {allProducts
                .filter((p) => getTotalProductStock(p.sizes) === 0 || isLowStockProduct(p.sizes))
                .slice(0, 6)
                .map((p) => {
                  const lowSizes = p.sizes.filter((s) => s.is_available && s.stock_quantity <= 2);
                  const total = getTotalProductStock(p.sizes);
                  return (
                    <div key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1F2225] truncate">{p.name}</p>
                        <p className="text-[#3C4044]/75 truncate">
                          {total === 0
                            ? 'All sizes out of stock'
                            : `Low sizes: ${lowSizes.map((s) => `${s.size_label} (${s.stock_quantity})`).join(', ')}`}
                        </p>
                      </div>
                      <span
                        className={`font-mono-num font-semibold shrink-0 ${
                          total === 0 ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {total} left
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
