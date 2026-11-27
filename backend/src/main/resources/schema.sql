-- MovieTime PostgreSQL Schema for Supabase
-- Note: public.users already exists and is NOT modified.

-- 1. Movies table (with unique slug for /movies/:slug)
create table if not exists public.movies (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name text not null,
  slug text not null,
  description text null,
  image_url text null,
  adult_rating character varying(20) not null default 'PG-13',
  genres text[] not null default '{}',
  duration_minutes integer not null default 120,
  release_date date null,
  constraint movies_pkey primary key (id),
  constraint movies_slug_key unique (slug)
) TABLESPACE pg_default;

-- 2. Shows table (with tickets jsonb array of seats)
create table if not exists public.shows (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  movie_id uuid not null,
  screen_name text not null default 'Screen 1',
  show_time timestamp with time zone not null,
  ticket_price numeric(10, 2) not null default 12.00,
  tickets jsonb not null default '[]'::jsonb,
  constraint shows_pkey primary key (id),
  constraint shows_movie_id_fkey foreign key (movie_id) references public.movies (id) on delete cascade
) TABLESPACE pg_default;

-- 3. Reviews table (user_id, movie_id, review, rating 1..10)
create table if not exists public.reviews (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  movie_id uuid not null,
  review text not null,
  rating integer not null,
  constraint reviews_pkey primary key (id),
  constraint reviews_rating_check check (rating >= 1 and rating <= 10),
  constraint reviews_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint reviews_movie_id_fkey foreign key (movie_id) references public.movies (id) on delete cascade
) TABLESPACE pg_default;

-- 4. Sessions table (id, user_id, token, expires_at)
create table if not exists public.sessions (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  token text not null,
  expires_at timestamp with time zone not null,
  constraint sessions_pkey primary key (id),
  constraint sessions_token_key unique (token),
  constraint sessions_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade
) TABLESPACE pg_default;

-- 5. Bookings table (simulated ticket purchase history)
create table if not exists public.bookings (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  show_id uuid not null,
  seats jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) not null default 0.00,
  status character varying(30) not null default 'CONFIRMED',
  constraint bookings_pkey primary key (id),
  constraint bookings_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint bookings_show_id_fkey foreign key (show_id) references public.shows (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists idx_shows_movie_id on public.shows (movie_id);
create index if not exists idx_reviews_movie_id on public.reviews (movie_id);
create index if not exists idx_sessions_user_id on public.sessions (user_id);
create index if not exists idx_bookings_user_id on public.bookings (user_id);
