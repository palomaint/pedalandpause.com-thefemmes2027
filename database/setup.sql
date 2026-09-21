-- Run once in your own Supabase project's SQL editor. No public access policies.
create table if not exists public.booking_requests (
 request_id uuid primary key,
 submitted_at timestamptz not null default now(),
 name text not null check (char_length(name) between 2 and 120),
 email text not null check (char_length(email)<=254),
 phone text not null default '',
 edition text not null check (edition in ('may','october')),
 room text not null check (room in ('shared','ensuite','private')),
 bike_rental boolean not null default false,
 notes text not null default '' check (char_length(notes)<=1500),
 indicative_price numeric(10,2),
 agreed_price numeric(10,2),
 payment_reference text,
 status text not null default 'pending_review' check (status in ('pending_review','awaiting_payment','confirmed','cancelled')),
 contact_consent boolean not null check (contact_consent),
 privacy_version text not null
);
alter table public.booking_requests enable row level security;
revoke all on public.booking_requests from anon, authenticated;
grant select,insert,update,delete on public.booking_requests to service_role;
-- Manage records only through an authorised dashboard/server. Never expose service_role in client code.
