# Dashboard MKO

Dashboard gaya Power BI untuk export MKO. Muat naik fail Excel/CSV terbaru → semua data lama diganti dan
dashboard terus memaparkan data baharu (pelayar lain menyemak data baharu setiap 60 saat).

- **Pangkalan data:** projek Supabase `dashboard-mko` (Singapura) — berasingan daripada projek direktori.
- **Lihat:** sesiapa yang ada pautan (tanpa log masuk). Kongsi pautan secara dalaman sahaja — data mengandungi
  nama syarikat dan nilai kewangan.
- **Muat naik:** hanya e-mel dalam jadual `pentadbir` yang log masuk.

## Ciri
- KPI: jumlah kes, siap (ada kod respon), A1, LK, Kod B, borang diterima.
- Carta kemajuan ikut Pegawai Kerja Luar / Penyelia / Sektor / Daerah dsb., mod **Peratus** dengan garis **Sasaran %**
  (✓ = capai sasaran; tooltip papar baki kes).
- Status respon semasa, kumulatif Tarikh Terima, Cara Terima, Status Rekod, Kod Industri, matriks status sebelum → semasa.
- Perbandingan nilai penyiasatan (sebelum vs semasa).
- Penapis (slicer) di kiri + klik bar untuk tapis silang. Jadual rekod: cari, susun, klik untuk butiran, eksport CSV.

Kategori kod respon: **A1** = 11 · **LK** = 12,13,14,21,22,23,31,40 · **50** · **Kod B** = 71–77 · lain-lain · belum.

## Format fail
Baris header dikesan automatik (boleh ada baris tajuk di atas). Kedua-dua format header MKO disokong
(format lama dengan `NO ID`, dan format baharu dengan `Pegawai Kerja Luar`, `Sektor`, `PMKS` dll.).
Lajur yang tiada dibiarkan kosong. Tarikh dibaca sebagai `dd/mm/yyyy` atau tarikh Excel.

## Sediakan akaun pentadbir (sekali sahaja)
1. Supabase → projek **dashboard-mko** → Authentication → Users → **Add user** → e-mel `malikibe2026@gmail.com`
   + kata laluan, tandakan *Auto Confirm User*.
2. Tambah pentadbir lain (SQL Editor): `insert into public.pentadbir (emel) values ('nama@contoh.com');`
3. Disyorkan: Authentication → Sign In / Providers → matikan **Allow new users to sign up**.

## Deploy ke Netlify (akaun lain)
Cara paling mudah: Netlify → **Add new site → Deploy manually** → seret folder `dashboard-mko` ini.
Atau sambung repo GitHub dengan **Base directory** = `dashboard-mko`, build command kosong, publish `.`.

## Nota
- Projek Supabase pelan percuma *dijeda* selepas 7 hari tanpa aktiviti — pulihkan di papan pemuka Supabase.
- Muat naik dibuat berperingkat (500 baris setiap kali). Jika gagal di tengah jalan, data lama kekal.
