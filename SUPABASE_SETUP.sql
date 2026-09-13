create table if not exists public.products (
  id bigint primary key,
  page bigint,
  name text not null default '',
  brand text not null default '',
  category text not null default 'All Deals',
  price numeric not null default 0,
  mrp numeric not null default 0,
  old_price numeric not null default 0,
  discount numeric not null default 0,
  rating numeric not null default 4.3,
  reviews text not null default '0',
  review_count integer not null default 0,
  image text not null default '',
  gallery_images jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  key_points jsonb not null default '[]'::jsonb,
  description text not null default '',
  is_top10 boolean not null default false,
  top10_rank integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public visitors can read only active products. The server API uses the secret key.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create index if not exists products_active_top10_idx
on public.products (is_active, top10_rank);

create index if not exists products_category_idx
on public.products (category);
