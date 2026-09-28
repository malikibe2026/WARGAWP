-- Skema pangkalan data Direktori Warga DOSM WP Kuala Lumpur (Supabase / PostgreSQL).
-- Jalankan sekali dalam Supabase > SQL Editor.

create table if not exists public.warga (
  id                uuid primary key default gen_random_uuid(),
  nama              text not null,
  jawatan           text,
  gred              text,
  unit              text,
  telefon_pejabat   text,
  telefon_bimbit    text,
  emel              text,
  tarikh_lahir      date,          -- dikira daripada No. KP; No. KP sendiri TIDAK disimpan
  tarikh_lapor_diri date,
  catatan           text,
  gambar_url        text,
  susunan           integer,          -- kedudukan dalam carta organisasi
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists warga_updated_at on public.warga;
create trigger warga_updated_at before update on public.warga
  for each row execute function public.set_updated_at();

alter table public.warga enable row level security;

-- BACA: sesiapa yang ada pautan boleh lihat direktori.
create policy "warga_baca_umum" on public.warga for select to anon, authenticated using (true);

-- PENTADBIR: hanya e-mel dalam jadual ini boleh tambah/ubah/padam.
-- (Pendaftaran akaun Supabase terbuka secara lalai, jadi "log masuk" sahaja tidak cukup.)
create table if not exists public.pentadbir (
  emel text primary key,
  created_at timestamptz not null default now()
);
alter table public.pentadbir enable row level security;  -- tiada polisi: urus melalui SQL Editor sahaja

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.adalah_pentadbir() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    join public.pentadbir p on lower(p.emel) = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke execute on function private.adalah_pentadbir() from public, anon;
grant execute on function private.adalah_pentadbir() to authenticated;

create policy "warga_tambah" on public.warga for insert to authenticated with check (private.adalah_pentadbir());
create policy "warga_kemas"  on public.warga for update to authenticated
  using (private.adalah_pentadbir()) with check (private.adalah_pentadbir());
create policy "warga_padam"  on public.warga for delete to authenticated using (private.adalah_pentadbir());

-- Storan gambar (awam untuk dibaca melalui URL; maks 2MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gambar-warga', 'gambar-warga', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "gambar_muat_naik" on storage.objects for insert to authenticated
  with check (bucket_id = 'gambar-warga' and private.adalah_pentadbir());
create policy "gambar_kemas" on storage.objects for update to authenticated
  using (bucket_id = 'gambar-warga' and private.adalah_pentadbir());
create policy "gambar_padam" on storage.objects for delete to authenticated
  using (bucket_id = 'gambar-warga' and private.adalah_pentadbir());

-- Tambah pentadbir (ulang untuk setiap orang):
-- insert into public.pentadbir (emel) values ('nama@contoh.com');
