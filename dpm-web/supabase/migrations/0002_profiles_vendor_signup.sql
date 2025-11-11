-- Profiles table and vendor signup token workflow

create extension if not exists pgcrypto;

-- PROFILES: keyed by auth user id
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  role text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_write_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using ( id = auth.uid() );
create policy profiles_write_self on public.profiles
  for all using ( id = auth.uid() ) with check ( id = auth.uid() );

-- VENDOR SIGNUP TOKENS
create table if not exists public.vendor_tokens (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz
);
create index if not exists idx_vendor_tokens_token on public.vendor_tokens(token);

alter table public.vendor_tokens enable row level security;

-- Allow only event owners to view/create tokens via policies; RPCs will enforce logic too
drop policy if exists vendor_tokens_select_owner on public.vendor_tokens;
drop policy if exists vendor_tokens_write_owner on public.vendor_tokens;
create policy vendor_tokens_select_owner on public.vendor_tokens
  for select using (
    exists (
      select 1 from public.vendors v
      join public.events e on e.id = v.event_id
      where v.id = vendor_id and e.user_id = auth.uid()
    )
  );
create policy vendor_tokens_write_owner on public.vendor_tokens
  for all using (
    exists (
      select 1 from public.vendors v
      join public.events e on e.id = v.event_id
      where v.id = vendor_id and e.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.vendors v
      join public.events e on e.id = v.event_id
      where v.id = vendor_id and e.user_id = auth.uid()
    )
  );

-- RPC: create_vendor_signup_token(vendor_id)
create or replace function public.create_vendor_signup_token(vendor_id_arg uuid)
returns text
language plpgsql
security definer
as $$
declare
  _token text;
  _owner uuid;
begin
  -- Ensure caller owns the event for this vendor
  select e.user_id into _owner
  from public.vendors v
  join public.events e on e.id = v.event_id
  where v.id = vendor_id_arg;

  if _owner is null or _owner <> auth.uid() then
    raise exception 'Not authorized to create token for this vendor';
  end if;

  _token := gen_random_uuid()::text;
  insert into public.vendor_tokens(vendor_id, token)
  values (vendor_id_arg, _token);
  return _token;
end;
$$;

-- RPC: verify_vendor_token(token)
create or replace function public.verify_vendor_token(token_arg text)
returns table(vendor_id uuid, vendor_name text, vendor_email text)
language sql
security definer
as $$
  select v.id as vendor_id,
         v.name as vendor_name,
         null::text as vendor_email
  from public.vendor_tokens t
  join public.vendors v on v.id = t.vendor_id
  where t.token = token_arg
    and t.used_at is null
    and t.expires_at > now();
$$;

-- RPC: complete_vendor_signup(token, user_id)
create or replace function public.complete_vendor_signup(token_arg text, user_id_arg uuid)
returns void
language plpgsql
security definer
as $$
declare
  _vendor_id uuid;
begin
  -- Validate token
  select t.vendor_id into _vendor_id
  from public.vendor_tokens t
  where t.token = token_arg
    and t.used_at is null
    and t.expires_at > now();

  if _vendor_id is null then
    raise exception 'Invalid or expired token';
  end if;

  -- Link vendor to user
  update public.vendors set user_id = user_id_arg where id = _vendor_id;

  -- Upsert profile with sponsor role
  insert into public.profiles(id, email, role)
  values (user_id_arg, null, 'sponsor')
  on conflict (id) do update set role = 'sponsor';

  -- Mark token used
  update public.vendor_tokens set used_at = now() where token = token_arg;
end;
$$;