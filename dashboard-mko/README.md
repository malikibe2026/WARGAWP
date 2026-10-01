# Dashboard Statistik Utama Pertubuhan

Dashboard gaya Power BI untuk export MKO. Muat naik fail Excel/CSV terbaru → semua data lama diganti dan
dashboard terus memaparkan data baharu (pelayar lain menyemak data baharu setiap 60 saat).

- **Pangkalan data:** projek Supabase `dashboard-mko` (Singapura) — berasingan daripada projek direktori.
- **Lihat:** sesiapa yang ada pautan (tanpa log masuk). Kongsi pautan secara dalaman sahaja — data mengandungi
  nama syarikat dan nilai kewangan.
- **Muat naik:** hanya e-mel dalam jadual `pentadbir` yang log masuk.

## Status pencapaian pertubuhan
Ukuran utama dashboard ialah **% Selesai** berdasarkan lajur **Status Rekod**:

| Tahap | Status Rekod dalam fail |
|---|---|
| Selesai | Selesai |
| Semakan SMD | Semakan SMD |
| Semakan DOSM Negeri | Semakan DOSM Negeri, Semakan Khas, Semakan Khas - DOSM Negeri |
| Pinda Semula | Pinda Semula - … (dikembalikan untuk pembetulan) |
| Dalam Proses | Dalam Proses (peringkat FE) |

Jika fail tiada Status Rekod, dashboard kembali menggunakan kadar respons (ada kod respon).

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

## Gabung beberapa fail (kunci: No. Siri)
- Dalam dialog muat naik, pilih **beberapa fail sekali gus** — header boleh berlainan (cth. fail status + fail nilai kewangan).
- Rekod dipadankan ikut **No. Siri**, yang mesti **tepat 12 digit**:
  - kurang 12 digit (Excel buang sifar di depan) → dilapik sifar, cth. `35070000021` → `035070000021` (dilaporkan sebelum simpan);
  - lebih 12 digit, ada huruf, atau kosong → baris **ditolak** dan disenaraikan (nombor baris Excel);
  - sengkang/ruang dibuang (`0350-7000-0026` → `035070000026`).
  Pangkalan data turut menolak No. Siri yang bukan 12 digit atau berulang dalam satu muat naik.
- Sel kosong **tidak** memadam nilai sedia ada. Jika dua fail ada nilai berbeza untuk lajur sama, nilai daripada fail **terkemudian dalam senarai** digunakan; bilangan dan contoh percanggahan dipaparkan sebelum simpan.
- Tandakan **Gabung dengan data sedia ada** untuk kemas kini data semasa (cth. fail kecil `No. Siri` + `Status Respon Lawatan Semasa`) tanpa ganti semua.
- Rekod yang hanya ada dalam satu fail tetap dimasukkan (kesatuan). Semak lajur *Baharu* — rekod baharu daripada fail sekunder akan menambah jumlah kes.

## Peta
Sempadan rasmi OpenDOSM (`peta/`): daerah, negeri dan **parlimen**. Daerah diambil daripada lajur *Semasa*; jika kosong, lajur *Label* digunakan.
**W.P. Kuala Lumpur dipecah ikut 11 parlimen** apabila fail ada lajur `Parlimen` (cth. `P.117 Segambut`, `P117` atau `Segambut`).
Tab Peta juga ada aras *Parlimen* untuk semua negeri. Nama daerah dipadankan secara automatik (abaikan huruf besar, "W.P.", "Daerah", Hulu/Ulu,
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
