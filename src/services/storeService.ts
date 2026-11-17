import {
  CartItem,
  Category,
  CheckoutFormData,
  Order,
  OrderPlacementResult,
  OrderStatus,
  Product,
  ProductSize,
  StoreSettings,
} from '../types';
import {computeDiscountPercentage, getEffectivePrice, slugify} from '../utils/formatters';
import {blobToDataUrl, optimizeProductImage} from '../utils/imageOptimizer';
import {DEFAULT_STORE_SETTINGS, INITIAL_CATEGORIES, INITIAL_ORDERS, INITIAL_PRODUCTS} from './seedData';
import {isSupabaseConfigured, supabase} from './supabaseClient';
import {buildWhatsAppOrderMessage, buildWhatsAppUrl} from './whatsappService';

const STORAGE_KEYS = {
  products: 'cleatsdhub_preview_products_v2',
  categories: 'cleatsdhub_preview_categories_v2',
  orders: 'cleatsdhub_preview_orders_v2',
  settings: 'cleatsdhub_preview_settings_v4',
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in preview mode
  }
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Store Settings
// =============================================================================
export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured || !supabase) {
    return readLocal<StoreSettings>(STORAGE_KEYS.settings, DEFAULT_STORE_SETTINGS);
  }

  const {data, error} = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
  if (error) {
    throw new Error(`Unable to load store settings: ${error.message}`);
  }
  if (!data) {
    return DEFAULT_STORE_SETTINGS;
  }
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...data,
    delivery_charge: Number(data.delivery_charge ?? 0),
    free_delivery_threshold: Number(data.free_delivery_threshold ?? 0),
  };
}

export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  if (!isSupabaseConfigured || !supabase) {
    const current = readLocal<StoreSettings>(STORAGE_KEYS.settings, DEFAULT_STORE_SETTINGS);
    const updated = {...current, ...patch, id: 1};
    writeLocal(STORAGE_KEYS.settings, updated);
    return updated;
  }

  const payload = {
    ...patch,
    id: 1,
  };
  const {data, error} = await supabase.from('store_settings').upsert(payload).select().single();
  if (error) {
    throw new Error(`Failed to save store settings: ${error.message}`);
  }
  return data as StoreSettings;
}

