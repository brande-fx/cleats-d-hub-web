-- =============================================================================
-- 001_initial_schema.sql
-- Cleats D Hub — Relational Database Schema for Supabase (PostgreSQL)
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text not null,
  product_section text not null default 'shoes' check (product_section in ('shoes', 'jerseys', 'accessories')),
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  regular_price numeric(10, 2) not null check (regular_price >= 0),
  discounted_price numeric(10, 2) check (discounted_price is null or discounted_price >= 0),
  discount_percentage integer not null default 0 check (discount_percentage >= 0 and discount_percentage <= 95),
  image_url text not null default '',
  gallery_urls text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  is_special_offer boolean not null default false,
  offer_label text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_section on public.products(product_section);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_created on public.products(created_at desc);

-- 3. Product Sizes (Size-Level Inventory)
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, size_label)
);

create index if not exists idx_product_sizes_product on public.product_sizes(product_id);

-- 4. Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  city_locality text not null,
  pin_code text not null,
  order_notes text default '',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_charge numeric(10, 2) not null default 0 check (delivery_charge >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  whatsapp_initiated boolean not null default true,
  whatsapp_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);

-- 5. Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  brand text not null default '',
  size_label text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  original_price numeric(10, 2) not null check (original_price >= 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index if not exists idx_order_items_order on public.order_items(order_id);

-- 6. Store Settings (Single-row configuration table)
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'Cleats D Hub',
  store_logo_url text default '/assets/aistudio/764661096_18022752785897591_8307935459680660719_n_a9cc3fb8.jpg',
  hero_image_url text default '/assets/aistudio/download_6a122e79.jpg',
  whatsapp_country_code text not null default '91',
  whatsapp_number text not null default '6909367070',
  contact_phone text not null default '+91 6909367070',
  store_email text not null default 'support@cleatsdhub.com',
  store_address text not null default '42 Residency Road, Indiranagar, Bengaluru 560038',
  delivery_charge numeric(10, 2) not null default 99 check (delivery_charge >= 0),
  free_delivery_threshold numeric(10, 2) not null default 2999 check (free_delivery_threshold >= 0),
  promo_banner_text text not null default 'Free delivery on orders above ₹2,999 · Instant WhatsApp Checkout',
  promo_banner_active boolean not null default true,
  instagram_url text default 'https://instagram.com',
  facebook_url text default '',
  youtube_url text default '',
  updated_at timestamptz not null default now()
);

-- 7. Admin Profiles (Role-Based Access Control)
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'Store Administrator',
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Updated-at trigger helper
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_product_sizes_updated_at on public.product_sizes;
create trigger trg_product_sizes_updated_at
  before update on public.product_sizes
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.handle_updated_at();

-- Atomic Order Submission Function (validates size-level stock & records order safely)
create or replace function public.place_store_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_city_locality text,
  p_pin_code text,
  p_order_notes text,
  p_whatsapp_message text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_size record;
  v_qty integer;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_settings record;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item.';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  if not found then
    v_delivery := 0;
  end if;

  v_order_number := 'CF-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));

  -- Validate every line item against live DB prices and lock size rows
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid item quantity.';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and is_active = true;

    if not found then
      raise exception 'Product is unavailable or inactive.';
    end if;

    select * into v_size
    from public.product_sizes
    where product_id = v_product.id
      and size_label = (v_item->>'size_label')
    for update;

    if not found or not v_size.is_available then
      raise exception 'Size % for % is unavailable.', (v_item->>'size_label'), v_product.name;
    end if;

    if v_size.stock_quantity < v_qty then
      raise exception 'Insufficient stock for % (Size %). Available: %', v_product.name, v_size.size_label, v_size.stock_quantity;
    end if;

    v_unit_price := coalesce(v_product.discounted_price, v_product.regular_price);
    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  end loop;

  if v_settings is not null then
    if v_settings.free_delivery_threshold > 0 and v_subtotal >= v_settings.free_delivery_threshold then
      v_delivery := 0;
    else
      v_delivery := coalesce(v_settings.delivery_charge, 0);
    end if;
  end if;

  v_total := v_subtotal + v_delivery;

  insert into public.orders (
    order_number,
    customer_name,
    customer_phone,
    delivery_address,
    city_locality,
    pin_code,
    order_notes,
    subtotal,
    delivery_charge,
    total_amount,
    status,
    whatsapp_initiated,
    whatsapp_message
  ) values (
    v_order_number,
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_delivery_address),
    trim(p_city_locality),
    trim(p_pin_code),
    coalesce(trim(p_order_notes), ''),
    v_subtotal,
    v_delivery,
    v_total,
    'pending',
    true,
    coalesce(p_whatsapp_message, '')
  )
  returning id into v_order_id;

  -- Insert order items and reserve stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;

    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    v_unit_price := coalesce(v_product.discounted_price, v_product.regular_price);

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      brand,
      size_label,
      quantity,
      unit_price,
      original_price,
      line_total
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.brand,
      v_item->>'size_label',
      v_qty,
      v_unit_price,
      v_product.regular_price,
      v_unit_price * v_qty
    );

    update public.product_sizes
    set stock_quantity = stock_quantity - v_qty
    where product_id = v_product.id and size_label = (v_item->>'size_label');
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_charge', v_delivery,
    'total_amount', v_total
  );
end;
$$;
