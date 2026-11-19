-- =============================================================================
-- 004_hero_image_url.sql
-- Adds customizable homepage hero image URL to store_settings
-- =============================================================================

alter table public.store_settings
  add column if not exists hero_image_url text
  default '/assets/aistudio/download_6a122e79.jpg';

update public.store_settings
set hero_image_url = coalesce(nullif(hero_image_url, ''), '/assets/aistudio/download_6a122e79.jpg')
where id = 1;
