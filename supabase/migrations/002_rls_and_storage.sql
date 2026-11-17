-- =============================================================================
-- 002_rls_and_storage.sql
-- Row Level Security (RLS) Policies & Supabase Storage Configuration
-- =============================================================================

-- Helper: checks whether current authenticated user is an active administrator
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'super_admin')
  );
$$;

-- Enable RLS across all tables
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;
alter table public.admin_profiles enable row level security;

-- 1. Categories Policies
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
  on public.categories for select
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Products Policies
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
  on public.products for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- 3. Product Sizes Policies
drop policy if exists "Public can view sizes of active products" on public.product_sizes;
create policy "Public can view sizes of active products"
  on public.product_sizes for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

drop policy if exists "Admins can manage product sizes" on public.product_sizes;
create policy "Admins can manage product sizes"
  on public.product_sizes for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Orders Policies (Customer PII protected: only admins can read/update/delete orders; checkout uses place_store_order RPC)
drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  using (public.is_admin());

-- 5. Order Items Policies
drop policy if exists "Admins can view order items" on public.order_items;
create policy "Admins can view order items"
  on public.order_items for select
  using (public.is_admin());

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Store Settings Policies
drop policy if exists "Public can view store settings" on public.store_settings;
create policy "Public can view store settings"
  on public.store_settings for select
  using (true);

drop policy if exists "Admins can update store settings" on public.store_settings;
create policy "Admins can update store settings"
  on public.store_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Admin Profiles Policies
drop policy if exists "Admins can view own profile" on public.admin_profiles;
create policy "Admins can view own profile"
  on public.admin_profiles for select
  using (auth.uid() = user_id);

-- Grant execute permission on public atomic checkout RPC
grant execute on function public.place_store_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- =============================================================================
-- Storage Bucket: product-images (Public read, Admin-only upload/delete)
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728, -- 3 MB max per image to conserve Supabase Free Tier storage
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for product images" on storage.objects;
create policy "Public read access for product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
