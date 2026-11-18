-- =============================================================================
-- 003_seed_data.sql
-- Starter categories & default store settings for Cleats D Hub
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
  'Cleats D Hub',
  '/assets/aistudio/764661096_18022752785897591_8307935459680660719_n_a9cc3fb8.jpg',
  '91',
  '6909367070',
  '+91 6909367070',
  'support@cleatsdhub.com',
  '42 Residency Road, Indiranagar, Bengaluru 560038',
  99,
  2999,
  'Free delivery on football boots above ₹2,999 · Instant WhatsApp Express Checkout',
  true,
  'https://instagram.com',
  'https://facebook.com',
  'https://youtube.com'
)
on conflict (id) do nothing;

insert into public.categories (name, slug, description, display_order) values
  ('Firm Ground (FG)', 'firm-ground', 'Molded-stud football cleats engineered for natural grass pitches.', 1),
  ('Turf (TF)', 'turf', 'Multi-stud rubber outsole football boots built for artificial turf and 5-a-side.', 2),
  ('Artificial Grass (AG)', 'artificial-grass', 'Conical-stud cleats engineered for durability and traction on 3G/4G grass.', 3),
  ('Futsal (IC)', 'futsal', 'Low-profile non-marking gum soles for indoor courts and street football.', 4),
  ('Soft Ground (SG)', 'soft-ground', 'Hybrid screw-in stud football boots for wet and muddy grass pitches.', 5)
on conflict (slug) do nothing;
