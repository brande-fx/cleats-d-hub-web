import React, {useState} from 'react';
import {AlertCircle, ArrowLeft, Check, Copy, ExternalLink, MessageCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import {ResilientImage} from '../components/ResilientImage';
import {useCart} from '../hooks/useCart';
import {useStoreData} from '../hooks/useStoreData';
import {placeCustomerOrder} from '../services/storeService';
import {triggerWhatsAppRedirect} from '../services/whatsappService';
import {CheckoutFormData, OrderPlacementResult} from '../types';
import {formatCurrency} from '../utils/formatters';

export const CheckoutPage: React.FC = () => {
  const {items, subtotal, deliveryCharge, totalAmount, clearCart, validateCartAvailability} = useCart();
  const {settings, refreshStore} = useStoreData();

  const [form, setForm] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    city_locality: '',
    pin_code: '',
    order_notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderPlacementResult | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const stockIssues = validateCartAvailability();

  const validateForm = (): string | null => {
    if (form.customer_name.trim().length < 2) {
      return 'Please enter your full name.';
    }
    const phoneDigits = form.customer_phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return 'Please enter a valid 10–15 digit phone number.';
    }
    if (form.delivery_address.trim().length < 6) {
      return 'Please enter your complete delivery address.';
    }
    if (form.city_locality.trim().length < 2) {
      return 'Please enter your city or locality.';
    }
    if (!/^[a-zA-Z0-9\s-]{4,10}$/.test(form.pin_code.trim())) {
      return 'Please enter a valid PIN / postal code.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }

    if (stockIssues.length > 0) {
      setFormError(stockIssues.map((i) => i.message).join(' '));
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeCustomerOrder(form, items, settings);
      setOrderResult(result);
      clearCart();
      await refreshStore(false);
      triggerWhatsAppRedirect(result.whatsapp_url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!orderResult) return;
    try {
      await navigator.clipboard.writeText(orderResult.whatsapp_message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // Fallback ignored if clipboard permissions are restricted
    }
  };

  // Post-Submission Screen (Clear distinction: Recorded in store DB, awaiting user to press Send in WhatsApp)
  if (orderResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-[#3C4044]/15 pb-5">
            <p className="font-mono-num text-xs font-semibold uppercase tracking-wider text-[#FD7B41]">
              Order Saved · Ref #{orderResult.order_number}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1F2225]">
              Press Send in WhatsApp to complete your order
            </h1>
            <p className="text-sm text-[#3C4044]/85 leading-relaxed">
              Your order details have been recorded on our store system with status{' '}
              <strong className="text-[#1F2225]">Pending Confirmation</strong>. Your order is{' '}
              <strong className="text-[#1F2225]">not confirmed yet</strong> — WhatsApp should open with your pre-filled order message so you can tap <strong>Send</strong>.
            </p>
          </div>

          {/* Primary & Fallback Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={orderResult.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-bold text-sm rounded-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp to Send Order</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] bg-[#E9E8E6] hover:bg-[#DDDCDB] text-[#1F2225] font-semibold text-sm rounded-md transition-colors cursor-pointer"
            >
              {copiedMessage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMessage ? 'Message Copied' : 'Copy Order Text'}</span>
            </button>
          </div>

          {/* Fallback Instructions & Message Preview */}
          <div className="bg-[#E9E8E6] border border-[#3C4044]/15 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-[#3C4044]">
              <span className="font-semibold">WhatsApp Fallback Message Preview</span>
              <span className="font-mono-num">
                Store WhatsApp: +{settings.whatsapp_country_code} {settings.whatsapp_number}
              </span>
            </div>
            <pre className="text-xs font-mono-num text-[#1F2225] bg-white p-3.5 rounded-md border border-[#3C4044]/10 whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {orderResult.whatsapp_message}
            </pre>
            <p className="text-xs text-[#3C4044]/80">
              If WhatsApp did not launch automatically on your device, copy the order text above and send it manually to{' '}
              <span className="font-mono-num font-semibold">{settings.contact_phone}</span> quoting reference{' '}
              <span className="font-mono-num font-semibold">{orderResult.order_number}</span>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#3C4044] hover:text-[#FD7B41]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>
            <span className="font-mono-num text-sm font-bold text-[#1F2225]">
              Total: {formatCurrency(orderResult.total_amount)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Empty Cart Guard
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#1F2225]">Your shopping cart is empty</h1>
        <p className="text-sm text-[#3C4044]/80">
          Add football boots or cleats to your cart before proceeding to WhatsApp checkout.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md"
        >
          Browse Cleats &amp; Boots
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-1 border-b border-[#3C4044]/15 pb-5">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3C4044]/75 hover:text-[#1F2225] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
        <h1 className="font-display text-3xl font-extrabold text-[#1F2225]">WhatsApp Checkout</h1>
        <p className="text-sm text-[#3C4044]/80">
          Enter your delivery details below to generate your formatted order message for WhatsApp.
        </p>
      </div>

      {stockIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Inventory update required before checkout:</p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs">
              {stockIssues.map((issue) => (
                <li key={`${issue.productId}-${issue.sizeLabel}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Delivery Details Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-7 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-lg font-bold text-[#1F2225]">Delivery Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="customer_name" className="block text-xs font-semibold text-[#3C4044]">
                Full Name *
              </label>
              <input
                id="customer_name"
                type="text"
                required
                value={form.customer_name}
                onChange={(e) => setForm({...form, customer_name: e.target.value})}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="customer_phone" className="block text-xs font-semibold text-[#3C4044]">
                Phone / WhatsApp Number *
              </label>
              <input
                id="customer_phone"
                type="tel"
                required
                value={form.customer_phone}
                onChange={(e) => setForm({...form, customer_phone: e.target.value})}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="delivery_address" className="block text-xs font-semibold text-[#3C4044]">
              Street Address / House &amp; Building *
            </label>
            <textarea
              id="delivery_address"
              rows={2}
              required
              value={form.delivery_address}
              onChange={(e) => setForm({...form, delivery_address: e.target.value})}
              placeholder="House/Flat No., Street, Landmark"
              className="w-full px-3.5 py-2.5 bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="city_locality" className="block text-xs font-semibold text-[#3C4044]">
                City / Locality *
              </label>
              <input
                id="city_locality"
                type="text"
                required
                value={form.city_locality}
                onChange={(e) => setForm({...form, city_locality: e.target.value})}
                placeholder="e.g. Indiranagar, Bengaluru"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pin_code" className="block text-xs font-semibold text-[#3C4044]">
                PIN Code *
              </label>
              <input
                id="pin_code"
                type="text"
                required
                value={form.pin_code}
                onChange={(e) => setForm({...form, pin_code: e.target.value})}
                placeholder="e.g. 560038"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm font-mono-num text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="order_notes" className="block text-xs font-semibold text-[#3C4044]">
              Order Instructions (Optional)
            </label>
            <input
              id="order_notes"
              type="text"
              value={form.order_notes}
              onChange={(e) => setForm({...form, order_notes: e.target.value})}
              placeholder="Preferred delivery time or sizing note"
              className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
            />
          </div>

          {formError && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || stockIssues.length > 0}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 min-h-[48px] bg-[#FD7B41] hover:bg-[#fc6b2b] disabled:bg-[#DDDCDB] disabled:text-[#3C4044]/50 text-[#1F2225] font-bold text-sm rounded-md transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{submitting ? 'Saving Order & Opening WhatsApp…' : 'Place Order via WhatsApp'}</span>
          </button>

          <p className="text-xs text-[#3C4044]/75">
            Clicking above records your order and opens WhatsApp with a pre-filled summary. Remember to press <strong>Send</strong> inside WhatsApp.
          </p>
        </form>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-[#1F2225]">Order Summary</h2>

          <div className="divide-y divide-[#3C4044]/10">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.size_label}`} className="py-3.5 flex gap-3.5 items-center">
                <div className="w-16 h-14 rounded-md overflow-hidden bg-[#E8E7E5] shrink-0 border border-[#3C4044]/10">
                  <ResilientImage src={item.image_url} alt={item.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1F2225] truncate">{item.name}</p>
                  <p className="text-xs text-[#3C4044]/75 font-mono-num">
                    {item.size_label} · Qty {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono-num text-sm font-bold text-[#1F2225]">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </p>
                  {item.unit_price < item.regular_price && (
                    <p className="font-mono-num text-[11px] text-[#3C4044]/55 line-through">
                      {formatCurrency(item.regular_price * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#3C4044]/15 space-y-2 text-sm">
            <div className="flex justify-between text-[#3C4044]">
              <span>Subtotal</span>
              <span className="font-mono-num font-semibold text-[#1F2225]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#3C4044]">
              <span>Delivery Charges</span>
              <span className="font-mono-num font-medium text-[#1F2225]">
                {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#3C4044]/15 text-base font-extrabold text-[#1F2225]">
              <span>Final Total</span>
              <span className="font-mono-num">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
