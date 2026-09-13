create table if not exists public.products (
  id bigint primary key,
  page bigint,
  name text,
  brand text,
  category text default 'All Deals',
  price numeric default 0,
  mrp numeric default 0,
  old_price numeric default 0,
  discount numeric default 0,
  rating numeric default 4.3,
  reviews text default '0',
  review_count integer default 0,
  image text default '',
  gallery_images jsonb default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  key_points jsonb default '[]'::jsonb,
  description text default '',
  is_top10 boolean default false,
  top10_rank integer,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.products enable row level security;
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using (is_active = true);
