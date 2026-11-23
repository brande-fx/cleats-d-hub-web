-- =============================================================================
-- 005_product_sections.sql
-- Adds dedicated product_section classification ('shoes', 'jerseys', 'accessories')
-- =============================================================================

alter table public.products
  add column if not exists product_section text not null default 'shoes';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_product_section_check'
  ) then
    alter table public.products
      add constraint products_product_section_check
      check (product_section in ('shoes', 'jerseys', 'accessories'));
  end if;
end $$;

create index if not exists idx_products_section on public.products(product_section);
