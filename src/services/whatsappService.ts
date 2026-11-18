import {CartItem, CheckoutFormData, StoreSettings} from '../types';
import {formatCurrency} from '../utils/formatters';

export interface WhatsAppMessagePayload {
  orderNumber?: string;
  customer: CheckoutFormData;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  settings: StoreSettings;
}

export function sanitizePhoneDigits(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function buildWhatsAppOrderMessage(payload: WhatsAppMessagePayload): string {
  const {orderNumber, customer, items, subtotal, deliveryCharge, totalAmount, settings} = payload;
  const storeHeader = settings.store_name.toUpperCase();

  const lines: string[] = [
    `NEW ORDER — ${storeHeader}`,
    orderNumber ? `Order Ref: ${orderNumber}` : '',
    '',
    'Customer Details:',
    `Name: ${customer.customer_name.trim()}`,
    `Phone: ${customer.customer_phone.trim()}`,
    `Address: ${customer.delivery_address.trim()}, ${customer.city_locality.trim()} - ${customer.pin_code.trim()}`,
  ].filter((line, idx) => !(idx === 1 && !line));

  if (customer.order_notes.trim()) {
    lines.push(`Instructions: ${customer.order_notes.trim()}`);
  }

  lines.push('', 'ORDER DETAILS:');

  items.forEach((item, index) => {
    const itemLineTotal = item.unit_price * item.quantity;
    lines.push('');
    lines.push(`${index + 1}. ${item.name} (${item.brand})`);
    lines.push(`   Size: ${item.size_label}`);
    lines.push(`   Quantity: ${item.quantity}`);
    if (item.unit_price < item.regular_price) {
      lines.push(
        `   Price: ${formatCurrency(item.unit_price)} each (Reg. ${formatCurrency(item.regular_price)}) · Line: ${formatCurrency(itemLineTotal)}`
      );
    } else {
      lines.push(`   Price: ${formatCurrency(item.unit_price)} each · Line: ${formatCurrency(itemLineTotal)}`);
    }
  });

  lines.push('');
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  lines.push(`Delivery: ${deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}`);
  lines.push(`Total: ${formatCurrency(totalAmount)}`);
  lines.push('');
  lines.push('Please confirm this order.');

  return lines.join('\n');
}

export function buildWhatsAppUrl(settings: StoreSettings, message: string): string {
  const countryCode = sanitizePhoneDigits(settings.whatsapp_country_code || '91');
  const businessPhone = sanitizePhoneDigits(settings.whatsapp_number || '');
  const fullNumber =
    countryCode && businessPhone.startsWith(countryCode) && businessPhone.length > 10
      ? businessPhone
      : `${countryCode}${businessPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullNumber}?text=${encodedMessage}`;
}

export function buildWhatsAppSupportUrl(settings: StoreSettings, topic?: string): string {
  const text = topic
    ? `Hi ${settings.store_name}, I have a question regarding: ${topic}`
    : `Hi ${settings.store_name}, I would like assistance with football boot sizing or an order.`;
  return buildWhatsAppUrl(settings, text);
}

/**
 * Opens WhatsApp in a new tab/app using a standard external anchor link.
 * Always pair with an explicit clickable anchor fallback in the UI.
 */
export function triggerWhatsAppRedirect(url: string): boolean {
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } catch {
    return false;
  }
}
