-- Cobro web de LudiKordo (opción B, ADR 0011).
-- Mercado Pago (ARS) y cripto (USDC/USDT) pasan por este backend; Paddle va
-- directo de RevenueCat. El acceso Premium de la app sigue saliendo de RevenueCat:
-- estas tablas guardan lo que hace falta para otorgarlo y para las promos.

-- Quién puede usar el seteador de promos y los precios web. Se carga a mano:
--   insert into public.admins (email) values ('tu-correo@gmail.com');
create table public.admins (
  email text primary key
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

-- Precios de lista de los canales que cobra este backend (Paddle tiene los suyos).
-- Los carga Marcelo desde el panel; el código nunca trae precios (ADR 0004).
create table public.prices (
  app text not null check (app in ('bass', 'guitar', 'nylon')),
  plan text not null check (plan in ('anual', 'semestral')),
  channel text not null check (channel in ('mercadopago', 'crypto', 'paddle')),
  currency text not null check (currency in ('ARS', 'USD', 'BRL', 'USDC')),
  amount numeric(12, 2) not null check (amount > 0),
  updated_at timestamptz not null default now(),
  primary key (app, plan, channel, currency)
);
alter table public.prices enable row level security;
create policy "precios visibles para todos" on public.prices for select using (true);
create policy "precios editables por admins" on public.prices for all using (public.is_admin()) with check (public.is_admin());

-- Seteador de promos.
create table public.promos (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,32}$'),
  percent int not null check (percent between 1 and 90),
  cycles int not null default 1 check (cycles between 0 and 52),
  plans text[] not null default '{anual,semestral}',
  channels text[] not null default '{mercadopago,paddle,crypto}',
  apps text[] not null default '{bass,guitar,nylon}',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  max_redemptions int check (max_redemptions is null or max_redemptions > 0),
  redemptions int not null default 0,
  note text,
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or starts_at < ends_at)
);
alter table public.promos enable row level security;
create policy "promos solo admins" on public.promos for all using (public.is_admin()) with check (public.is_admin());

-- Una fila por suscripción web (o pedido cripto).
create table public.web_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  app text not null check (app in ('bass', 'guitar', 'nylon')),
  channel text not null check (channel in ('mercadopago', 'crypto')),
  external_id text not null,
  plan text not null check (plan in ('anual', 'semestral')),
  status text not null default 'pending',
  currency text not null,
  list_amount numeric(12, 2) not null,
  promo_code text references public.promos (code) on update cascade on delete set null,
  cycles_paid int not null default 0,
  last_payment_id text,
  access_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_id)
);
create index on public.web_subscriptions (user_id);
alter table public.web_subscriptions enable row level security;
create policy "cada uno ve las suyas" on public.web_subscriptions for select using (user_id = auth.uid());
create policy "admins ven todas" on public.web_subscriptions for select using (public.is_admin());

-- Hasta cuándo tiene Premium cada persona en cada app por la web (lo que se manda a RevenueCat).
create table public.premium_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  app text not null check (app in ('bass', 'guitar', 'nylon')),
  access_until timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);
alter table public.premium_access enable row level security;
create policy "cada uno ve su acceso" on public.premium_access for select using (user_id = auth.uid());

-- Suma un canje de forma atómica (lo llaman las funciones con la clave de servicio).
create or replace function public.redeem_promo(p_code text) returns void
language sql security definer set search_path = public as $$
  update public.promos set redemptions = redemptions + 1, updated_at = now() where code = p_code;
$$;
revoke all on function public.redeem_promo(text) from public, anon, authenticated;