// =============================================================================
// Categories
// =============================================================================
export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return readLocal<Category[]>(STORAGE_KEYS.categories, INITIAL_CATEGORIES);
  }

  const {data, error} = await supabase
    .from('categories')
    .select('*')
    .order('display_order', {ascending: true})
    .order('name', {ascending: true});

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`);
  }
  return (data || []) as Category[];
}

export async function upsertCategory(category: Partial<Category> & {name: string}): Promise<Category> {
  const cleanSlug = category.slug ? slugify(category.slug) : slugify(category.name);

  if (!isSupabaseConfigured || !supabase) {
    const categories = readLocal<Category[]>(STORAGE_KEYS.categories, INITIAL_CATEGORIES);
    if (category.id) {
      const updated = categories.map((c) =>
        c.id === category.id ? {...c, ...category, slug: cleanSlug} : c
      );
      writeLocal(STORAGE_KEYS.categories, updated);
      return updated.find((c) => c.id === category.id)!;
    }
    const created: Category = {
      id: generateId('cat'),
      name: category.name.trim(),
      slug: cleanSlug,
      description: category.description || '',
      display_order: category.display_order ?? categories.length + 1,
    };
    writeLocal(STORAGE_KEYS.categories, [...categories, created]);
    return created;
  }

  const payload = {
    name: category.name.trim(),
    slug: cleanSlug,
    description: category.description || '',
    display_order: category.display_order ?? 0,
  };

  if (category.id) {
    const {data, error} = await supabase
      .from('categories')
      .update(payload)
      .eq('id', category.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Category;
  }

  const {data, error} = await supabase.from('categories').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as Category;
}

// =============================================================================
// Products & Size Inventory
// =============================================================================
export async function fetchProducts(includeInactive = false): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    const all = readLocal<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    return includeInactive ? all : all.filter((p) => p.is_active);
  }

  let query = supabase
    .from('products')
    .select(
      `
      *,
      categories ( id, name, slug ),
      product_sizes ( id, product_id, size_label, stock_quantity, is_available, sort_order )
    `
    )
    .order('created_at', {ascending: false});

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(`Unable to load products: ${error.message}`);
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const cat = row.categories as {id: string; name: string; slug: string} | null;
    const rawSizes = (row.product_sizes as ProductSize[] | null) || [];
    return {
      ...(row as unknown as Product),
      regular_price: Number(row.regular_price),
      discounted_price: row.discounted_price !== null ? Number(row.discounted_price) : null,
      discount_percentage: Number(row.discount_percentage ?? 0),
      category_name: cat?.name || 'Footwear',
      category_slug: cat?.slug || '',
      gallery_urls: Array.isArray(row.gallery_urls) ? (row.gallery_urls as string[]) : [],
      sizes: [...rawSizes].sort((a, b) => a.sort_order - b.sort_order),
    };
  });
}

export interface SaveProductInput {
  id?: string;
  name: string;
  brand: string;
  category_id: string | null;
  description: string;
  regular_price: number;
  discounted_price: number | null;
  image_url: string;
  gallery_urls?: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_special_offer: boolean;
  offer_label: string;
  sizes: Array<{
    id?: string;
    size_label: string;
    stock_quantity: number;
    is_available: boolean;
    sort_order: number;
  }>;
}

export async function saveProduct(input: SaveProductInput): Promise<Product> {
  const regularPrice = Math.max(0, Number(input.regular_price));
  const discountedPrice =
    input.discounted_price !== null && input.discounted_price > 0 && input.discounted_price < regularPrice
      ? Number(input.discounted_price)
      : null;
  const discountPercentage = computeDiscountPercentage(regularPrice, discountedPrice);
  const cleanSizes = input.sizes
    .filter((s) => s.size_label.trim().length > 0)
    .map((s, index) => ({
      id: s.id,
      size_label: s.size_label.trim(),
      stock_quantity: Math.max(0, Math.floor(Number(s.stock_quantity) || 0)),
      is_available: s.is_available,
      sort_order: s.sort_order ?? index + 1,
    }));

  if (!isSupabaseConfigured || !supabase) {
    const products = readLocal<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    const categories = readLocal<Category[]>(STORAGE_KEYS.categories, INITIAL_CATEGORIES);
    const cat = categories.find((c) => c.id === input.category_id);
    const now = new Date().toISOString();

    if (input.id) {
      const updated = products.map((p) => {
        if (p.id !== input.id) return p;
        const sizes: ProductSize[] = cleanSizes.map((s) => ({
          id: s.id || generateId('sz'),
          product_id: p.id,
          size_label: s.size_label,
          stock_quantity: s.stock_quantity,
          is_available: s.is_available,
          sort_order: s.sort_order,
        }));
        return {
          ...p,
          name: input.name.trim(),
          brand: input.brand.trim(),
          category_id: input.category_id,
          category_name: cat?.name || 'Footwear',
          category_slug: cat?.slug || '',
          description: input.description.trim(),
          regular_price: regularPrice,
          discounted_price: discountedPrice,
          discount_percentage: discountPercentage,
          image_url: input.image_url,
          gallery_urls: input.gallery_urls?.length ? input.gallery_urls : [input.image_url],
          is_active: input.is_active,
          is_featured: input.is_featured,
          is_new_arrival: input.is_new_arrival,
          is_best_seller: input.is_best_seller,
          is_special_offer: input.is_special_offer || discountPercentage > 0,
          offer_label: input.offer_label.trim(),
          updated_at: now,
          sizes,
        };
      });
      writeLocal(STORAGE_KEYS.products, updated);
      return updated.find((p) => p.id === input.id)!;
    }

    const newId = generateId('prod');
    const uniqueSlug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const newProduct: Product = {
      id: newId,
      name: input.name.trim(),
      slug: uniqueSlug,
      brand: input.brand.trim(),
      category_id: input.category_id,
      category_name: cat?.name || 'Footwear',
      category_slug: cat?.slug || '',
      description: input.description.trim(),
      regular_price: regularPrice,
      discounted_price: discountedPrice,
      discount_percentage: discountPercentage,
      image_url: input.image_url,
      gallery_urls: input.gallery_urls?.length ? input.gallery_urls : [input.image_url],
      is_active: input.is_active,
      is_featured: input.is_featured,
      is_new_arrival: input.is_new_arrival,
      is_best_seller: input.is_best_seller,
      is_special_offer: input.is_special_offer || discountPercentage > 0,
      offer_label: input.offer_label.trim(),
      created_at: now,
      updated_at: now,
      sizes: cleanSizes.map((s) => ({
        id: generateId('sz'),
        product_id: newId,
        size_label: s.size_label,
        stock_quantity: s.stock_quantity,
        is_available: s.is_available,
        sort_order: s.sort_order,
      })),
    };
    writeLocal(STORAGE_KEYS.products, [newProduct, ...products]);
    return newProduct;
  }

  // Real Supabase mutation
  const productPayload = {
    name: input.name.trim(),
    brand: input.brand.trim(),
    category_id: input.category_id || null,
    description: input.description.trim(),
    regular_price: regularPrice,
    discounted_price: discountedPrice,
    discount_percentage: discountPercentage,
    image_url: input.image_url,
    gallery_urls: input.gallery_urls?.length ? input.gallery_urls : input.image_url ? [input.image_url] : [],
    is_active: input.is_active,
    is_featured: input.is_featured,
    is_new_arrival: input.is_new_arrival,
    is_best_seller: input.is_best_seller,
    is_special_offer: input.is_special_offer,
    offer_label: input.offer_label.trim(),
  };

  let productId = input.id;
  if (productId) {
    const {error} = await supabase.from('products').update(productPayload).eq('id', productId);
    if (error) throw new Error(`Failed to update product: ${error.message}`);
  } else {
    const uniqueSlug = `${slugify(input.name)}-${Date.now().toString(36).slice(-4)}`;
    const {data, error} = await supabase
      .from('products')
      .insert({...productPayload, slug: uniqueSlug})
      .select('id')
      .single();
    if (error) throw new Error(`Failed to create product: ${error.message}`);
    productId = data.id;
  }

  // Sync sizes cleanly
  const {error: delErr} = await supabase.from('product_sizes').delete().eq('product_id', productId);
  if (delErr) throw new Error(`Failed to update sizes: ${delErr.message}`);

  if (cleanSizes.length > 0) {
    const sizeRows = cleanSizes.map((s) => ({
      product_id: productId,
      size_label: s.size_label,
      stock_quantity: s.stock_quantity,
      is_available: s.is_available,
      sort_order: s.sort_order,
    }));
    const {error: insErr} = await supabase.from('product_sizes').insert(sizeRows);
    if (insErr) throw new Error(`Failed to save size inventory: ${insErr.message}`);
  }

  const all = await fetchProducts(true);
  const found = all.find((p) => p.id === productId);
  if (!found) throw new Error('Saved product could not be reloaded.');
  return found;
}

export async function updateProductSizes(
  productId: string,
  sizes: Array<{size_label: string; stock_quantity: number; is_available: boolean; sort_order: number}>
): Promise<void> {
  const sanitized = sizes.map((s, idx) => ({
    size_label: s.size_label.trim(),
    stock_quantity: Math.max(0, Math.floor(Number(s.stock_quantity) || 0)),
    is_available: s.is_available,
    sort_order: s.sort_order ?? idx + 1,
  }));

  if (!isSupabaseConfigured || !supabase) {
    const products = readLocal<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            sizes: sanitized.map((s) => ({
              id: generateId('sz'),
              product_id: productId,
              ...s,
            })),
          }
        : p
    );
    writeLocal(STORAGE_KEYS.products, updated);
    return;
  }

  const {error: delErr} = await supabase.from('product_sizes').delete().eq('product_id', productId);
  if (delErr) throw new Error(delErr.message);

  if (sanitized.length > 0) {
    const {error: insErr} = await supabase.from('product_sizes').insert(
      sanitized.map((s) => ({
        product_id: productId,
        ...s,
      }))
    );
    if (insErr) throw new Error(insErr.message);
  }
}

export async function toggleProductFlag(
  productId: string,
  patch: Partial<
    Pick<
      Product,
      | 'is_active'
      | 'is_featured'
      | 'is_new_arrival'
      | 'is_best_seller'
      | 'is_special_offer'
      | 'discounted_price'
      | 'discount_percentage'
      | 'offer_label'
    >
  >
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const products = readLocal<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    const updated = products.map((p) => (p.id === productId ? {...p, ...patch} : p));
    writeLocal(STORAGE_KEYS.products, updated);
    return;
  }

  const {error} = await supabase.from('products').update(patch).eq('id', productId);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(productId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const products = readLocal<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    writeLocal(
      STORAGE_KEYS.products,
      products.filter((p) => p.id !== productId)
    );
    return;
  }

  const {error} = await supabase.from('products').delete().eq('id', productId);
  if (error) throw new Error(`Failed to delete product: ${error.message}`);
}

// =============================================================================
// Image Upload (Supabase Storage + Client-Side Optimization)
// =============================================================================
export async function uploadProductImage(file: File): Promise<string> {
  const optimized = await optimizeProductImage(file);

  if (!isSupabaseConfigured || !supabase) {
    return blobToDataUrl(optimized.blob);
  }

  const filePath = `shoes/${optimized.fileName}`;
  const {error: uploadError} = await supabase.storage
    .from('product-images')
    .upload(filePath, optimized.blob, {
      contentType: optimized.mimeType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const {data} = supabase.storage.from('product-images').getPublicUrl(filePath);
  return data.publicUrl;
}

// =============================================================================
// Orders & Checkout
// =============================================================================
export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    return readLocal<Order[]>(STORAGE_KEYS.orders, INITIAL_ORDERS).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const {data, error} = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items ( * )
    `
    )
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(`Unable to load orders: ${error.message}`);
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as Order),
    subtotal: Number(row.subtotal),
    delivery_charge: Number(row.delivery_charge),
    total_amount: Number(row.total_amount),
    items: ((row.order_items as Order['items']) || []).map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
      original_price: Number(item.original_price),
      line_total: Number(item.line_total),
    })),
  }));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const orders = readLocal<Order[]>(STORAGE_KEYS.orders, INITIAL_ORDERS);
    writeLocal(
      STORAGE_KEYS.orders,
      orders.map((o) => (o.id === orderId ? {...o, status, updated_at: new Date().toISOString()} : o))
    );
    return;
  }

  const {error} = await supabase.from('orders').update({status}).eq('id', orderId);
  if (error) throw new Error(`Failed to update order status: ${error.message}`);
}

