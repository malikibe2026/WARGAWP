# Direktori Warga DOSM WP Kuala Lumpur

Laman web direktori warga Jabatan Perangkaan Malaysia, Wilayah Persekutuan Kuala Lumpur.
Semua maklumat (termasuk gambar) boleh dikemas kini oleh pentadbir.

## Ciri
- Paparan kad dan jadual; carian (nama, jawatan, unit, telefon, e-mel); tapis ikut unit; susun ikut nama/unit/gred.
- Tambah, kemas kini dan padam warga; muat naik / tukar / buang gambar (dikecilkan automatik ke 400px).
- **Umur**: masukkan No. KP bila ada → sistem kira tarikh lahir, dan umur dikira automatik setiap kali dipapar.
  No. KP **tidak disimpan** — hanya tarikh lahir.
- Import CSV (templat: `contoh/templat-import.csv`, boleh ada lajur `No KP`), eksport CSV, cetak.

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
