import React, {useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Edit3,
  Image as ImageIcon,
  Package,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {ResilientImage} from '../components/ResilientImage';
import {useStoreData} from '../hooks/useStoreData';
import {DEFAULT_STORE_SETTINGS} from '../services/seedData';
import {
  deleteOrder,
  updateOrderDetails,
  updateOrderStatus,
  updateStoreSettings,
  uploadHeroImage,
} from '../services/storeService';
import {Order, OrderStatus} from '../types';
import {
  formatCurrency,
  formatDateShort,
  getTotalProductStock,
  isLowStockProduct,
  resolvePublicAssetUrl,
} from '../utils/formatters';
import {AdminSection} from './AdminLayout';

interface AdminOverviewProps {
  orders: Order[];
  ordersLoading: boolean;
  onNavigate: (section: AdminSection) => void;
  onRefreshOrders: () => Promise<void>;
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  orders,
  ordersLoading,
  onNavigate,
  onRefreshOrders,
}) => {
  const {allProducts, settings, refreshStore} = useStoreData();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    city_locality: '',
    pin_code: '',
    order_notes: '',
    delivery_charge: 0,
    status: 'pending' as OrderStatus,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [orderNotice, setOrderNotice] = useState<{type: 'error' | 'success'; text: string} | null>(null);

  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [heroUrlDraft, setHeroUrlDraft] = useState('');
  const [savingHero, setSavingHero] = useState(false);
  const [heroFeedback, setHeroFeedback] = useState<{type: 'error' | 'success'; text: string} | null>(null);

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

  const handleQuickStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    setUpdatingId(order.id);
    setOrderNotice(null);
    try {
      await updateOrderStatus(order.id, nextStatus);
      await onRefreshOrders();
      setOrderNotice({
        type: 'success',
        text: `Updated ${order.order_number} status to ${nextStatus}.`,
      });
    } catch (err) {
      setOrderNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to update order status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openOrderEditor = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      delivery_address: order.delivery_address,
      city_locality: order.city_locality,
      pin_code: order.pin_code,
      order_notes: order.order_notes || '',
      delivery_charge: order.delivery_charge,
      status: order.status,
    });
    setConfirmingDelete(false);
    setOrderNotice(null);
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editForm.customer_name.trim() || !editForm.customer_phone.trim()) {
      setOrderNotice({type: 'error', text: 'Customer name and phone are required.'});
      return;
    }

    const safeDelivery = Math.max(0, Number(editForm.delivery_charge) || 0);
    const recalculatedTotal = editingOrder.subtotal + safeDelivery;

    setSavingEdit(true);
    setOrderNotice(null);
    try {
      await updateOrderDetails(editingOrder.id, {
        ...editForm,
        delivery_charge: safeDelivery,
        total_amount: recalculatedTotal,
      });
      await onRefreshOrders();
      setOrderNotice({
        type: 'success',
        text: `Saved updates for order ${editingOrder.order_number}.`,
      });
      setEditingOrder(null);
    } catch (err) {
      setOrderNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save order updates.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    const orderNumber = editingOrder.order_number;
    setDeletingOrder(true);
    setOrderNotice(null);
    try {
      await deleteOrder(editingOrder.id);
      await onRefreshOrders();
      setOrderNotice({
        type: 'success',
        text: `Deleted order ${orderNumber}.`,
      });
      setConfirmingDelete(false);
      setEditingOrder(null);
    } catch (err) {
      setOrderNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete order.',
      });
    } finally {
      setDeletingOrder(false);
    }
  };

  const openHeroModal = () => {
    setHeroUrlDraft(settings.hero_image_url || DEFAULT_STORE_SETTINGS.hero_image_url);
    setHeroFeedback(null);
    setHeroModalOpen(true);
  };

  const handleOverviewHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingHero(true);
    setHeroFeedback(null);
    try {
      const url = await uploadHeroImage(file);
      setHeroUrlDraft(url);
      await updateStoreSettings({hero_image_url: url});
      await refreshStore(true);
      setHeroFeedback({type: 'success', text: 'Homepage hero image updated.'});
    } catch (err) {
      setHeroFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to upload hero image.',
      });
    } finally {
      setSavingHero(false);
      e.target.value = '';
    }
  };

  const handleSaveHeroUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroUrlDraft.trim();
    if (!trimmed) {
      setHeroFeedback({type: 'error', text: 'Enter an image URL or upload an image file.'});
      return;
    }
    setSavingHero(true);
    setHeroFeedback(null);
    try {
      await updateStoreSettings({hero_image_url: trimmed});
      await refreshStore(true);
      setHeroFeedback({type: 'success', text: 'Homepage hero image updated.'});
    } catch (err) {
      setHeroFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save hero image.',
      });
    } finally {
      setSavingHero(false);
    }
  };

  const handleOverviewHeroReset = async () => {
    setSavingHero(true);
    setHeroFeedback(null);
    try {
      const fallbackUrl = DEFAULT_STORE_SETTINGS.hero_image_url;
      setHeroUrlDraft(fallbackUrl);
      await updateStoreSettings({hero_image_url: fallbackUrl});
      await refreshStore(true);
      setHeroFeedback({type: 'success', text: 'Reset to default hero image.'});
    } catch (err) {
      setHeroFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reset hero image.',
      });
    } finally {
      setSavingHero(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Store Overview</h2>
          <p className="text-sm text-[#3C4044]/80">
            Live snapshot of your football boots &amp; cleats catalogue, UK size stock health, and WhatsApp order activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={openHeroModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] border border-[#3C4044]/20 text-[#1F2225] font-semibold text-xs rounded-md transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Change Hero Image</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-xs rounded-md transition-colors cursor-pointer"
          >
            <span>Manage Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
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
          <div className="px-6 py-4 border-b border-[#3C4044]/10 flex items-center justify-between gap-4">
            <h3 className="font-display text-base font-bold text-[#1F2225]">Recent Orders</h3>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#3C4044] hover:text-[#FD7B41] cursor-pointer"
            >
              View all orders
            </button>
          </div>

          {orderNotice && !editingOrder && (
            <div
              className={`px-6 py-2.5 text-xs font-medium border-b border-[#3C4044]/10 flex items-center justify-between gap-2 ${
                orderNotice.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-[#EDBF9B]/45 text-[#1F2225]'
              }`}
            >
              <span>{orderNotice.text}</span>
              <button
                type="button"
                onClick={() => setOrderNotice(null)}
                className="underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

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
                    <th className="px-4 py-3 font-semibold">Order Ref</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3C4044]/10">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-[#DDDCDB]/30">
                      <td className="px-4 py-3 font-mono-num font-semibold text-[#1F2225]">
                        <div>{order.order_number}</div>
                        <div className="text-[11px] font-normal text-[#3C4044]/65">
                          {formatDateShort(order.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1F2225]">{order.customer_name}</div>
                        <div className="text-[#3C4044]/70 font-mono-num">{order.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => void handleQuickStatusChange(order, e.target.value as OrderStatus)}
                          aria-label={`Update status for ${order.order_number}`}
                          className="px-2.5 py-1.5 bg-white border border-[#3C4044]/25 rounded-sm text-xs font-semibold capitalize text-[#1F2225] cursor-pointer"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold text-[#1F2225]">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openOrderEditor(order)}
                          title={`Edit order ${order.order_number}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#1F2225] font-semibold rounded-sm cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
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
              All active football boot sizes currently have healthy stock levels.
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

      {/* Recent Order Editor Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2225]/60">
          <div className="bg-[#F7F6F5] border border-[#3C4044]/20 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#DDDCDB] px-6 py-4 border-b border-[#3C4044]/15 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#1F2225]">
                  Edit Order {editingOrder.order_number}
                </h3>
                <p className="text-xs text-[#3C4044]/75">
                  {formatDateShort(editingOrder.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 text-[#3C4044] hover:text-[#1F2225] cursor-pointer"
                aria-label="Close order editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.customer_phone}
                    onChange={(e) => setEditForm({...editForm, customer_phone: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3C4044]">Delivery Address</label>
                <textarea
                  rows={2}
                  value={editForm.delivery_address}
                  onChange={(e) => setEditForm({...editForm, delivery_address: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">City / Locality</label>
                  <input
                    type="text"
                    value={editForm.city_locality}
                    onChange={(e) => setEditForm({...editForm, city_locality: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">PIN Code</label>
                  <input
                    type="text"
                    value={editForm.pin_code}
                    onChange={(e) => setEditForm({...editForm, pin_code: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Order Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as OrderStatus})}
                    className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-semibold capitalize"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3C4044]">Delivery Charge (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.delivery_charge}
                    onChange={(e) => setEditForm({...editForm, delivery_charge: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3C4044]">Order Notes</label>
                <input
                  type="text"
                  value={editForm.order_notes}
                  onChange={(e) => setEditForm({...editForm, order_notes: e.target.value})}
                  placeholder="Delivery instructions or internal notes"
                  className="w-full px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-sm"
                />
              </div>

              {/* Ordered Items Summary */}
              {editingOrder.items && editingOrder.items.length > 0 && (
                <div className="bg-[#E9E8E6] border border-[#3C4044]/10 rounded-md p-3.5 space-y-2 text-xs">
                  <p className="font-semibold text-[#1F2225]">Ordered Items</p>
                  <div className="space-y-1">
                    {editingOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2 text-[#3C4044]">
                        <span>
                          {item.product_name} ({item.size_label}) × {item.quantity}
                        </span>
                        <span className="font-mono-num font-semibold text-[#1F2225]">
                          {formatCurrency(item.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#3C4044]/15 font-mono-num font-bold text-[#1F2225]">
                    <span>Updated Total</span>
                    <span>
                      {formatCurrency(
                        editingOrder.subtotal + Math.max(0, Number(editForm.delivery_charge) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {orderNotice && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
                  {orderNotice.text}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#3C4044]/10">
                <div>
                  {!confirmingDelete ? (
                    <button
                      type="button"
                      disabled={savingEdit || deletingOrder}
                      onClick={() => setConfirmingDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Order</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-red-800">Delete permanently?</span>
                      <button
                        type="button"
                        disabled={deletingOrder}
                        onClick={() => void handleDeleteOrder()}
                        className="px-3 py-2 min-h-[36px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md cursor-pointer disabled:opacity-50"
                      >
                        {deletingOrder ? 'Deleting…' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingOrder}
                        onClick={() => setConfirmingDelete(false)}
                        className="px-3 py-2 min-h-[36px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        Keep
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    disabled={savingEdit || deletingOrder}
                    onClick={() => {
                      setConfirmingDelete(false);
                      setEditingOrder(null);
                    }}
                    className="px-4 py-2 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] text-xs font-semibold rounded-md cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || deletingOrder}
                    className="px-5 py-2 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] text-xs font-bold rounded-md cursor-pointer disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving…' : 'Save Order Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Homepage Hero Image Modal */}
      {heroModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2225]/60">
          <div className="bg-[#F7F6F5] border border-[#3C4044]/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#DDDCDB] px-6 py-4 border-b border-[#3C4044]/15 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#1F2225]">
                  Change Homepage Hero Image
                </h3>
                <p className="text-xs text-[#3C4044]/75">
                  Upload any photo or paste an image URL for the main storefront banner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHeroModalOpen(false)}
                className="p-1.5 text-[#3C4044] hover:text-[#1F2225] cursor-pointer"
                aria-label="Close hero image editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeroUrl} className="p-6 space-y-5">
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#E8E7E5] border border-[#3C4044]/15">
                <ResilientImage
                  src={resolvePublicAssetUrl(heroUrlDraft || DEFAULT_STORE_SETTINGS.hero_image_url)}
                  alt="Hero banner preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] text-xs font-bold rounded-md cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{savingHero ? 'Uploading…' : 'Upload New Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={savingHero}
                    onChange={handleOverviewHeroUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  disabled={savingHero}
                  onClick={() => void handleOverviewHeroReset()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] text-xs font-semibold rounded-md cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3C4044]">Or Paste Image URL</label>
                <input
                  type="text"
                  value={heroUrlDraft}
                  onChange={(e) => setHeroUrlDraft(e.target.value)}
                  placeholder="https://example.com/my-cleats-banner.jpg"
                  className="w-full px-3.5 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs text-[#1F2225]"
                />
              </div>

              {heroFeedback && (
                <div
                  className={`p-3 rounded-md text-xs font-medium ${
                    heroFeedback.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-[#EDBF9B]/45 border border-[#3C4044]/15 text-[#1F2225]'
                  }`}
                >
                  {heroFeedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#3C4044]/10">
                <button
                  type="button"
                  disabled={savingHero}
                  onClick={() => setHeroModalOpen(false)}
                  className="px-4 py-2 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#3C4044] text-xs font-semibold rounded-md cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingHero}
                  className="px-5 py-2 min-h-[40px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-xs font-bold rounded-md cursor-pointer disabled:opacity-50"
                >
                  {savingHero ? 'Saving…' : 'Save Image URL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