export interface UpdateOrderDetailsInput {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  city_locality: string;
  pin_code: string;
  order_notes: string;
  delivery_charge: number;
  total_amount: number;
  status: OrderStatus;
}

export async function updateOrderDetails(
  orderId: string,
  input: UpdateOrderDetailsInput
): Promise<void> {
  const payload = {
    customer_name: input.customer_name.trim(),
    customer_phone: input.customer_phone.trim(),
    delivery_address: input.delivery_address.trim(),
    city_locality: input.city_locality.trim(),
    pin_code: input.pin_code.trim(),
    order_notes: input.order_notes.trim(),
    delivery_charge: Math.max(0, Number(input.delivery_charge) || 0),
    total_amount: Math.max(0, Number(input.total_amount) || 0),
    status: input.status,
  };

  if (!isSupabaseConfigured || !supabase) {
    const orders = readLocal<Order[]>(STORAGE_KEYS.orders, INITIAL_ORDERS);
    writeLocal(
      STORAGE_KEYS.orders,
      orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              ...payload,
              updated_at: new Date().toISOString(),
            }
          : o
      )
    );
    return;
  }

  const {error} = await supabase.from('orders').update(payload).eq('id', orderId);
  if (error) throw new Error(`Failed to update order: ${error.message}`);
}

