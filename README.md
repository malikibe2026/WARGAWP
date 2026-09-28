# Direktori Warga DOSM WP Kuala Lumpur

Laman web direktori warga Jabatan Perangkaan Malaysia, Wilayah Persekutuan Kuala Lumpur.
Semua maklumat (termasuk gambar) boleh dikemas kini oleh pentadbir.

## Ciri
- Paparan kad dan jadual; carian (nama, jawatan, unit, telefon, e-mel); tapis ikut unit; susun ikut carta organisasi/nama/unit/gred.
- Tambah, kemas kini dan padam warga; muat naik / tukar / buang gambar (dikecilkan automatik ke 400px).
- **Umur**: masukkan No. KP bila ada → sistem kira tarikh lahir, dan umur dikira automatik setiap kali dipapar.
  No. KP **tidak disimpan** — hanya tarikh lahir.
- Import CSV (templat: `contoh/templat-import.csv`, boleh ada lajur `No KP`), eksport CSV, cetak.

## Personel MySTEPS (PMS)
- Warga yang ada gambar dalam PDF ialah **Staf Tetap**. PMS disimpan dalam kategori berasingan (`warga.kategori = 'pms'`).
- Tambah seorang: **Tambah PMS** → wajib isi **Nama, Seksyen, E-mel** (gambar tidak wajib; avatar huruf awal dipaparkan).
- Tambah ramai: **Import CSV** guna `contoh/templat-pms.csv` (lajur `Kategori` = `PMS`). Tulis nama seksyen **sama ejaan** dengan staf tetap supaya dikumpul betul.
- Tapis `Semua | Staf Tetap | PMS`; carta menyusun staf tetap dahulu, kemudian PMS ikut seksyen.
- Kehadiran: PMS tanpa gambar rujukan boleh hadir dengan nama + lokasi walaupun program guna imbas muka.

## Data awal
183 warga diimport daripada `DIREKTORI DOSM WP 28092026.pdf` (28/09/2026) ke Supabase.
Gambar **tidak** disimpan dalam repo ini. Semua gambar disimpan dalam Supabase Storage.

### Muat naik gambar secara pukal
1. Log masuk sebagai pentadbir → klik **Import Gambar**.
2. Pilih semua fail gambar sekali gus (Ctrl+A dalam folder).
3. Nama fail dipadankan dengan nama warga, cth. `hartini-binti-yaacob.jpg`. Fail yang tidak sepadan diabaikan.
Sebelum gambar dimuat naik, kad memaparkan ikon lalai.
Lajur `susunan` mengekalkan susunan carta organisasi seperti dalam PDF.

## Pangkalan data (Supabase — mod dalam talian)
Sistem sudah disambungkan ke projek Supabase `direktori-warga-dosm-kl` (Singapura).
Skema penuh: `supabase/schema.sql` (sudah dijalankan).

- **Baca:** sesiapa yang ada pautan laman.
- **Tambah / ubah / padam / gambar:** hanya akaun yang e-melnya ada dalam jadual `pentadbir`
  dan telah disahkan.

### Cipta akaun pentadbir
1. Supabase → Authentication → Users → **Add user** → masukkan e-mel & kata laluan, tandakan *Auto Confirm User*.
2. Jika e-mel itu belum ada dalam senarai pentadbir, jalankan dalam SQL Editor:
   `insert into public.pentadbir (emel) values ('nama@contoh.com');`
3. Disyorkan: Authentication → Sign In / Providers → matikan **Allow new users to sign up**.

### Buang pentadbir
`delete from public.pentadbir where emel = 'nama@contoh.com';`

### Mod tempatan (cubaan tanpa internet)
Kosongkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dalam `config.js`. Data disimpan dalam pelayar sahaja; PIN dalam `config.js`.

## Jalankan secara tempatan
```
python3 -m http.server 8000
```
Buka http://localhost:8000.

## Nota privasi
- Sesiapa yang ada pautan boleh membaca direktori, termasuk no. telefon bimbit. Kongsi pautan secara dalaman sahaja.
- Projek Supabase pelan percuma akan *dijeda* selepas 7 hari tanpa aktiviti; pulihkan di papan pemuka Supabase jika laman tidak memaparkan data.
- Gambar disimpan dalam *bucket* awam — sesiapa yang ada URL gambar boleh melihatnya.

## Kehadiran program, e-mel pengesahan & sijil
- `program.html` (pentadbir): cipta program, kod QR, senarai hadir, tetapan e-mel & sijil.
- `hadir.html?p=KOD` (warga): cari nama → sahkan lokasi → hadir. E-mel (dan sijil) dihantar automatik jika diaktifkan.
- Fungsi pelayan: `supabase/functions/hantar-pengesahan` (salinan `sijil.ts` dijana daripada `sijil.js`).

### Tetapkan penghantar e-mel (sekali sahaja)
Supabase → Edge Functions → **Secrets**, tambah:
- `GMAIL_USER` = alamat Gmail penghantar
- `GMAIL_APP_PASSWORD` = App Password 16 aksara (Akaun Google → Keselamatan → Pengesahan 2 Langkah → App passwords)
- `PENGIRIM_NAMA` (pilihan) = nama yang dipaparkan, cth. `Urus Setia DOSM WP`
- `BALAS_KE` (pilihan) = alamat untuk balasan (Reply-To), cth. e-mel rasmi @dosm.gov.my

Alternatif: `BREVO_API_KEY` + `PENGIRIM_EMEL` (penghantar yang disahkan dalam Brevo).

### Kaedah pengesahan kehadiran (setiap program)
- **Carian nama** — seperti biasa.
- **Nama + imbas muka** (disyorkan) — swafoto dipadankan 1:1 dengan gambar warga yang dipilih.
- **Imbas muka sahaja** — sistem cadangkan ≤3 nama paling sepadan; warga pilih, kemudian disahkan 1:1.

Pentadbir perlu klik **Jana cap muka** (program.html) sekali, dan semula jika gambar warga ditukar.
Padanan dibuat di pelayan (`daftar_hadir`, `cari_muka`, jadual `warga_muka` yang hanya boleh dibaca pentadbir).
Swafoto tidak disimpan; hanya cap muka 128 nombor dihantar. Model: `vendor/face-api` (MIT).
