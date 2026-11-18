import React, {useState} from 'react';
import {ChevronDown, ChevronUp, Info, RefreshCw, Search} from 'lucide-react';
import {updateOrderStatus} from '../services/storeService';
import {Order, OrderStatus} from '../types';
import {formatCurrency, formatDateShort} from '../utils/formatters';

interface AdminOrdersProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const AdminOrders: React.FC<AdminOrdersProps> = ({orders, loading, onRefresh}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setError(null);
    try {
      await updateOrderStatus(orderId, nextStatus);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#1F2225]">Order Management</h2>
          <p className="text-sm text-[#3C4044]/80">
            Review website-recorded WhatsApp orders and update fulfillment status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#1F2225] text-xs font-semibold rounded-md cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Explicit WhatsApp Verification Notice */}
      <div className="bg-[#EDBF9B]/45 border border-[#3C4044]/15 rounded-lg p-4 flex items-start gap-3 text-xs text-[#1F2225]">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#3C4044]" />
        <p className="leading-relaxed">
          <strong>Website Submission vs. Business Confirmation:</strong> Orders listed as{' '}
          <span className="font-semibold">Pending</span> were recorded when the customer clicked WhatsApp Checkout. WhatsApp does not automatically confirm delivery or payment back to the store — verify the incoming WhatsApp chat before changing status to <span className="font-semibold">Confirmed</span>.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
              statusFilter === 'all' ? 'bg-[#3C4044] text-[#F7F6F5]' : 'bg-[#F7F6F5] text-[#3C4044]'
            }`}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize cursor-pointer ${
                statusFilter === st ? 'bg-[#3C4044] text-[#F7F6F5]' : 'bg-[#F7F6F5] text-[#3C4044]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#3C4044]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone…"
            className="w-full pl-9 pr-3 py-2 bg-[#F7F6F5] border border-[#3C4044]/20 rounded-md text-xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">{error}</div>
      )}

      {/* Orders List */}
      <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#3C4044]/75">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-sm text-[#3C4044]/75 text-center">No orders found matching this filter.</div>
        ) : (
          <div className="divide-y divide-[#3C4044]/10">
            {filtered.map((order) => {
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className="p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono-num text-sm font-bold text-[#1F2225]">
                          {order.order_number}
                        </span>
                        <span className="text-xs text-[#3C4044]/70">
                          {formatDateShort(order.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#1F2225]">
                        {order.customer_name} ·{' '}
                        <span className="font-mono-num font-normal text-[#3C4044]">
                          {order.customer_phone}
                        </span>
                      </p>
                      <p className="text-xs text-[#3C4044]/80">
                        {order.delivery_address}, {order.city_locality} - {order.pin_code}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right mr-2">
                        <p className="font-mono-num text-base font-bold text-[#1F2225]">
                          {formatCurrency(order.total_amount)}
                        </p>
                        <p className="text-[11px] text-[#3C4044]/70">
                          {order.items?.length || 0} line item(s)
                        </p>
                      </div>

                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => void handleStatusChange(order.id, e.target.value as OrderStatus)}
                        aria-label={`Order status for ${order.order_number}`}
                        className="px-3 py-2 bg-white border border-[#3C4044]/25 rounded-md text-xs font-semibold capitalize text-[#1F2225]"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-[#E9E8E6] hover:bg-[#DDDCDB] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Items' : 'View Items'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-white border border-[#3C4044]/15 rounded-lg p-4 space-y-3 text-xs">
                      {order.order_notes && (
                        <p className="text-[#3C4044]">
                          <strong>Customer Note:</strong> {order.order_notes}
                        </p>
                      )}
                      <table className="w-full text-left">
                        <thead className="border-b border-[#3C4044]/15 text-[#3C4044]/80">
                          <tr>
                            <th className="py-2 font-semibold">Boot / Cleat</th>
                            <th className="py-2 font-semibold">Size</th>
                            <th className="py-2 font-semibold text-right">Qty</th>
                            <th className="py-2 font-semibold text-right">Unit Price</th>
                            <th className="py-2 font-semibold text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3C4044]/10">
                          {(order.items || []).map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 font-medium text-[#1F2225]">
                                {item.product_name} <span className="text-[#3C4044]/70">({item.brand})</span>
                              </td>
                              <td className="py-2 font-mono-num">{item.size_label}</td>
                              <td className="py-2 text-right font-mono-num">{item.quantity}</td>
                              <td className="py-2 text-right font-mono-num">{formatCurrency(item.unit_price)}</td>
                              <td className="py-2 text-right font-mono-num font-semibold">
                                {formatCurrency(item.line_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex flex-wrap justify-end gap-6 pt-2 border-t border-[#3C4044]/10 font-mono-num">
                        <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                        <span>Delivery: {formatCurrency(order.delivery_charge)}</span>
                        <span className="font-bold text-[#1F2225]">Total: {formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