export async function placeCustomerOrder(
  customer: CheckoutFormData,
  cartItems: CartItem[],
  settings: StoreSettings
): Promise<OrderPlacementResult> {
  if (cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  // Re-fetch latest live products to validate availability and current prices
  const latestProducts = await fetchProducts(false);
  const validatedItems: CartItem[] = [];

  for (const item of cartItems) {
    const product = latestProducts.find((p) => p.id === item.product_id);
    if (!product || !product.is_active) {
      throw new Error(`"${item.name}" is no longer available.`);
    }
    const sizeRow = product.sizes.find((s) => s.size_label === item.size_label);
    if (!sizeRow || !sizeRow.is_available || sizeRow.stock_quantity < item.quantity) {
      const available = sizeRow && sizeRow.is_available ? sizeRow.stock_quantity : 0;
      throw new Error(
        `Insufficient stock for ${product.name} (${item.size_label}). Available: ${available}`
      );
    }
    const liveUnitPrice = getEffectivePrice(product);
    validatedItems.push({
      ...item,
      name: product.name,
      brand: product.brand,
      regular_price: product.regular_price,
      unit_price: liveUnitPrice,
      discount_percentage: product.discount_percentage,
    });
  }

  const subtotal = validatedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const deliveryCharge =
    settings.free_delivery_threshold > 0 && subtotal >= settings.free_delivery_threshold
      ? 0
      : settings.delivery_charge;
  const totalAmount = subtotal + deliveryCharge;

  // Build message first (orderNumber inserted once created for local preview or appended)
  if (!isSupabaseConfigured || !supabase) {
    const now = new Date();
    const dateStamp = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNumber = `CF-${dateStamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const whatsappMessage = buildWhatsAppOrderMessage({
      orderNumber,
      customer,
      items: validatedItems,
      subtotal,
      deliveryCharge,
      totalAmount,
      settings,
    });

    const newOrderId = generateId('ord');
    const newOrder: Order = {
      id: newOrderId,
      order_number: orderNumber,
      customer_name: customer.customer_name.trim(),
      customer_phone: customer.customer_phone.trim(),
      delivery_address: customer.delivery_address.trim(),
      city_locality: customer.city_locality.trim(),
      pin_code: customer.pin_code.trim(),
      order_notes: customer.order_notes.trim(),
      subtotal,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      status: 'pending',
      whatsapp_initiated: true,
      whatsapp_message: whatsappMessage,
      created_at: now.toISOString(),
      items: validatedItems.map((item) => ({
        id: generateId('oi'),
        order_id: newOrderId,
        product_id: item.product_id,
        product_name: item.name,
        brand: item.brand,
        size_label: item.size_label,
        quantity: item.quantity,
        unit_price: item.unit_price,
        original_price: item.regular_price,
        line_total: item.unit_price * item.quantity,
      })),
    };

    const existingOrders = readLocal<Order[]>(STORAGE_KEYS.orders, INITIAL_ORDERS);
    writeLocal(STORAGE_KEYS.orders, [newOrder, ...existingOrders]);

    // Decrement local inventory
    const allProducts = readLocal<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    const updatedProducts = allProducts.map((p) => {
      const matchingItems = validatedItems.filter((ci) => ci.product_id === p.id);
      if (matchingItems.length === 0) return p;
      return {
        ...p,
        sizes: p.sizes.map((sz) => {
          const orderedForSize = matchingItems
            .filter((m) => m.size_label === sz.size_label)
            .reduce((acc, m) => acc + m.quantity, 0);
          if (orderedForSize === 0) return sz;
          const nextQty = Math.max(0, sz.stock_quantity - orderedForSize);
          return {
            ...sz,
            stock_quantity: nextQty,
            is_available: nextQty > 0 ? sz.is_available : false,
          };
        }),
      };
    });
    writeLocal(STORAGE_KEYS.products, updatedProducts);

    return {
      order_id: newOrderId,
      order_number: orderNumber,
      subtotal,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      whatsapp_message: whatsappMessage,
      whatsapp_url: buildWhatsAppUrl(settings, whatsappMessage),
    };
  }

  // Real Supabase atomic RPC transaction
  const draftMessage = buildWhatsAppOrderMessage({
    customer,
    items: validatedItems,
    subtotal,
    deliveryCharge,
    totalAmount,
    settings,
  });

  const rpcPayload = {
    p_customer_name: customer.customer_name.trim(),
    p_customer_phone: customer.customer_phone.trim(),
    p_delivery_address: customer.delivery_address.trim(),
    p_city_locality: customer.city_locality.trim(),
    p_pin_code: customer.pin_code.trim(),
    p_order_notes: customer.order_notes.trim(),
    p_whatsapp_message: draftMessage,
    p_items: validatedItems.map((i) => ({
      product_id: i.product_id,
      size_label: i.size_label,
      quantity: i.quantity,
    })),
  };

  const {data, error} = await supabase.rpc('place_store_order', rpcPayload);
  if (error) {
    throw new Error(error.message || 'Unable to save your order.');
  }

  const finalMessage = buildWhatsAppOrderMessage({
    orderNumber: data.order_number,
    customer,
    items: validatedItems,
    subtotal: Number(data.subtotal),
    deliveryCharge: Number(data.delivery_charge),
    totalAmount: Number(data.total_amount),
    settings,
  });

  return {
    order_id: data.order_id,
    order_number: data.order_number,
    subtotal: Number(data.subtotal),
    delivery_charge: Number(data.delivery_charge),
    total_amount: Number(data.total_amount),
    whatsapp_message: finalMessage,
    whatsapp_url: buildWhatsAppUrl(settings, finalMessage),
  };
}
