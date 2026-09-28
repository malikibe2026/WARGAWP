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
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists warga_updated_at on public.warga;
create trigger warga_updated_at before update on public.warga
  for each row execute function public.set_updated_at();

alter table public.warga enable row level security;

-- BACA: pilih SATU.
-- (A) Sesiapa yang ada pautan boleh lihat direktori (termasuk no. telefon bimbit).
create policy "warga_baca_umum" on public.warga for select to anon, authenticated using (true);
-- (B) Lebih selamat: hanya pengguna log masuk. Padam polisi (A) dan guna ini:
-- create policy "warga_baca_ahli" on public.warga for select to authenticated using (true);

-- TULIS: hanya pentadbir yang log masuk (akaun dicipta dalam Supabase > Authentication).
create policy "warga_tambah" on public.warga for insert to authenticated with check (true);
create policy "warga_kemas"  on public.warga for update to authenticated using (true) with check (true);
create policy "warga_padam"  on public.warga for delete to authenticated using (true);

-- Storan gambar.
insert into storage.buckets (id, name, public)
values ('gambar-warga', 'gambar-warga', true)
on conflict (id) do nothing;

create policy "gambar_muat_naik" on storage.objects for insert to authenticated
  with check (bucket_id = 'gambar-warga');
create policy "gambar_kemas" on storage.objects for update to authenticated
  using (bucket_id = 'gambar-warga');
create policy "gambar_padam" on storage.objects for delete to authenticated
  using (bucket_id = 'gambar-warga');
