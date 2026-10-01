# Dashboard Statistik Utama Pertubuhan

Dashboard gaya Power BI untuk export MKO. Muat naik fail Excel/CSV terbaru → semua data lama diganti dan
dashboard terus memaparkan data baharu (pelayar lain menyemak data baharu setiap 60 saat).

- **Pangkalan data:** projek Supabase `dashboard-mko` (Singapura) — berasingan daripada projek direktori.
- **Lihat:** sesiapa yang ada pautan (tanpa log masuk). Kongsi pautan secara dalaman sahaja — data mengandungi
  nama syarikat dan nilai kewangan.
- **Muat naik:** hanya e-mel dalam jadual `pentadbir` yang log masuk.

## Halaman
| Tab | Kandungan |
|---|---|
| **Ringkasan** | Cincin kadar respons vs sasaran, KPI (A1, LK, Kod B, Belum), komposisi & kod status, kumulatif Tarikh Terima dengan garis sasaran, kadar respons ikut sektor, cara terima, PMKS, peralihan status sebelum → semasa, **penemuan utama** automatik |
| **Peta Daerah** | Peta choropleth daerah pentadbiran (lokasi / pos) atau negeri; ukuran: kadar respons, jumlah, siap, belum, A1. Klik kawasan untuk tapis. Jadual kedudukan termasuk nilai yang tidak dapat dipadankan |
| **Prestasi Pegawai** | Bar bertindan ikut Pegawai Kerja Luar / Penyelia / Sektor dll. (peratus atau bilangan) + garis sasaran; kad skor dengan baki kes dan status Capai / Hampir / Bawah sasaran; eksport CSV |
| **Analisis Nilai** | Perbandingan 7 pemboleh ubah (jumlah & median perubahan), plot serakan log sebelum vs semasa, senarai **kes perlu semakan** (perubahan melebihi ambang ±%) |
| **Senarai Rekod** | Cari, susun, butiran rekod, eksport CSV |

Penapis utama: **Sektor, Subsektor, Pegawai Kerja Luar** (pilihan berbilang). Penapis lain dalam butang *Penapis lain*.
Klik pada mana-mana carta/peta untuk tapis silang. Tema terang/gelap. Sasaran % dan ambang disimpan dalam pelayar.

Kategori kod respon: **A1** = 11 · **LK (Lain-lain Keputusan)** = 12,13,14,21,22,23,31,40 · **50** · **Kod B** = 71–77 · lain-lain · belum.

## Peta
Sempadan rasmi OpenDOSM (`peta/`). Nama daerah dipadankan secara automatik (abaikan huruf besar, "W.P.", "Daerah", Hulu/Ulu,
kod 4 digit negeri+daerah). Nilai yang tidak dapat dipadankan dipaparkan dengan tanda ⚠ di bawah peta dan dalam jadual kedudukan.
Nota: sempadan DOSM menganggap **W.P. Kuala Lumpur sebagai satu daerah** — jika semua kes dalam KL, peta akan menunjukkan satu kawasan sahaja.

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
