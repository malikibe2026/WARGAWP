# Direktori Warga DOSM WP Kuala Lumpur

Laman web direktori warga Jabatan Perangkaan Malaysia, Wilayah Persekutuan Kuala Lumpur.
Semua maklumat (termasuk gambar) boleh dikemas kini oleh pentadbir.

## Ciri
- Paparan kad dan jadual; carian (nama, jawatan, unit, telefon, e-mel); tapis ikut unit; susun ikut nama/unit/gred.
- Tambah, kemas kini dan padam warga; muat naik / tukar / buang gambar (dikecilkan automatik ke 400px).
- **Umur**: masukkan No. KP bila ada → sistem kira tarikh lahir, dan umur dikira automatik setiap kali dipapar.
  No. KP **tidak disimpan** — hanya tarikh lahir.
- Import CSV (templat: `contoh/templat-import.csv`, boleh ada lajur `No KP`), eksport CSV, cetak.

## Dua mod

| Mod | Tetapan | Siapa nampak data |
|---|---|---|
| Tempatan (lalai) | `config.js` kosong | Pelayar komputer itu sahaja. Untuk cubaan. PIN pentadbir dalam `config.js`. |
| Dalam talian | Isi `SUPABASE_URL` & `SUPABASE_ANON_KEY` | Semua yang buka laman. Pentadbir log masuk dengan e-mel & kata laluan. |

### Sediakan mod dalam talian (sekali sahaja)
1. Daftar projek percuma di https://supabase.com.
2. SQL Editor → tampal dan jalankan `supabase/schema.sql`.
3. Authentication → Users → tambah akaun untuk setiap pentadbir.
4. Project Settings → API → salin *Project URL* dan *anon public key* ke `config.js`.
5. Terbitkan folder ini (GitHub Pages / Netlify). Tiada langkah *build*.

## Jalankan secara tempatan
```
python3 -m http.server 8000
```
Buka http://localhost:8000.

## Nota privasi
- Polisi lalai dalam `schema.sql` membenarkan sesiapa yang ada pautan membaca direktori (termasuk no. telefon bimbit).
  Untuk hadkan kepada pengguna log masuk sahaja, guna pilihan (B) dalam fail tersebut.
- Gambar disimpan dalam *bucket* awam — sesiapa yang ada URL gambar boleh melihatnya.
