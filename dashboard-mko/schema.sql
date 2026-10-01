-- Skema Dashboard MKO (projek Supabase: dashboard-mko). Sudah dijalankan — rujukan sahaja.
create schema if not exists private;

create table public.pentadbir (emel text primary key, created_at timestamptz not null default now());
alter table public.pentadbir enable row level security;  -- urus melalui SQL Editor sahaja

create or replace function private.adalah_pentadbir() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u join public.pentadbir p on lower(p.emel) = lower(u.email)
                 where u.id = auth.uid());
$$;

create table public.muat_naik (
  id uuid primary key default gen_random_uuid(),
  nama_fail text, bil_rekod int not null default 0,
  status text not null default 'proses' check (status in ('proses','aktif','lama')),
  dimuat_naik_oleh text, created_at timestamptz not null default now()
);

create table public.rekod (
  id bigint generated always as identity primary key,
  muat_naik_id uuid not null references public.muat_naik(id) on delete cascade,
  bil int, no_siri text, no_id text, nama text, tahun_rujukan text,
  pegawai text, penyelia text, pegawai_kerja_luar text, siri_kekerapan text, negeri text,
  pejabat_operasi text, jenis_sampel text, daftar_kes text,
  daerah_pos_label text, daerah_pos_semasa text, daerah_lokasi_label text, daerah_lokasi_semasa text,
  kod_survei text, kod_survei2 text, kod_industri_label text, msic_5 text, msic_3 text,
  sektor text, subsektor text, pmks text, bbu_sbu text,
  status_respon_semasa text, status_respon_sebelum text, status_rekod text, cara_terima text,
  tarikh_terima date, kes_anggaran text, catatan_kes_anggaran text,
  pendapatan_sebelum numeric, pendapatan_semasa numeric, perbelanjaan_sebelum numeric, perbelanjaan_semasa numeric,
  harta_tetap_sebelum numeric, harta_tetap_semasa numeric, pekerja_sebelum numeric, pekerja_semasa numeric,
  gaji_sebelum numeric, gaji_semasa numeric, stok_akhir_sebelum numeric, stok_akhir_semasa numeric,
  nilai_jualan_sebelum numeric, nilai_jualan_semasa numeric,
  catatan_mko text, catatan_negeri text, ditambah_oleh text, dikemaskini_oleh text, tarikh_dikemaskini text
);
create index rekod_muat_naik_idx on public.rekod (muat_naik_id);

alter table public.muat_naik enable row level security;
alter table public.rekod enable row level security;
-- Baca: sesiapa yang ada pautan (data aktif sahaja). Tulis: pentadbir sahaja.
create policy "mn_baca_awam" on public.muat_naik for select to anon using (status = 'aktif');
create policy "mn_baca_log_masuk" on public.muat_naik for select to authenticated using (status = 'aktif' or private.adalah_pentadbir());
create policy "mn_tambah" on public.muat_naik for insert to authenticated with check (private.adalah_pentadbir());
create policy "rekod_baca" on public.rekod for select to anon, authenticated
  using (exists (select 1 from public.muat_naik m where m.id = muat_naik_id and m.status = 'aktif'));
create policy "rekod_tambah" on public.rekod for insert to authenticated with check (private.adalah_pentadbir());

-- Fungsi: aktifkan_muat_naik(p_id) — tukar data aktif & padam data lama (satu transaksi);
-- batal_muat_naik(p_id) — buang muat naik yang gagal; saya_pentadbir() — semak kebenaran.
-- Lihat definisi penuh dalam Supabase → Database → Functions.
