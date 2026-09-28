-- Modul kehadiran program (sudah dijalankan pada projek direktori-warga-dosm-kl).
-- Jadual: program, kehadiran. Rekod oleh orang awam hanya melalui fungsi daftar_hadir,
-- yang menyemak: program wujud & dibuka, tarikh/masa, nama wujud, jarak GPS dalam radius,
-- belum hadir, dan satu telefon hanya untuk satu nama bagi setiap program.
-- Lihat definisi penuh dalam Supabase > Database > Functions: daftar_hadir, kiraan_hadir.

create table public.program (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  nama text not null, tarikh date not null, masa_mula time, masa_tamat time,
  lokasi_nama text, lat double precision, lng double precision,
  radius_m integer not null default 200 check (radius_m between 20 and 5000),
  aktif boolean not null default true, created_at timestamptz not null default now()
);
create table public.kehadiran (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.program(id) on delete cascade,
  warga_id uuid not null references public.warga(id) on delete cascade,
  masa timestamptz not null default now(),
  lat double precision, lng double precision, ketepatan_m real, jarak_m real,
  peranti_id text, kaedah text not null default 'gps' check (kaedah in ('gps', 'manual')),
  unique (program_id, warga_id)
);
-- RLS: program boleh dibaca umum, diurus pentadbir; kehadiran dibaca/ditambah/dipadam pentadbir sahaja.
