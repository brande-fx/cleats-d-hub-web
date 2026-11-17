-- =============================================================================
-- 003_seed_data.sql
-- Starter categories & default store settings for Calcite Footwear
-- =============================================================================

insert into public.store_settings (
  id,
  store_name,
  store_logo_url,
  whatsapp_country_code,
  whatsapp_number,
  contact_phone,
  store_email,
  store_address,
  delivery_charge,
  free_delivery_threshold,
  promo_banner_text,
  promo_banner_active,
  instagram_url,
  facebook_url,
  youtube_url
) values (
  1,
  'Calcite Footwear',
  '',
  '91',
  '9876543210',
  '+91 98765 43210',
  'support@calcitefootwear.com',
  '42 Residency Road, Indiranagar, Bengaluru 560038',
  99,
  2999,
  'Free delivery on orders above ₹2,999 · Instant WhatsApp Express Checkout',
  true,
  'https://instagram.com',
  'https://facebook.com',
  'https://youtube.com'
)
on conflict (id) do nothing;

insert into public.categories (name, slug, description, display_order) values
  ('Running', 'running', 'Carbon-plated race shoes and daily road trainers.', 1),
  ('Training', 'training', 'Flat-base gym stability and HIIT footwear.', 2),
  ('Trail', 'trail', 'High-traction lugged shoes built for rugged terrain.', 3),
  ('Court', 'court', 'Responsive indoor & hardwood court sneakers.', 4),
  ('Lifestyle', 'lifestyle', 'Minimalist everyday athletic silhouettes.', 5)
on conflict (slug) do nothing;
