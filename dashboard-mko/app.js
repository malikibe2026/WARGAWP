// Dashboard Statistik Utama Pertubuhan — data aktif dari Supabase, tapis silang ala Power BI, peta daerah, muat naik fail ganti data.
(function () {
  "use strict";
  const cfg = window.MKO_CONFIG || {};
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);

  // ---------- Lajur ----------
  // [kunci DB, label paparan, jenis: t=teks, n=nombor, d=tarikh, i=integer]
  const LAJUR = [
    ["bil", "Bil.", "i"],
    ["no_siri", "No. Siri", "t"],
    ["no_id", "NO ID", "t"],
    ["nama", "Nama Pendaftaran", "t"],
    ["tahun_rujukan", "Tahun Rujukan", "t"],
    ["pegawai", "Pegawai", "t"],
    ["penyelia", "Penyelia", "t"],
    ["pegawai_kerja_luar", "Pegawai Kerja Luar", "t"],
    ["siri_kekerapan", "Siri Kekerapan", "t"],
    ["negeri", "Negeri", "t"],
    ["pejabat_operasi", "Pejabat Perangkaan / Operasi", "t"],
    ["jenis_sampel", "Jenis Sampel", "t"],
    ["daftar_kes", "Daftar Kes", "t"],
    ["daerah_pos_label", "Daerah Pentadbiran Pos - Label", "t"],
    ["daerah_pos_semasa", "Daerah Pentadbiran Pos - Semasa", "t"],
    ["daerah_lokasi_label", "Daerah Pentadbiran Lokasi - Label", "t"],
    ["daerah_lokasi_semasa", "Daerah Pentadbiran Lokasi - Semasa", "t"],
    ["parlimen", "Parlimen", "t"],
    ["fasa_be", "Fasa BE", "t"],
    ["tier", "Tier", "t"],
    ["kod_survei", "Kod Survei - Semasa", "t"],
    ["kod_kp", "Kod KP", "t"],
    ["kod_survei2", "Kod Survei - Label / Survei2", "t"],
    ["kod_industri_label", "Kod Industri - Label", "t"],
    ["msic_5", "Kod Industri - Semasa", "t"],
    ["msic_3", "Kod Industri (3 digit)", "t"],
    ["sektor", "Sektor", "t"],
    ["subsektor", "Subsektor", "t"],
    ["pmks", "PMKS", "t"],
    ["bbu_sbu", "BBU / SBU", "t"],
    ["status_respon_semasa", "Status Respon Lawatan Semasa", "t"],
    ["status_respon_sebelum", "Status Respon Lawatan Sebelum", "t"],
    ["status_rekod", "Status Rekod", "t"],
    ["cara_terima", "Cara Terima", "t"],
    ["tarikh_terima", "Tarikh Terima", "d"],
    ["kes_anggaran", "Kes Anggaran", "t"],
    ["catatan_kes_anggaran", "Catatan Kes Anggaran", "t"],
    ["pendapatan_sebelum", "Pendapatan (RM) - Sebelum", "n"],
    ["pendapatan_semasa", "Pendapatan (RM) - Semasa", "n"],
    ["perbelanjaan_sebelum", "Perbelanjaan (RM) - Sebelum", "n"],
    ["perbelanjaan_semasa", "Perbelanjaan (RM) - Semasa", "n"],
    ["harta_tetap_sebelum", "Harta Tetap (RM) - Sebelum", "n"],
    ["harta_tetap_semasa", "Harta Tetap (RM) - Semasa", "n"],
    ["pekerja_sebelum", "Bilangan Pekerja - Sebelum", "n"],
    ["pekerja_semasa", "Bilangan Pekerja - Semasa", "n"],
    ["gaji_sebelum", "Gaji / Upah (RM) - Sebelum", "n"],
    ["gaji_semasa", "Gaji / Upah (RM) - Semasa", "n"],
    ["stok_akhir_sebelum", "Stok Akhir (RM) - Sebelum", "n"],
    ["stok_akhir_semasa", "Stok Akhir (RM) - Semasa", "n"],
    ["nilai_jualan_sebelum", "Nilai Jualan (RM) - Sebelum", "n"],
    ["nilai_jualan_semasa", "Nilai Jualan (RM) - Semasa", "n"],
    ["catatan_mko", "Catatan MKO", "t"],
    ["pendapatan_2015", "Pendapatan / Output 2015 (RM)", "n"], ["perbelanjaan_2015", "Perbelanjaan / Input 2015 (RM)", "n"], ["va_2015", "Nilai Ditambah (VA) 2015 (RM)", "n"],
    ["pendapatan_2023", "Pendapatan / Output 2023 (RM)", "n"], ["perbelanjaan_2023", "Perbelanjaan / Input 2023 (RM)", "n"], ["va_2023", "Nilai Ditambah (VA) 2023 (RM)", "n"],
    ["pendapatan_2026", "Pendapatan / Output 2026 (RM)", "n"], ["perbelanjaan_2026", "Perbelanjaan / Input 2026 (RM)", "n"], ["va_2026", "Nilai Ditambah (VA) 2026 (RM)", "n"],
    ["gaji_2015", "Gaji / Upah 2015 (RM)", "n"], ["gaji_2023", "Gaji / Upah 2023 (RM)", "n"], ["gaji_2026", "Gaji / Upah 2026 (RM)", "n"],
    ["pekerja_2015", "Bilangan Pekerja 2015", "n"], ["pekerja_2023", "Bilangan Pekerja 2023", "n"], ["pekerja_2026", "Bilangan Pekerja 2026", "n"],
    ["harta_tetap_2015", "Harta Tetap 2015 (RM)", "n"], ["harta_tetap_2023", "Harta Tetap 2023 (RM)", "n"], ["harta_tetap_2026", "Harta Tetap 2026 (RM)", "n"],
    ["catatan_negeri", "Catatan Negeri", "t"],
    ["catatan_pinda_smd", "Catatan Pinda SMD", "t"],
    ["ditambah_oleh", "Ditambah oleh", "t"],
    ["dikemaskini_oleh", "Dikemaskini oleh", "t"],
    ["tarikh_dikemaskini", "Tarikh Dikemaskini", "t"],
  ];
  const JENIS = Object.fromEntries(LAJUR.map(([k, , j]) => [k, j]));
  const LABEL = Object.fromEntries(LAJUR.map(([k, l]) => [k, l]));
  LABEL.tambahan = "Lajur tambahan (cth. Borang)";

  const UKURAN = [
    ["pendapatan", "Pendapatan (RM)", true],
    ["perbelanjaan", "Perbelanjaan (RM)", true],
    ["harta_tetap", "Harta Tetap (RM)", true],
    ["pekerja", "Bilangan Pekerja", false],
    ["gaji", "Gaji / Upah (RM)", true],
    ["stok_akhir", "Stok Akhir (RM)", true],
    ["nilai_jualan", "Nilai Jualan (RM)", true],
  ];

  // Header fail -> kunci DB (header dinormalkan: huruf kecil, tanpa simbol/ruang)
  const norm = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
  const HEADER_TETAP = {
    bil: "bil", nosiri: "no_siri", noid: "no_id",
    namapendaftaran: "nama", tahunrujukan: "tahun_rujukan", sirikekerapan: "siri_kekerapan",
    pegawai: "pegawai", penyelia: "penyelia", pegawaikerjaluar: "pegawai_kerja_luar", fe: "pegawai_kerja_luar",
    negeri: "negeri", pejabatoperasi: "pejabat_operasi", pejabatperangkaan: "pejabat_operasi",
    jenissampel: "jenis_sampel", daftarkes: "daftar_kes",
    kodsurveisemasa: "kod_survei", kodsurveilabel: "kod_survei2",
    kodindustrisemasa: "msic_5", kodindustrilabel: "kod_industri_label",
    sektor: "sektor", subsektor: "subsektor", pmks: "pmks",
    catatannegeri: "catatan_negeri", kodkp: "kod_kp", kp: "kod_kp", kodperangkaan: "kod_kp", catatanpindasmd: "catatan_pinda_smd", ditambaholeh: "ditambah_oleh", dikemaskinioleh: "dikemaskini_oleh",
    tarikhdikemaskini: "tarikh_dikemaskini",
    daerahpentadbiranposlabel: "daerah_pos_label", daerahpentadbiranpossemasa: "daerah_pos_semasa",
    daerahpentadbiranlokasilabel: "daerah_lokasi_label", daerahpentadbiranlokasisemasa: "daerah_lokasi_semasa",
    kodbancisurvei: "kod_survei", kodbancisurvei2: "kod_survei2", bbusbu: "bbu_sbu",
    statusresponlawatansemasa: "status_respon_semasa", statusresponlawatansebelum: "status_respon_sebelum",
    statusrekod: "status_rekod", caraterima: "cara_terima", tarikhterima: "tarikh_terima",
    kesanggaran: "kes_anggaran", catatankesanggaran: "catatan_kes_anggaran", catatanmko: "catatan_mko",
  };
  const AWALAN_UKURAN = [
    ["pendapatan", "pendapatan"], ["perbelanjaan", "perbelanjaan"], ["hartatetap", "harta_tetap"],
    ["bilanganpekerja", "pekerja"], ["gajiupah", "gaji"], ["stokakhir", "stok_akhir"], ["nilaijualan", "nilai_jualan"],
  ];
  // Nama lajur alternatif (cth. fail rangka / kawalan yang bukan export MKO)
  const ALIAS = {
    siri: "no_siri", nosr: "no_siri", nombosiri: "no_siri", nombersiri: "no_siri", nomborsiri: "no_siri",
    nama: "nama", namapertubuhan: "nama", namasyarikat: "nama", namaperniagaan: "nama", namaentiti: "nama", namaestablishment: "nama",
    namafe: "pegawai_kerja_luar", enumerator: "pegawai_kerja_luar", pkl: "pegawai_kerja_luar", namapkl: "pegawai_kerja_luar",
    sv: "penyelia", namapenyelia: "penyelia",
    daerah: "daerah_lokasi_semasa", daerahpentadbiran: "daerah_lokasi_semasa",
    statusrespon: "status_respon_semasa", kodrespon: "status_respon_semasa", respon: "status_respon_semasa", status: "status_respon_semasa",
    msic: "msic_5", kodmsic: "msic_5", msic2008: "msic_5", kodindustri: "msic_5", msic5digit: "msic_5", msic3digit: "msic_3",
    saiz: "pmks", saizpertubuhan: "pmks", kategoripmks: "pmks",
    parlimen: "parlimen", kawasanparlimen: "parlimen", kodparlimen: "parlimen", parlimensemasa: "parlimen", parlimenlabel: "parlimen",
  };
  function petaAlias(n) {
    if (ALIAS[n]) return ALIAS[n];
    // No. Siri / No Siri / Nombor Siri / ID Establishment / No ID Establishment → kunci rekod
    if (/^(no|nombor|nomor)?siri/.test(n) || /^(no)?(id)?(establishment|estab|estb)/.test(n) || /^noid(establishment|estab)?$/.test(n)) return "no_siri";
    if (n.startsWith("idestablishment") || n.startsWith("noidestablishment")) return "no_siri";
    if (n.includes("pegawaikerjaluar")) return "pegawai_kerja_luar";
    if (n.includes("penyelia")) return "penyelia";
    if (n.includes("statusrespon") || n.includes("koderespon")) return n.includes("sebelum") ? "status_respon_sebelum" : "status_respon_semasa";
    if (n.includes("tarikhterima")) return "tarikh_terima";
    if (n.startsWith("namapertubuhan") || n.startsWith("namasyarikat")) return "nama";
    if (n.startsWith("subsektor")) return "subsektor";
    if (n.startsWith("sektor")) return "sektor";
    if (n.startsWith("daerah")) return n.includes("pos") ? "daerah_pos_semasa" : "daerah_lokasi_semasa";
    return null;
  }
  function petaHeader(h) {
    const n = norm(h);
    if (!n) return null;
    if (HEADER_TETAP[n]) return HEADER_TETAP[n];
    // Nama FE dalam apa-apa bentuk: "FE", "NAMA FE", "Pegawai FE", "Nama Enumerator", "PKL", "Pegawai Kerja Luar"
    if (/(^|[^a-z])fe([^a-z]|$)/i.test(String(h)) && !/(fasa|kod|respon|status)/i.test(String(h)) || /^(namapegawai|namaenumerator|enumerator|pkl)/.test(n)) return "pegawai_kerja_luar";
    const alias = petaAlias(n);
    if (alias) return alias;
    if (n.startsWith("fasa")) return "fasa_be";
    if (n.startsWith("tier")) return "tier";
    if (n.includes("catatan") && n.includes("pinda")) return "catatan_pinda_smd";
    // Nilai ikut tahun, cth. "Pendapatan 2015", "Output (RM) 2023", "VA 2026", "Nilai Ditambah 2015"
    const th = n.match(/(2015|2023|2026)/);
    if (th) {
      const y = th[1];
      if (/^va|nilaiditambah|valueadded/.test(n) || n.includes("nilaiditambah")) return "va_" + y;
      if (/^(pendapatan|output|jumlahoutput|hasil|jumlahpendapatan)/.test(n)) return "pendapatan_" + y;
      if (/^(perbelanjaan|input|jumlahinput|jumlahperbelanjaan|kos)/.test(n)) return "perbelanjaan_" + y;
      if (/^(gaji|upah)/.test(n)) return "gaji_" + y;
      if (/^(bilanganpekerja|pekerja|jumlahpekerja)/.test(n)) return "pekerja_" + y;
      if (/^(harta|hartatetap|jumlahharta)/.test(n)) return "harta_tetap_" + y;
    }
    if (n.startsWith("kodindustrimsic2008")) return n.slice(19).startsWith("3") ? "msic_3" : "msic_5";
    if (n.startsWith("kodindustrimsic")) return /3(digit)?$/.test(n) ? "msic_3" : "msic_5";
    for (const [awal, kunci] of AWALAN_UKURAN) {
      if (n.startsWith(awal)) {
        if (n.endsWith("sebelum")) return kunci + "_sebelum";
        if (n.endsWith("semasa")) return kunci + "_semasa";
      }
    }
    return null;
  }

  // ---------- Kategori status respon (kod MKO) ----------
  const KATEGORI = [
    { k: "A1", label: "Kod 11 · Lengkap", pendek: "11", warna: "--s1" },
    { k: "LK", label: "LK · Lain-lain Keputusan (12–60)", pendek: "LK", warna: "--s3" },
    { k: "KodB", label: "Kod B (71–77)", pendek: "Kod B", warna: "--s4" },
    { k: "Lain", label: "Kod lain", pendek: "Lain", warna: "--s5" },
    { k: "Belum", label: "Belum ada respon", pendek: "Belum", warna: "--s0" },
  ];
  const KAT_LABEL = Object.fromEntries(KATEGORI.map((c) => [c.k, c.label]));
  // Kod A = Kod 11 + LK (12–60). Kod 14 dikira dalam LK dan dipaparkan berasingan. Kod B = 71–77
  function kodNombor(status) {
    const m = String(status == null ? "" : status).trim().match(/^(\d{1,3})/);
    return m ? +m[1] : null;
  }
  function kategori(status) {
    const m = String(status == null ? "" : status).trim().match(/^(\d{1,3})/);
    if (!m) return String(status == null ? "" : status).trim() ? "Lain" : "Belum";
    const k = +m[1];
    if (k === 11) return "A1";
    if (k >= 12 && k <= 60) return "LK";
    if (k >= 71 && k <= 77) return "KodB";
    return "Lain";
  }

  // ---------- Tahap pencapaian (daripada Status Rekod) ----------
  // Aliran: Dalam Proses (FE) → Semakan DOSM Negeri → Semakan SMD → Selesai; Pinda Semula = dikembalikan untuk pembetulan
  const TAHAP = [
    { k: "Selesai", label: "Selesai", pendek: "Selesai", warna: "--s3" },
    { k: "SMD", label: "Semakan SMD", pendek: "SMD", warna: "--s1" },
    { k: "Negeri", label: "Semakan DOSM Negeri", pendek: "Negeri", warna: "--s7" },
    { k: "Pinda", label: "Pinda Semula", pendek: "Pinda", warna: "--s5" },
    { k: "Proses", label: "Dalam Proses", pendek: "Proses", warna: "--s4" },
    { k: "Tiada", label: "Tiada status rekod", pendek: "Tiada", warna: "--s0" },
  ];
  const TAHAP_LABEL = Object.fromEntries(TAHAP.map((t) => [t.k, t.label]));
  function tahap(statusRekod) {
    const s = String(statusRekod == null ? "" : statusRekod).trim().toLowerCase();
    if (!s) return "Tiada";
    if (s.startsWith("selesai")) return "Selesai";
    if (s.startsWith("pinda")) return "Pinda";
    if (s.includes("smd")) return "SMD";
    if (s.includes("semakan")) return "Negeri";      // Semakan DOSM Negeri / Semakan Khas
    return "Proses";
  }
  // Medan terbitan: daerah berkesan (Semasa, jika kosong guna Label)
  // Empat sektor utama ikut kod KP (cth. "KP 205" atau "205")
  const SEKTOR_UTAMA = [
    { k: "Pembuatan", kod: ["205"], c1: "#3987e5", c2: "#6366f1", ikon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20V10l6 4V10l6 4V6h3v14z"/></svg>' },
    { k: "Pembinaan", kod: ["206"], c1: "#f59e0b", c2: "#ef4444", ikon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 21V3h9v18zm9-12h5v12h-5zM7 6h2v2H7zm0 4h2v2H7zm0 4h2v2H7z"/></svg>' },
    { k: "Pertanian", kod: ["101", "103", "104", "105"], c1: "#22c55e", c2: "#14b8a6", ikon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16zM4 20l9-9"/></svg>' },
    { k: "Perlombongan & Pengkuarian", kod: ["200", "207"], c1: "#8b5cf6", c2: "#ec4899", ikon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 20L9 7l4 6 2-3 7 10z"/></svg>' },
  ];
  function sektorUtama(v) {
    const m = String(v == null ? "" : v).match(/\d{3}/);
    if (!m) return KOSONG;
    const s = SEKTOR_UTAMA.find((x) => x.kod.includes(m[0]));
    return s ? s.k : "Sektor lain";
  }

  function terbit(r) {
    r._kat = kategori(r.status_respon_semasa);
    r._tahap = tahap(r.status_rekod);
    r._dl = r.daerah_lokasi_semasa || r.daerah_lokasi_label || null;
    r._dp = r.daerah_pos_semasa || r.daerah_pos_label || null;
    r._sektor4 = sektorUtama(r.kod_kp);
    return r;
  }
  const ADA_TAHAP = () => S.rekod.some((r) => r._tahap !== "Tiada");

  // ---------- Keadaan ----------
  const S = {
    rekod: [], muatNaik: null, pentadbir: false, sesi: null,
    tapis: {},             // dim -> Set(nilai)
    hal: "ringkasan", hanyaPinda: false,
    dimensi: null, peratus: true, sasaran: 0, ambang: 50, tigaLaras: {}, ukuranSerak: "pendapatan",
    petaAras: "parlimen", petaUkuran: "selesai", ukurPrestasi: "tahap",
    cari: "", halaman: 0, susunK: null, susunArah: 1,
    carta: {},
  };
  const KOSONG = "(Tiada)";
  // Penapis utama (sentiasa kelihatan) dan penapis lain (dalam laci)
  const PENAPIS_UTAMA = [
    ["fasa_be", "Fasa BE"],
    ["tier", "Tier"],
    ["sektor", "Sektor"],
    ["subsektor", "Subsektor"],
    ["pegawai_kerja_luar", "Pegawai Kerja Luar"],
  ];
  const PENAPIS_LAIN = [
    ["_tahap", "Tahap Pencapaian"],
    ["_kat", "Kategori Respon"],
    ["_sektor4", "Sektor utama (KP)"],
    ["pejabat_operasi", "Pejabat Perangkaan / Operasi"],
    ["penyelia", "Penyelia"],
    ["pegawai", "Pegawai"],
    ["parlimen", "Parlimen"],
    ["pmks", "PMKS"],
    ["msic_3", "Kod Industri 3 digit"],
    ["kod_survei", "Kod Survei"],
    ["jenis_sampel", "Jenis Sampel"],
    ["daftar_kes", "Daftar Kes"],
    ["bbu_sbu", "BBU / SBU"],
    ["status_respon_semasa", "Status Respon Semasa"],
    ["status_respon_sebelum", "Status Respon Sebelum"],
    ["status_rekod", "Status Rekod"],
    ["cara_terima", "Cara Terima"],
    ["kes_anggaran", "Kes Anggaran"],
    ["negeri", "Negeri"],
    ["siri_kekerapan", "Siri Kekerapan"],
  ];
  const SEMUA_PENAPIS = PENAPIS_UTAMA.concat(PENAPIS_LAIN);
  const LABEL_DIM = Object.fromEntries(SEMUA_PENAPIS);
  LABEL_DIM._petaDaerah = "Daerah (peta)";
  const DIMENSI = [
    ["pegawai_kerja_luar", "Pegawai Kerja Luar"],
    ["fasa_be", "Fasa BE"],
    ["tier", "Tier"],
    ["penyelia", "Penyelia"],
    ["pegawai", "Pegawai"],
    ["sektor", "Sektor"],
    ["subsektor", "Subsektor"],
    ["pmks", "PMKS"],
    ["pejabat_operasi", "Pejabat Perangkaan"],
    ["parlimen", "Parlimen"],
    ["kod_survei", "Kod Survei"],
    ["msic_3", "Kod Industri 3 digit"],
    ["bbu_sbu", "BBU / SBU"],
    ["status_rekod", "Status Rekod"],
    ["cara_terima", "Cara Terima"],
    ["negeri", "Negeri"],
  ];
  const nilaiDim = (r, d) => {
    if (d === "_kat") return r._kat;
    const v = r[d];
    return v == null || v === "" ? KOSONG : String(v);
  };
  const labelNilai = (d, v) => (d === "_kat" ? KAT_LABEL[v] || v : d === "_tahap" ? TAHAP_LABEL[v] || v : v);
  const adaLajur = (k) => S.rekod.some((r) => r[k] != null && r[k] !== "");

  // ---------- Utiliti ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtN = new Intl.NumberFormat("ms-MY");
  const fmtP = (x) => (isFinite(x) ? (x * 100).toFixed(1) + "%" : "–");
  function ringkas(x, rm) {
    if (x == null || !isFinite(x)) return "–";
    const a = Math.abs(x);
    const p = rm ? "RM " : "";
    if (a >= 1e9) return p + (x / 1e9).toFixed(2) + " bil";
    if (a >= 1e6) return p + (x / 1e6).toFixed(2) + " j";
    if (a >= 1e4) return p + (x / 1e3).toFixed(1) + " k";
    return p + fmtN.format(Math.round(x * 100) / 100);
  }
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function toast(m, ms) {
    const t = $("toast"); t.textContent = m; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms || 3500);
  }
  function tarikhPapar(iso) {
    if (!iso) return "";
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    return d + "/" + m + "/" + y;
  }
  const median = (a) => {
    if (!a.length) return NaN;
    const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  function kiraKat(R) {
    const o = { _n: R.length, T: {} };
    for (const c of KATEGORI) o[c.k] = 0;
    for (const t of TAHAP) o.T[t.k] = 0;
    o.K14 = 0;
    for (const r of R) { o[r._kat]++; o.T[r._tahap]++; if (kodNombor(r.status_respon_semasa) === 14) o.K14++; }
    o.KodA = o.A1 + o.LK;
    o.siap = o._n - o.Belum;
    o.selesai = o.T.Selesai;
    return o;
  }
  function kumpulKat(R, fnKunci) {
    const m = new Map();
    for (const r of R) {
      const k = fnKunci(r);
      if (k == null) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return m;
  }
  function unduh(nama, baris) {
    const sel = (v) => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const blob = new Blob(["﻿" + baris.map((b) => b.map(sel).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Muat data ----------
  async function muatData(senyap) {
    try {
      const { data: mn, error: e1 } = await sb.from("muat_naik").select("*")
        .eq("status", "aktif").order("created_at", { ascending: false }).limit(1);
      if (e1) throw e1;
      const aktif = mn && mn[0];
      if (senyap && aktif && S.muatNaik && aktif.id === S.muatNaik.id) return;
      if (senyap && !aktif && !S.muatNaik) return;
      S.muatNaik = aktif || null;
      if (!aktif) { S.rekod = []; papar(); return; }
      $("info").textContent = "Memuatkan " + fmtN.format(aktif.bil_rekod) + " rekod…";
      const semua = [];
      const SAIZ = 1000;
      for (let dari = 0; ; dari += SAIZ) {
        const { data, error } = await sb.from("rekod").select("*").eq("muat_naik_id", aktif.id)
          .order("id").range(dari, dari + SAIZ - 1);
        if (error) throw error;
        semua.push(...data);
        if (data.length < SAIZ) break;
      }
      for (const r of semua) terbit(r);
      S.rekod = semua;
      S.geoCache = null;
      sediaDimensi();
      bersihTapisLapuk();
      papar();
      if (senyap) toast("Data terkini dimuatkan (" + fmtN.format(semua.length) + " rekod).");
    } catch (e) {
      console.error(e);
      $("info").textContent = "Gagal memuatkan data: " + (e.message || e);
    }
  }
  function sediaDimensi() {
    const ada = DIMENSI.filter(([k]) => new Set(S.rekod.map((r) => nilaiDim(r, k))).size > 1);
    const senarai = ada.length ? ada : DIMENSI.slice(0, 1);
    if (!senarai.some(([k]) => k === S.dimensi)) S.dimensi = senarai[0][0];
    const pilih = $("pilihDimensi");
    pilih.innerHTML = senarai.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
    pilih.value = S.dimensi;
    lajurJadual = LAJUR_JADUAL.filter(([k]) => adaLajur(k));
    const dimIo = DIMENSI_IO.find(([k]) => new Set(S.rekod.map((r) => nilaiDim(r, k))).size > 1);
    if (dimIo && !$("pilihDimIo").dataset.dipilih) $("pilihDimIo").value = dimIo[0];
    const uk = UKURAN.filter(([k]) => adaLajur(k + "_semasa") || adaLajur(k + "_sebelum"));
    $("pilihUkuranSerak").innerHTML = (uk.length ? uk : UKURAN).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
    if (!uk.some(([k]) => k === S.ukuranSerak) && uk.length) S.ukuranSerak = uk[0][0];
    $("pilihUkuranSerak").value = S.ukuranSerak;
  }
  function bersihTapisLapuk() {
    for (const d of Object.keys(S.tapis)) {
      if (d === "_petaDaerah") { delete S.tapis[d]; continue; }
      const ada = new Set(S.rekod.map((r) => nilaiDim(r, d)));
      for (const v of [...S.tapis[d]]) if (!ada.has(v)) S.tapis[d].delete(v);
      if (!S.tapis[d].size) delete S.tapis[d];
    }
  }

  // ---------- Penapisan ----------
  function lulus(r, kecuali) {
    for (const d in S.tapis) {
      if (d === kecuali) continue;
      if (!S.tapis[d].has(nilaiDim(r, d))) return false;
    }
    return true;
  }
  const ditapis = (kecuali) => S.rekod.filter((r) => lulus(r, kecuali));
  function setTapis(d, nilai) {
    if (nilai && nilai.size) S.tapis[d] = nilai; else delete S.tapis[d];
    S.halaman = 0;
    papar();
  }
  // Klik pada carta: pilih satu nilai sahaja; klik lagi untuk buang
  function klikTapis(d, nilai) {
    const v = [].concat(nilai);
    const s = S.tapis[d];
    const sama = s && s.size === v.length && v.every((x) => s.has(x));
    setTapis(d, sama ? null : new Set(v));
  }

  // ---------- Paparan ----------
  function papar() {
    const mn = S.muatNaik;
    $("info").textContent = mn
      ? (mn.nama_fail || "–") + " · " + fmtN.format(S.rekod.length) + " rekod · dikemas kini " +
        new Date(mn.created_at).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })
      : "Belum ada data dimuat naik";
    const ada = S.rekod.length > 0;
    $("kosong").hidden = ada;
    document.querySelectorAll(".halaman").forEach((el) => (el.hidden = !ada || el.dataset.hal !== S.hal));
    document.querySelector(".penapis").hidden = !ada;
    paparPenapis();
    if (!ada) return;
    paparHalaman();
    if (!$("popover").hidden) paparPopover();
  }
  function paparHalaman() {
    const R = ditapis();
    if (S.hal === "ringkasan") {
      paparKpi(R); paparSektor(R); cartaAliran(R); cartaDonut(R); cartaStatus(R); cartaTarikh(R); cartaPencapaianIkut(R);
      // Cara terima kosong = pertubuhan belum ada respon (dikira sebagai "Belum ada respon"), jadi tidak dipaparkan di sini
      const adaRespon = R.filter((r) => String(r.cara_terima == null ? "" : r.cara_terima).trim() !== "");
      cartaBar("cCara", adaRespon, "cara_terima", 8);
      $("caraSub").textContent = `Pertubuhan yang sudah ada respon · ${fmtN.format(R.length - adaRespon.length)} belum ada respon tidak dipaparkan`;
      cartaBar("cPmks", R, "pmks", 8);
      paparAmaranPinda(R);
      paparMatriks(R); paparPenemuan(R);
      document.querySelectorAll("[data-perlu-tahap]").forEach((el) => (el.hidden = !ADA_TAHAP()));
    } else if (S.hal === "peta") paparPeta(R);
    else if (S.hal === "prestasi") {
      const mod = S.paparFe || "kad";
      const jadual = mod === "jadual";
      $("artJadual").hidden = !jadual;
      $("artSkor").hidden = !jadual;
      $("kadFe").hidden = mod !== "kad";
      $("cKuadran").hidden = mod !== "kuadran";
      $("artFeLegenda").hidden = mod !== "kuadran";
      if (jadual) { cartaDimensi(R); paparSkor(R); }
      else if (mod === "kad") paparKadFe(R);
      else cartaKuadran(R);
    }
    else if (S.hal === "nilai") { paparIo(R); paparTiga(R); paparTafsiran(R); paparKewangan(R); cartaSerak(R); paparSemakan(R); }
    else if (S.hal === "rekod") { paparRekod(R); $("btnPinda").setAttribute("aria-pressed", String(!!S.hanyaPinda)); $("btnPinda").classList.toggle("aktif", !!S.hanyaPinda); }
    requestAnimationFrame(() => Object.values(S.carta).forEach((c) => {
      if (c.getDom().offsetParent) c.resize();
    }));
  }

  // ---------- Penapis (dropdown + laci) ----------
  function teksPilihan(d) {
    const s = S.tapis[d];
    if (!s || !s.size) return "Semua";
    const v = [...s].map((x) => labelNilai(d, x));
    return v.length === 1 ? v[0] : v.length + " dipilih";
  }
  function htmlDd(d, label) {
    const aktif = S.tapis[d] && S.tapis[d].size;
    const kosong = !adaLajur(d) && d !== "_kat" && d !== "_tahap";
    return `<button type="button" class="dd${aktif ? " aktif" : ""}" data-dd="${d}"${kosong ? ' disabled title="Lajur ini tiada dalam data"' : ""}>` +
      `<span class="dd-label">${esc(label)}</span><span class="dd-nilai">${kosong ? "Tiada data" : esc(teksPilihan(d))}</span></button>`;
  }
  function paparPenapis() {
    $("penapisUtama").innerHTML = PENAPIS_UTAMA.map(([d, l]) => htmlDd(d, l)).join("");
    const lain = PENAPIS_LAIN.filter(([d]) => d === "_kat" || (d === "_tahap" && ADA_TAHAP()) || new Set(S.rekod.map((r) => nilaiDim(r, d))).size > 1 || S.tapis[d]);
    $("laciIsi").innerHTML = lain.map(([d, l]) => htmlDd(d, l)).join("") || '<p class="nota">Tiada penapis tambahan.</p>';
    const bilLain = Object.keys(S.tapis).filter((d) => !PENAPIS_UTAMA.some(([k]) => k === d)).length;
    $("bilPenapisLain").hidden = !bilLain;
    $("bilPenapisLain").textContent = bilLain;
    $("btnKosong").hidden = !Object.keys(S.tapis).length;
    // Cip untuk penapis yang datang dari klik carta / laci
    const c = [];
    for (const d in S.tapis) {
      if (PENAPIS_UTAMA.some(([k]) => k === d)) continue;
      const v = d === "_petaDaerah" ? [S.petaLabelTapis || "daerah dipilih"] : [...S.tapis[d]].map((x) => labelNilai(d, x));
      c.push(`<span class="cip"><strong>${esc(LABEL_DIM[d] || d)}:</strong> ${esc(v.length > 3 ? v.slice(0, 3).join(", ") + " +" + (v.length - 3) : v.join(", "))}` +
        `<button data-buang="${d}" aria-label="Buang penapis">×</button></span>`);
    }
    $("cip").innerHTML = c.join("");
  }

  let ddAktif = null;
  function bukaPopover(btn) {
    ddAktif = btn.dataset.dd;
    const pv = $("popover");
    pv.hidden = false;
    pv.innerHTML = `<div class="pv-atas"><input type="search" placeholder="Cari ${esc(LABEL_DIM[ddAktif] || "")}…" aria-label="Cari pilihan"></div>` +
      `<div class="pv-senarai"></div><div class="pv-bawah"><button class="pautan" data-pv="semua">Pilih semua</button><button class="pautan" data-pv="kosong">Kosongkan</button></div>`;
    const r = btn.getBoundingClientRect();
    const lebar = Math.max(280, r.width);
    pv.style.width = lebar + "px";
    pv.style.left = Math.min(r.left, window.innerWidth - lebar - 12) + "px";
    pv.style.top = Math.min(r.bottom + 6, window.innerHeight - 240) + "px";
    paparPopover();
    pv.querySelector("input").focus();
  }
  function tutupPopover() { $("popover").hidden = true; ddAktif = null; }
  function nilaiPopover() {
    const d = ddAktif;
    const kira = new Map();
    for (const r of S.rekod) kira.set(nilaiDim(r, d), 0);
    for (const r of ditapis(d)) { const v = nilaiDim(r, d); kira.set(v, kira.get(v) + 1); }
    let nilai = [...kira.keys()];
    if (d === "_kat") nilai = KATEGORI.map((c) => c.k).filter((k) => kira.has(k));
    else if (d === "_tahap") nilai = TAHAP.map((c) => c.k).filter((k) => kira.has(k));
    else nilai.sort((a, b) => (kira.get(b) > 0) - (kira.get(a) > 0) || a.localeCompare(b, "ms", { numeric: true }));
    return { nilai, kira };
  }
  function paparPopover() {
    if (!ddAktif) return;
    const pv = $("popover");
    const q = (pv.querySelector("input").value || "").toLowerCase();
    const { nilai, kira } = nilaiPopover();
    const pilih = S.tapis[ddAktif];
    pv.querySelector(".pv-senarai").innerHTML = nilai.filter((v) => !q || labelNilai(ddAktif, v).toLowerCase().includes(q)).map((v) =>
      `<label class="opsyen${kira.get(v) ? "" : " sifar"}"><input type="checkbox" value="${esc(v)}"${pilih && pilih.has(v) ? " checked" : ""}>` +
      `<span class="t" title="${esc(labelNilai(ddAktif, v))}">${esc(labelNilai(ddAktif, v))}</span><span class="n">${fmtN.format(kira.get(v))}</span></label>`
    ).join("") || '<p class="nota" style="padding:8px">Tiada padanan.</p>';
  }

  // ---------- KPI ----------
  // Ukuran utama: % Selesai (Status Rekod). Jika data tiada Status Rekod, guna kadar respons (ada kod respon).
  const ukurUtama = () => (ADA_TAHAP() ? "selesai" : "respon");
  const capai = (c) => (ukurUtama() === "selesai" ? c.selesai : c.siap);
  function cincin(p, label) {
    const C = 2 * Math.PI * 40;
    return `<svg class="cincin" viewBox="0 0 100 100" role="img" aria-label="${esc(label)} ${fmtP(p)}">
      <circle class="lat" cx="50" cy="50" r="40" fill="none" stroke-width="10"/>
      <circle class="isi" cx="50" cy="50" r="40" fill="none" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, p || 0))}" transform="rotate(-90 50 50)"/>
      <text x="50" y="57" text-anchor="middle">${Math.round((p || 0) * 100)}%</text></svg>`;
  }
  function paparSektor(R) {
    const ada = R.some((r) => r._sektor4 && r._sektor4 !== KOSONG);
    $("sektorNota").textContent = ada ? "Klik kad untuk tapis. Pertubuhan tanpa kod KP yang dikenali tidak dikira dalam kad ini." :
      "Lajur Kod KP belum ada dalam data. Muat naik fail yang mengandungi kod KP (cth. KP 205) untuk melihat sektor.";
    $("sektorKad").innerHTML = SEKTOR_UTAMA.map((s, i) => {
      const rs = R.filter((r) => r._sektor4 === s.k);
      const c = kiraKat(rs), m = c._n || 0;
      const cap = m ? capai(c) / m : 0;
      const pSek = R.length ? m / R.length : 0;
      const aktif = S.tapis._sektor4 && S.tapis._sektor4.has(s.k);
      return `<button type="button" class="sektor-kad${aktif ? " aktif" : ""}" data-sektor="${esc(s.k)}" aria-pressed="${!!aktif}" style="--c1:${s.c1};--c2:${s.c2}">` +
        `<div class="sektor-atas"><span class="sektor-ikon">${s.ikon}</span>` +
        `<div class="sektor-rings">${[["Negeri", (c.T.Negeri || 0) / (m || 1)], ["SMD", (c.T.SMD || 0) / (m || 1)]].map(([lab, v]) =>
          `<span class="sektor-ring" title="Semakan ${lab}: ${fmtP(v)}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="rt" cx="18" cy="18" r="15.5"/>` +
          `<circle class="rv" cx="18" cy="18" r="15.5" pathLength="100" stroke-dasharray="${(v * 100).toFixed(1)} 100"/></svg>` +
          `<b>${m ? Math.round(v * 100) : 0}%</b><small>${lab}</small></span>`).join("")}</div></div>` +
        `<div class="sektor-nama">${esc(s.k)}</div><div class="sektor-kp">KP ${s.kod.join(", ")}</div>` +
        `<div class="sektor-nilai">${fmtN.format(m)}</div>` +
        `<div class="sektor-sub">${fmtP(pSek)} daripada tapisan · ${fmtP(cap)} ${ukurUtama() === "selesai" ? "selesai" : "ada respon"}</div>` +
        `<div class="sektor-statistik">` +
        [["Kod 11", c.A1], ["LK", c.LK], ["Kod B", c.KodB], ["Pinda", c.T.Pinda]].map(([lab, v]) =>
          `<div class="sektor-stat"><span>${lab}</span><b>${fmtN.format(v || 0)}</b><small>${m ? fmtP((v || 0) / m) : "–"}</small></div>`).join("") +
        `</div>` +
        `<div class="sektor-bar" aria-hidden="true"><i style="--w:${(cap * 100).toFixed(1)}%"></i></div></button>`;
    }).join("");
  }

  function paparKpi(R) {
    const k = kiraKat(R), n = k._n || 1, T = k.T;
    const sas = S.sasaran;
    const tahapMod = ukurUtama() === "selesai";
    const nCapai = capai(k), p = nCapai / n;
    const hero = `<div class="kpi kpi-hero">${cincin(p, tahapMod ? "Pencapaian selesai" : "Kadar respons")}
      <div><div class="label">${tahapMod ? "Pencapaian · Selesai" : "Kadar respons"}</div>
        <div class="nilai">${fmtN.format(nCapai)} <span style="font-size:15px;color:var(--muted);font-weight:600">/ ${fmtN.format(k._n)}</span></div>
        <div class="sub">${sas ? (p * 100 >= sas ? `<span class="naik">✓ Capai sasaran ${sas}%</span>` :
          `Perlu <b>${fmtN.format(Math.max(0, Math.ceil(sas / 100 * k._n) - nCapai))}</b> lagi untuk ${sas}%`) : ""}</div></div></div>`;
    const kad = tahapMod ? [
      ["Jumlah pertubuhan", fmtN.format(k._n), "dalam tapisan semasa", null, "--ink-2"],
      ["Semakan SMD", fmtN.format(T.SMD), fmtP(T.SMD / n) + " · menunggu SMD", T.SMD / n, "--s1"],
      ["Semakan DOSM Negeri", fmtN.format(T.Negeri), fmtP(T.Negeri / n) + " · menunggu negeri", T.Negeri / n, "--s7"],
      ["Pinda Semula", fmtN.format(T.Pinda), fmtP(T.Pinda / n) + " · dikembalikan", T.Pinda / n, "--s5"],
      ["Dalam Proses", fmtN.format(T.Proses), fmtP(T.Proses / n) + " · di peringkat FE", T.Proses / n, "--s4"],
    ] : [
      ["Jumlah pertubuhan", fmtN.format(k._n), "dalam tapisan semasa", null, "--ink-2"],
      ["Kod A (11 + LK)", fmtN.format(k.KodA), fmtP(k.KodA / n), k.KodA / n, "--s1"],
      ["LK · Lain-lain Keputusan", fmtN.format(k.LK), fmtP(k.LK / n), k.LK / n, "--s3"],
      ["Kod B · Dalam proses", fmtN.format(k.KodB), fmtP(k.KodB / n), k.KodB / n, "--s4"],
      ["Belum ada respon", fmtN.format(k.Belum), fmtP(k.Belum / n), k.Belum / n, "--s0"],
    ];
    $("kpi").innerHTML = hero + kad.map(([l, v, s, q, c]) =>
      `<div class="kpi" style="--c:var(${c})"><div class="label"><i></i>${esc(l)}</div><div class="nilai">${v}</div>` +
      `<div class="sub">${esc(s)}</div>${q == null ? "" : `<div class="meter"><div style="width:${Math.min(100, q * 100)}%"></div></div>`}</div>`
    ).join("");
  }

  // ---------- Carta ----------
  function carta(id) {
    const el = $(id);
    if (!S.carta[id] || S.carta[id].getDom() !== el) S.carta[id] = echarts.init(el, null, { renderer: "svg" });
    return S.carta[id];
  }
  function tooltipAsas() {
    return {
      backgroundColor: css("--surface"), borderColor: css("--border-strong"), borderWidth: 1, padding: [8, 12],
      textStyle: { color: css("--ink"), fontSize: 12.5, fontFamily: "Inter, system-ui, sans-serif" },
      extraCssText: "box-shadow:0 8px 24px rgba(16,24,40,.16);border-radius:10px;",
    };
  }
  function asasTema() {
    return {
      textStyle: { fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif", color: css("--ink-2") },
      tooltip: tooltipAsas(),
      animationDuration: 400, animationEasing: "cubicOut",
    };
  }
  const paksi = () => ({
    axisLine: { lineStyle: { color: css("--axis") } }, axisTick: { show: false },
    axisLabel: { color: css("--muted"), fontSize: 11 }, splitLine: { lineStyle: { color: css("--grid") } },
  });
  const tanda = (warna) => `<span style="display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:7px;background:${warna}"></span>`;
  function kosongkanCarta(ch, teks) {
    ch.setOption({ graphic: [{ type: "text", left: "center", top: "middle", style: { text: teks, fill: css("--muted"), fontSize: 13 } }] }, true);
  }

  // Bar 100% satu baris (komposisi)
  function barKomposisi(id, senarai, kiraan, n, dim) {
    const ada = senarai.filter((c) => kiraan[c.k]);
    const ch = carta(id);
    ch.setOption({
      ...asasTema(),
      grid: { left: 0, right: 0, top: 4, bottom: 4 },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `${tanda(p.color)}<b>${esc(p.seriesName)}</b><br>${fmtN.format(kiraan[ada[p.seriesIndex].k])} pertubuhan · ${fmtP(p.value / 100)}` },
      xAxis: { type: "value", max: 100, show: false },
      yAxis: { type: "category", data: ["x"], show: false },
      series: ada.map((c, i) => ({
        name: c.label, type: "bar", stack: "k", barWidth: 30,
        data: [Math.round((kiraan[c.k] / n) * 1000) / 10],
        itemStyle: { color: css(c.warna), borderColor: css("--surface"), borderWidth: 2,
          borderRadius: [i === 0 ? 8 : 0, i === ada.length - 1 ? 8 : 0, i === ada.length - 1 ? 8 : 0, i === 0 ? 8 : 0] },
        label: { show: kiraan[c.k] / n >= 0.06, position: "inside", color: "#fff", fontWeight: 700, fontSize: 12,
          formatter: () => (kiraan[c.k] / n >= 0.12 ? (c.pendek || c.label.split(" ·")[0]) + "  " : "") + fmtP(kiraan[c.k] / n) },
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis(dim, ada[p.seriesIndex].k));
  }

  // Aliran pencapaian: setiap peringkat dengan bilangan & %
  function cartaAliran(R) {
    const k = kiraKat(R), n = k._n || 1;
    barKomposisi("cAliranBar", TAHAP, k.T, n, "_tahap");
    const urut = ["Proses", "Negeri", "SMD", "Pinda", "Selesai", "Tiada"].map((x) => TAHAP.find((t) => t.k === x)).filter((t) => k.T[t.k]);
    const ch = carta("cAliran");
    ch.setOption({
      ...asasTema(),
      grid: { left: 160, right: 110, top: 6, bottom: 4, containLabel: false },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `<b>${esc(p.name)}</b><br>${fmtN.format(p.value)} pertubuhan (${fmtP(p.value / n)})` },
      xAxis: { type: "value", show: false },
      yAxis: { type: "category", inverse: true, data: urut.map((t) => t.label), ...paksi(), splitLine: { show: false }, axisLine: { show: false },
        axisLabel: { color: css("--ink"), fontSize: 12.5, fontWeight: 600, width: 150, overflow: "truncate" } },
      series: [{ type: "bar", barMaxWidth: 26,
        data: urut.map((t) => ({ value: k.T[t.k], itemStyle: { color: css(t.warna), borderRadius: [0, 6, 6, 0] } })),
        showBackground: true, backgroundStyle: { color: css("--grid"), borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: "right", color: css("--ink"), fontSize: 12.5, fontWeight: 700,
          formatter: (p) => fmtN.format(p.value) + "  ·  " + fmtP(p.value / n) } }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis("_tahap", urut[p.dataIndex].k));
  }

  function cartaKomposisi(R) {
    const k = kiraKat(R);
    barKomposisi("cKomposisi", KATEGORI, k, k._n || 1, "_kat");
  }

  function cartaStatus(R) {
    // Kumpul ikut kod (teks penerangan boleh berbeza antara fail)
    const kira = new Map(), contoh = new Map();
    for (const r of R) {
      const asal = r.status_respon_semasa == null || r.status_respon_semasa === "" ? KOSONG : String(r.status_respon_semasa).trim();
      const m = asal.match(/^(\d{1,3})/);
      const v = m ? m[1] : asal;
      kira.set(v, (kira.get(v) || 0) + 1);
      if (!contoh.has(v) || asal.length > contoh.get(v).length) contoh.set(v, asal);
    }
    const susun = [...kira.entries()].sort((a, b) => (a[0] === KOSONG) - (b[0] === KOSONG) ||
      a[0].localeCompare(b[0], "ms", { numeric: true }));
    const katDari = (k) => KATEGORI.find((c) => c.k === kategori(k === KOSONG ? "" : k));
    const kod = (v) => (v.match(/^\d{1,3}/) || [v])[0];
    const ch = carta("cStatus");
    ch.setOption({
      ...asasTema(),
      legend: { top: 0, left: "center", itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { color: css("--ink-2"), fontSize: 11.5 },
        data: KATEGORI.filter((c) => susun.some(([k]) => katDari(k).k === c.k)).map((c) => ({ name: c.label, itemStyle: { color: css(c.warna) } })) },
      grid: { left: 4, right: 8, top: 44, bottom: 30, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `<b>${esc(contoh.get(susun[p.dataIndex][0]))}</b><br>${esc(katDari(susun[p.dataIndex][0]).label)}<br>${fmtN.format(p.value)} pertubuhan (${fmtP(p.value / R.length)})` },
      xAxis: { type: "category", data: susun.map((s) => kod(s[0])), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--muted"), fontSize: 11, interval: 0, rotate: susun.length > 18 ? 45 : 0 } },
      yAxis: { type: "value", ...paksi() },
      series: KATEGORI.map((c) => ({
        name: c.label, type: "bar", stack: "s", barMaxWidth: 30,
        data: susun.map(([k, v]) => (katDari(k).k === c.k ? v : null)),
        itemStyle: { color: css(c.warna), borderRadius: [5, 5, 0, 0] },
        label: { show: susun.length <= 20, position: "top", color: css("--ink-2"), fontSize: 10.5, formatter: (p) => (p.value ? fmtN.format(p.value) : "") },
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => {
      const kod = susun[p.dataIndex][0];
      const nilai = [...new Set(R.map((r) => r.status_respon_semasa == null || r.status_respon_semasa === "" ? KOSONG : String(r.status_respon_semasa)))]
        .filter((v) => (v.trim().match(/^(\d{1,3})/) || [null, v.trim()])[1] === kod);
      klikTapis("status_respon_semasa", nilai);
    });
  }

  function cartaTarikh(R) {
    const semua = R.map((r) => r.tarikh_terima).filter(Boolean).sort();
    const ch = carta("cTarikh");
    const nota = $("trendNota");
    if (!semua.length) { nota.textContent = ""; return kosongkanCarta(ch, "Tiada Tarikh Terima dalam tapisan"); }
    // Abaikan tarikh terpencil yang sangat lama (cth. 2010): mula dari persentil ke-1
    const mula = semua[Math.floor(semua.length * 0.01)];
    const awal = semua.filter((t) => t < mula).length;
    const kira = new Map();
    for (const t of semua) if (t >= mula) kira.set(t, (kira.get(t) || 0) + 1);
    // Isi hari tanpa penerimaan dengan 0 supaya paksi masa betul
    const hari = [];
    for (let d = new Date(mula + "T00:00:00"), akhir = new Date(semua[semua.length - 1] + "T00:00:00"); d <= akhir; d.setDate(d.getDate() + 1)) hari.push(tarikhIso(d));
    const bil = hari.map((h) => kira.get(h) || 0);
    const ma7 = bil.map((_, i) => (i < 6 ? null : +(bil.slice(i - 6, i + 1).reduce((x, y) => x + y, 0) / 7).toFixed(1)));
    const kum = []; bil.reduce((k, v, i) => (kum[i] = k + v), awal);
    const n = R.length || 1;
    const puncak = bil.indexOf(Math.max(...bil));
    const min7 = (a, b) => bil.slice(a, b).reduce((x, y) => x + y, 0) / Math.max(1, b - a);
    const L = bil.length;
    const ini = L >= 7 ? min7(L - 7, L) : null, lepas = L >= 14 ? min7(L - 14, L - 7) : null;
    nota.innerHTML = `Puncak: <b>${tarikhPapar(hari[puncak])}</b> (${fmtN.format(bil[puncak])} borang) · purata harian ${fmtN.format(+(bil.reduce((x, y) => x + y, 0) / L).toFixed(1))}` +
      (ini != null && lepas != null ? ` · purata 7 hari terakhir <b>${ini.toFixed(1)}</b> berbanding <b>${lepas.toFixed(1)}</b> 7 hari sebelumnya (${ini >= lepas ? "▲" : "▼"} ${fmtP(Math.abs(ini / (lepas || 1) - 1))})` : "") +
      (awal ? ` · ${fmtN.format(awal)} borang sebelum ${tarikhPapar(mula)} tidak dipaparkan dalam trend` : "");
    ch.setOption({
      ...asasTema(),
      grid: { left: 4, right: 16, top: 34, bottom: 4, containLabel: true },
      legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: css("--ink-2"), fontSize: 11.5 } },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "line", lineStyle: { color: css("--axis") } },
        formatter: (ps) => { const i = ps[0].dataIndex; return `<b>${tarikhPapar(hari[i])}</b><br>Diterima: <b>${fmtN.format(bil[i])}</b><br>Purata 7 hari: ${ma7[i] == null ? "–" : ma7[i]}<br>Kumulatif: ${fmtN.format(kum[i])} (${fmtP(kum[i] / n)})`; } },
      xAxis: { type: "category", data: hari.map(tarikhPapar), ...paksi(), boundaryGap: true, splitLine: { show: false },
        axisLabel: { color: css("--muted"), fontSize: 11, hideOverlap: true } },
      yAxis: { type: "value", ...paksi(), minInterval: 1 },
      series: [
        { name: "Diterima (harian)", type: "bar", data: bil, barMaxWidth: 14, itemStyle: { color: css("--s1"), borderRadius: [4, 4, 0, 0], opacity: 0.5 } },
        { name: "Purata 7 hari", type: "line", data: ma7, smooth: true, showSymbol: false, connectNulls: false,
          lineStyle: { width: 2.5, color: css("--s3") }, itemStyle: { color: css("--s3") } },
      ],
    }, true);
    $("cTarikh").closest(".kad").querySelector(".kad-sub").textContent =
      `Bilangan harian dan purata bergerak 7 hari · ${fmtN.format(hari.length)} hari · ikut Tarikh Terima`;
  }

  // Amaran jumlah catatan pinda SMD; klik untuk buka senarai rekod yang ditapis
  const adaPinda = (r) => String(r.catatan_pinda_smd == null ? "" : r.catatan_pinda_smd).trim() !== "";
  function paparAmaranPinda(R) {
    const el = $("amaranPinda");
    const n = R.filter(adaPinda).length;
    el.hidden = !n;
    el.innerHTML = `<span class="amaran-ikon" aria-hidden="true">!</span><span><b>${fmtN.format(n)}</b> rekod ada catatan <b>Pinda SMD</b> · klik untuk lihat senarai</span>`;
  }

  // Bar bertindan 100% tahap pencapaian ikut satu dimensi (Pejabat / Daerah / dll.)
  function cartaPencapaianIkut(R) {
    const calon = ["pejabat_operasi", "subsektor", "sektor", "kod_survei"];
    const d = calon.find((x) => { const n = new Set(R.map((r) => nilaiDim(r, x))).size; return n > 1 && n <= 40; }) || "pejabat_operasi";
    const tajuk = { pejabat_operasi: "pejabat perangkaan", _dl: "daerah", subsektor: "subsektor", sektor: "sektor", kod_survei: "kod survei" }[d];
    $("cIkut").closest(".kad").querySelector("h2").textContent = "Pencapaian ikut " + tajuk;
    const tahapMod = ukurUtama() === "selesai";
    const senarai = tahapMod ? TAHAP : KATEGORI;
    const kunci = tahapMod ? "_tahap" : "_kat";
    const g = [...kumpulKat(R, (r) => nilaiDim(r, d)).entries()].map(([v, rs]) => [v, kiraKat(rs)])
      .sort((a, b) => b[1]._n - a[1]._n).slice(0, 15).sort((a, b) => capai(a[1]) / a[1]._n - capai(b[1]) / b[1]._n);
    const ada = senarai.filter((t) => g.some(([, c]) => (tahapMod ? c.T : c)[t.k]));
    const el = $("cIkut");
    el.style.height = Math.max(240, g.length * 34 + 70) + "px";
    const ch = carta("cIkut");
    ch.resize();
    const sas = S.sasaran;
    ch.setOption({
      ...asasTema(),
      legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: css("--ink-2"), fontSize: 11 } },
      grid: { left: 4, right: 56, top: 34, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: css("--accent-soft") } },
        formatter: (ps) => { const c = g[ps[0].dataIndex][1]; const x = tahapMod ? c.T : c;
          return `<b>${esc(ps[0].name)}</b> · ${fmtN.format(c._n)} pertubuhan<br>` + ada.filter((t) => x[t.k]).map((t) => `${tanda(css(t.warna))}${esc(t.label)}: ${fmtN.format(x[t.k])} (${fmtP(x[t.k] / c._n)})`).join("<br>"); } },
      xAxis: { type: "value", max: 100, ...paksi(), axisLabel: { ...paksi().axisLabel, formatter: "{value}%" } },
      yAxis: { type: "category", data: g.map((x) => x[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--ink-2"), fontSize: 11.5, width: 160, overflow: "truncate" } },
      series: ada.map((t, i) => ({
        name: t.label, type: "bar", stack: "p", barMaxWidth: 20,
        data: g.map(([, c]) => Math.round(((tahapMod ? c.T : c)[t.k] / c._n) * 1000) / 10),
        itemStyle: { color: css(t.warna), borderColor: css("--surface"), borderWidth: 1 },
        markLine: i === 0 && sas ? { symbol: "none", silent: true, lineStyle: { color: css("--bad"), type: "dashed", width: 1.5 }, label: { show: false }, data: [{ xAxis: sas }] } : undefined,
        label: i === ada.length - 1 ? { show: true, position: "right", color: css("--ink"), fontWeight: 700, fontSize: 11.5,
          formatter: (p) => fmtP(capai(g[p.dataIndex][1]) / g[p.dataIndex][1]._n) } : undefined,
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis(d, p.name));
  }

  function cartaBar(id, R, d, had) {
    const tajukEl = $(id).closest(".kad").querySelector("h2");
    if (id === "cPmks") tajukEl.textContent = "Saiz pertubuhan (PMKS)";
    const kira = new Map();
    for (const r of R) { const v = nilaiDim(r, d); kira.set(v, (kira.get(v) || 0) + 1); }
    let s = [...kira.entries()].sort((a, b) => b[1] - a[1]);
    if (s.length > had) {
      const lain = s.slice(had - 1).reduce((a, b) => a + b[1], 0);
      s = s.slice(0, had - 1).concat([["Lain-lain", lain]]);
    }
    s.reverse();
    const ch = carta(id);
    ch.setOption({
      ...asasTema(),
      grid: { left: 4, right: 56, top: 6, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `<b>${esc(p.name)}</b><br>${fmtN.format(p.value)} pertubuhan (${fmtP(p.value / R.length)})` },
      xAxis: { type: "value", ...paksi(), axisLabel: { show: false }, splitLine: { show: false }, axisLine: { show: false } },
      yAxis: { type: "category", data: s.map((x) => x[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--ink-2"), fontSize: 11.5, width: 120, overflow: "truncate" } },
      series: [{ type: "bar", barMaxWidth: 16, data: s.map((x) => x[1]),
        itemStyle: { color: css("--s1"), borderRadius: [0, 5, 5, 0] },
        showBackground: true, backgroundStyle: { color: css("--grid"), borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: "right", color: css("--ink-2"), fontSize: 11.5, formatter: (p) => fmtN.format(p.value) } }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => { if (p.name !== "Lain-lain") klikTapis(d, p.name); });
  }

  // Matriks kategori respon × tahap pencapaian
  function paparMatriks(R) {
    const baris = KATEGORI.map((c) => c.k), lajur = TAHAP.map((t) => t.k);
    const m = {}; for (const a of baris) { m[a] = {}; for (const b of lajur) m[a][b] = 0; }
    for (const r of R) m[r._kat][r._tahap]++;
    const bAda = baris.filter((a) => lajur.some((b) => m[a][b])), lAda = lajur.filter((b) => baris.some((a) => m[a][b]));
    const maks = Math.max(1, ...bAda.flatMap((a) => lAda.map((b) => m[a][b])));
    const pendekK = { A1: "11", LK: "LK", KodB: "Kod B", Lain: "Lain", Belum: "Belum" };
    const pendekT = { Selesai: "Selesai", SMD: "SMD", Negeri: "Negeri", Pinda: "Pinda", Proses: "Proses", Tiada: "Tiada" };
    const biru = css("--s1");
    let h = `<table class="matriks"><thead><tr><th class="baris">Respon ↓</th>${lAda.map((b) => `<th>${pendekT[b]}</th>`).join("")}</tr></thead><tbody>`;
    for (const a of bAda) {
      h += `<tr><th class="baris">${pendekK[a]}</th>`;
      for (const b of lAda) {
        const v = m[a][b]; const t = v / maks;
        h += `<td style="background:color-mix(in srgb, ${biru} ${Math.round(6 + t * 80)}%, transparent);color:${t > 0.5 ? "#fff" : "inherit"}" title="${esc(KAT_LABEL[a])} · ${esc(TAHAP_LABEL[b])}: ${v}">${v ? fmtN.format(v) : "·"}</td>`;
      }
      h += "</tr>";
    }
    $("matriks").innerHTML = h + "</tbody></table>";
  }

  // ---------- Penemuan automatik ----------
  function paparPenemuan(R) {
    const out = [];
    const k = kiraKat(R), n = k._n;
    if (!n) { $("penemuan").innerHTML = '<li class="nota">Tiada data dalam tapisan.</li>'; return; }
    const sas = S.sasaran;
    const tahapMod = ukurUtama() === "selesai";
    const nm = tahapMod ? "Pencapaian selesai" : "Kadar respons";
    const p = capai(k) / n;
    if (sas) out.push(p * 100 >= sas
      ? ["baik", "✓", `${nm} <b>${fmtP(p)}</b> telah melepasi sasaran ${sas}%.`]
      : ["amaran", "!", `${nm} <b>${fmtP(p)}</b>; perlu <b>${fmtN.format(Math.ceil(sas / 100 * n) - capai(k))}</b> lagi untuk capai sasaran ${sas}%.`]);
    if (tahapMod) {
      const tersekat = ["SMD", "Negeri", "Proses"].map((t) => [t, k.T[t]]).sort((a, b) => b[1] - a[1])[0];
      if (tersekat[1]) out.push(["amaran", "⧗", `Kesesakan terbesar: <b>${fmtN.format(tersekat[1])}</b> pertubuhan (${fmtP(tersekat[1] / n)}) masih di peringkat <b>${esc(TAHAP_LABEL[tersekat[0]])}</b>.`]);
      if (k.T.Pinda) out.push(["amaran", "↺", `<b>${fmtN.format(k.T.Pinda)}</b> pertubuhan dikembalikan untuk <b>Pinda Semula</b> — perlu tindakan segera.`]);
    }
    const terbaikTerendah = (d, nama, min) => {
      if (!adaLajur(d)) return;
      const g = [...kumpulKat(R, (r) => (r[d] == null || r[d] === "" ? null : String(r[d]))).entries()]
        .map(([v, rs]) => [v, kiraKat(rs)]).filter(([, c]) => c._n >= min);
      if (g.length < 2) return;
      g.sort((a, b) => capai(b[1]) / b[1]._n - capai(a[1]) / a[1]._n);
      const [t, ct] = g[0], [r, cr] = g[g.length - 1];
      out.push(["", "↑", `${nama} tertinggi: <b>${esc(t)}</b> (${fmtP(capai(ct) / ct._n)}); terendah: <b>${esc(r)}</b> (${fmtP(capai(cr) / cr._n)}, ${fmtN.format(cr._n - capai(cr))} belum ${tahapMod ? "selesai" : "respon"}).`]);
    };
    terbaikTerendah("pejabat_operasi", "Pejabat", 20);
    terbaikTerendah("pegawai_kerja_luar", "Pegawai Kerja Luar", 20);
    if (k.KodB) out.push(["amaran", "B", `<b>${fmtN.format(k.KodB)}</b> pertubuhan berstatus Kod B (71–77) — perlu susulan.`]);
    const tarikh = R.map((r) => r.tarikh_terima).filter(Boolean).sort();
    if (tarikh.length) {
      const akhir = new Date(tarikh[tarikh.length - 1] + "T00:00:00");
      const h7 = new Date(akhir); h7.setDate(h7.getDate() - 6);
      const h14 = new Date(akhir); h14.setDate(h14.getDate() - 13);
      const iso = tarikhIso;
      const ini = tarikh.filter((t) => t >= iso(h7)).length;
      const lepas = tarikh.filter((t) => t >= iso(h14) && t < iso(h7)).length;
      const ub = lepas ? (ini - lepas) / lepas : NaN;
      out.push([isFinite(ub) && ub < 0 ? "amaran" : "baik", "⏱", `7 hari terakhir (hingga ${tarikhPapar(iso(akhir))}): <b>${fmtN.format(ini)}</b> borang diterima` +
        (isFinite(ub) ? `, ${ub >= 0 ? "naik" : "turun"} ${fmtP(Math.abs(ub))} berbanding 7 hari sebelumnya.` : ".")]);
    }
    const semak = kesSemakan(R).length;
    if (semak) out.push(["amaran", "?", `<b>${fmtN.format(semak)}</b> nilai berubah lebih ±${S.ambang}% berbanding penyiasatan sebelum — lihat tab <b>Analisis Nilai</b>.`]);
    // Amaran tiada perubahan: belum selesai dan status respon semasa sama dengan sebelum
    const teks = (v) => String(v == null ? "" : v).trim();
    const sama = R.filter((r) => r._tahap !== "Selesai" && teks(r.status_respon_semasa) && teks(r.status_respon_semasa) === teks(r.status_respon_sebelum));
    if (sama.length) {
      const ikutFe = {};
      sama.forEach((r) => { const f = teks(r.pegawai_kerja_luar) || KOSONG; ikutFe[f] = (ikutFe[f] || 0) + 1; });
      const top = Object.entries(ikutFe).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, c]) => `${esc(f)} (${c})`).join(", ");
      out.push(["amaran", "=", `<b>${fmtN.format(sama.length)}</b> pertubuhan belum selesai dan status respon tidak berubah berbanding sebelum. Paling banyak: ${top}.`]);
    }
    // Lajur Tier kosong (profiling)
    const tierKosong = R.filter((r) => !teks(r.tier)).length;
    if (tierKosong) out.push(["amaran", "T", `Tier kosong untuk <b>${fmtN.format(tierKosong)}</b> rekod — semak profiling (nilai dijangka Diamond, Gold atau Silver).`]);
    $("penemuan").innerHTML = out.slice(0, 10).map(([j, t, h]) => `<li><span class="tanda ${j}">${t}</span><span>${h}</span></li>`).join("");
  }

  // ---------- Eksport gambar ringkasan (PNG satu fail) ----------
  async function eksportPngRingkasan() {
    if (typeof echarts === "undefined") throw new Error("ECharts tidak dimuat");
    const hal = document.querySelector('.halaman[data-hal="ringkasan"]');
    const skala = 2;
    const asas = hal.getBoundingClientRect();
    const cs = getComputedStyle(document.documentElement);
    const warna = (n) => cs.getPropertyValue(n).trim() || "#888";
    const kepala = 84;
    const kotak = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left - asas.left) * skala, y: (r.top - asas.top) * skala + kepala * skala, w: r.width * skala, h: r.height * skala }; };
    const kpi = [...document.querySelectorAll("#kpi > .kpi")].filter((el) => el.offsetParent);
    const kad = [...hal.querySelectorAll("article.kad")].filter((el) => el.offsetParent);
    const semua = [...kpi, ...kad];
    const tinggi = Math.max(...semua.map((el) => kotak(el).y + kotak(el).h)) + 24 * skala;
    const kanvas = document.createElement("canvas");
    kanvas.width = asas.width * skala;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext("2d");
    ctx.fillStyle = warna("--page") || "#fff";
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    const teksKotak = (t, x, y, px, berat, warnaTeks) => { ctx.font = `${berat} ${px * skala}px system-ui, sans-serif`; ctx.fillStyle = warnaTeks; ctx.fillText(t, x, y); };
    const bulat = (k, fill) => { ctx.beginPath(); ctx.roundRect(k.x, k.y, k.w, k.h, 14 * skala); ctx.fillStyle = fill; ctx.fill(); };
    // Kepala laporan
    teksKotak($("tajuk").textContent, 24 * skala, 36 * skala, 20, 800, warna("--ink"));
    teksKotak($("info").textContent, 24 * skala, 62 * skala, 12, 500, warna("--muted"));
    // Kad KPI
    for (const el of kpi) {
      const k = kotak(el);
      bulat(k, warna("--surface"));
      const lab = el.querySelector(".label")?.textContent || "";
      const nil = el.querySelector(".nilai")?.textContent || "";
      const sub = el.querySelector(".sub")?.textContent || "";
      teksKotak(lab, k.x + 16 * skala, k.y + 26 * skala, 12, 600, warna("--ink-2"));
      teksKotak(nil, k.x + 16 * skala, k.y + 66 * skala, 26, 800, warna("--ink"));
      teksKotak(sub, k.x + 16 * skala, k.y + 92 * skala, 11, 500, warna("--muted"));
    }
    // Kad carta
    const siap = [];
    for (const el of kad) {
      const k = kotak(el);
      bulat(k, warna("--surface"));
      const h2 = el.querySelector("h2")?.textContent || "";
      teksKotak(h2, k.x + 18 * skala, k.y + 28 * skala, 14, 700, warna("--ink"));
      // Penemuan utama: senarai teks dilukis semula dengan pembalutan baris
      const li = [...el.querySelectorAll("#penemuan li")];
      if (li.length) {
        let y = k.y + 60 * skala;
        const lebar = k.w - 56 * skala;
        ctx.font = `500 ${12 * skala}px system-ui, sans-serif`;
        for (const it of li) {
          const tanda = it.querySelector(".tanda")?.textContent || "";
          const ayat = it.lastElementChild?.textContent || "";
          const baris = [];
          let cur = "";
          for (const w of ayat.split(/\s+/)) {
            const uji = cur ? cur + " " + w : w;
            if (ctx.measureText(uji).width > lebar && cur) { baris.push(cur); cur = w; } else cur = uji;
          }
          if (cur) baris.push(cur);
          teksKotak(tanda, k.x + 18 * skala, y + 14 * skala, 12, 800, warna("--accent"));
          baris.forEach((t, i) => teksKotak(t, k.x + 40 * skala, y + (14 + i * 17) * skala, 12, 500, warna("--ink-2")));
          y += (baris.length * 17 + 12) * skala;
        }
      }
      // Matriks respon × tahap: sel dilukis dengan warna latar dan teks
      for (const sel of el.querySelectorAll("#matriks td, #matriks th")) {
        if (!sel.getClientRects().length) continue;
        const rs = kotak(sel);
        const bg = getComputedStyle(sel).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(rs.x, rs.y, rs.w, rs.h); }
        const ya = sel.tagName === "TH" ? warna("--muted") : (getComputedStyle(sel).color || warna("--ink"));
        ctx.font = `${sel.tagName === "TH" ? 600 : 700} ${(sel.tagName === "TH" ? 11 : 12) * skala}px system-ui, sans-serif`;
        ctx.fillStyle = ya;
        ctx.textAlign = sel.classList.contains("baris") ? "left" : "center";
        ctx.textBaseline = "middle";
        const tx = sel.classList.contains("baris") ? rs.x + 6 * skala : rs.x + rs.w / 2;
        ctx.fillText(sel.textContent || "", tx, rs.y + rs.h / 2);
      }
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      for (const c of el.querySelectorAll(".carta")) {
        const inst = echarts.getInstanceByDom(c);
        if (!inst) continue;
        const rc = kotak(c);
        siap.push(new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => { ctx.drawImage(im, rc.x, rc.y, rc.w, rc.h); res(); };
          im.onerror = () => rej(new Error("gagal muat carta"));
          im.src = inst.getDataURL({ type: "png", pixelRatio: skala, backgroundColor: warna("--surface") });
        }));
      }
    }
    await Promise.all(siap);
    const blob = await new Promise((res) => kanvas.toBlob(res, "image/png"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ringkasan-mko-" + new Date().toISOString().slice(0, 10) + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---------- Tafsiran & statistik (tab Analisis Nilai) ----------
  const ADA = (x) => x != null && isFinite(x);
  const kuartil = (arr, q) => {
    if (!arr.length) return null;
    const a = arr.slice().sort((x, y) => x - y), pos = (a.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return a[lo] + (a[hi] - a[lo]) * (pos - lo);
  };
  const cagr = (a, b, tahun) => (ADA(a) && ADA(b) && a > 0 && b > 0 ? Math.pow(b / a, 1 / tahun) - 1 : null);
  const peratus = (x, dp = 1) => (ADA(x) ? (x * 100).toFixed(dp) + "%" : "–");
  const TAHUN_TAFSIR = { "2015": 2015, "2023": 2023, "2026": 2026 };
  function statistikIo(R, y) {
    const pa = R.map((r) => nilaiIo(r, y)).filter((o) => o && ADA(o.io));
    const io = pa.map((o) => o.io), n = io.length;
    const min = n ? io.reduce((a, b) => a + b, 0) / n : null;
    const sd = n > 1 ? Math.sqrt(io.reduce((acc, x) => acc + (x - min) ** 2, 0) / (n - 1)) : null;
    const q1 = kuartil(io, 0.25), q3 = kuartil(io, 0.75), iqr = ADA(q1) ? q3 - q1 : null;
    const terpencil = ADA(iqr) ? io.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr).length : 0;
    const va = R.map((r) => nilaiIo(r, y)).filter((o) => o && ADA(o.va) && o.out > 0);
    const marjin = va.length ? va.reduce((a, o) => a + o.va, 0) / va.reduce((a, o) => a + o.out, 0) : null;
    return { n, median: n ? median(io) : null, q1, q3, cv: ADA(sd) && ADA(min) && min ? sd / min : null,
      bawah: n ? io.filter((x) => x < 1).length / n : null, terpencil, marjin };
  }
  function paparTafsiran(R) {
    sediaSumberIo();
    const D = dataTiga(R);
    const rg = Object.fromEntries(TAHUN_IO.map((y) => [y, ringkasIo(R, y)]));
    const st = Object.fromEntries(TAHUN_IO.map((y) => [y, statistikIo(R, y)]));
    const pendapatan = (y) => D.pendapatan.t[y], pekerja = (y) => D.pekerja.t[y], gaji = (y) => D.gaji.t[y];
    const vaPekerja = (y) => (ADA(rg[y].va) && ADA(pekerja(y)) && pekerja(y) > 0 ? rg[y].va / pekerja(y) : null);
    const gajiPekerja = (y) => (ADA(gaji(y)) && ADA(pekerja(y)) && pekerja(y) > 0 ? gaji(y) / pekerja(y) : null);
    const [a, b, c] = TAHUN_IO;
    const tahunAntara = (y1, y2) => TAHUN_TAFSIR[y2] - TAHUN_TAFSIR[y1];
    const L = [];
    const r3 = rg[c], s3 = st[c];
    if (r3.io != null) {
      const beza = ADA(s3.median) ? Math.abs(s3.median - r3.io) : 0;
      L.push(["", "IO", `IO agregat 2026 ialah <b>${fmtIo(r3.io)}</b>: setiap RM1 output memerlukan RM${fmtIo(r3.io)} input. ` +
        (r3.io < 1 ? "Secara agregat output melebihi input (lebihan kasar positif)." : "Secara agregat input melebihi output; margin operasi negatif.") +
        ` Median IO pertubuhan ialah <b>${fmtIo(s3.median)}</b>, ${beza > 0.1 ? "jauh berbeza daripada IO agregat. Taburan condong dan dipengaruhi pertubuhan bersaiz besar; median lebih sesuai untuk tafsiran biasa." : "hampir sama dengan IO agregat, menandakan taburan agak simetri."}`]);
    }
    const g1 = cagr(pendapatan(a), pendapatan(b), tahunAntara(a, b)), g2 = cagr(pendapatan(b), pendapatan(c), tahunAntara(b, c));
    if (g1 != null || g2 != null) L.push(["", "↗", `Output nominal (pendapatan) berkembang <b>${peratus(g1)}</b> setahun 2015–2023 dan <b>${peratus(g2)}</b> setahun 2023–2026. ` +
      (ADA(g1) && ADA(g2) ? (g2 > g1 ? "Momentum pertumbuhan meningkat selepas 2023." : "Momentum pertumbuhan menyederhana selepas 2023.") : "")]);
    const pv1 = vaPekerja(a), pv3 = vaPekerja(c), gp1 = gajiPekerja(a), gp3 = gajiPekerja(c);
    if (ADA(pv1) && ADA(pv3)) L.push(["", "⚙", `Produktiviti (VA per pekerja) berubah daripada RM${fmtN.format(Math.round(pv1))} (2015) kepada RM${fmtN.format(Math.round(pv3))} (2026), kadar <b>${peratus(cagr(pv1, pv3, tahunAntara(a, c)))}</b> setahun. Anggaran kasar: VA dan pekerja dikira pada tapisan yang berlainan.`]);
    if (ADA(gp1) && ADA(gp3)) L.push(["", "₴", `Gaji purata per pekerja: RM${fmtN.format(Math.round(gp1))} (2015) → RM${fmtN.format(Math.round(gp3))} (2026), kadar <b>${peratus(cagr(gp1, gp3, tahunAntara(a, c)))}</b> setahun.`]);
    if (ADA(st[a].bawah) && ADA(s3.bawah)) L.push([s3.bawah < st[a].bawah ? "amaran" : "baik", "%", `Pertubuhan dengan IO &lt; 1 berubah daripada <b>${peratus(st[a].bawah)}</b> (2015) kepada <b>${peratus(s3.bawah)}</b> (2026).`]);
    if (ADA(rg[a].io) && ADA(r3.io)) L.push(["", "M", `Margin nilai tambah (VA ÷ output) ${peratus(st[a].marjin)} pada 2015 dan ${peratus(s3.marjin)} pada 2026.`]);
    if (s3.terpencil) L.push(["amaran", "!", `<b>${fmtN.format(s3.terpencil)}</b> pertubuhan IO 2026 berada di luar julat 1.5 × IQR. Semak dahulu sebelum membuat kesimpulan agregat.`]);
    const cov = (y) => D.pendapatan.n[y] || 0;
    const jumlah = R.length || 1;
    L.push(["", "n", `Perbandingan 3 tahun hanya guna rekod yang ada nilai bagi tahun berkenaan: 2015 (${fmtN.format(cov(a))}), 2023 (${fmtN.format(cov(b))}), 2026 (${fmtN.format(cov(c))}) daripada ${fmtN.format(jumlah)} rekod.` +
      (s3.n < 30 ? " <b>Sampel 2026 kecil</b>, tafsiran perlu dibuat dengan berhati-hati." : "")]);
    L.push(["", "$", "Semua nilai adalah nominal (RM). Kadar pertumbuhan belum ditolak inflasi; untuk kadar sebenar, tolak kadar IHP bagi tempoh yang sama."]);
    $("tafsiranTeks").innerHTML = L.map(([j, t, h]) => `<li><span class="tanda ${j}">${t}</span><span>${h}</span></li>`).join("");

    // Jadual statistik deskriptif
    const baris = [
      ["Output agregat (RM)", (y) => fmTiga(pendapatan(y), true), (x) => cagr(pendapatan(a), pendapatan(c), tahunAntara(a, c))],
      ["Input agregat (RM)", (y) => fmTiga(D.perbelanjaan.t[y], true), (x) => cagr(D.perbelanjaan.t[a], D.perbelanjaan.t[c], tahunAntara(a, c))],
      ["IO agregat", (y) => fmtIo(rg[y].io), null],
      ["IO median", (y) => fmtIo(st[y].median), null],
      ["IO kuartil (Q1 – Q3)", (y) => (ADA(st[y].q1) ? `${fmtIo(st[y].q1)} – ${fmtIo(st[y].q3)}` : "–"), null],
      ["Pekali variasi IO (CV)", (y) => peratus(st[y].cv), null],
      ["% pertubuhan IO < 1", (y) => peratus(st[y].bawah), null],
      ["Margin VA ÷ output", (y) => peratus(st[y].marjin), null],
      ["Nilai ditambah (RM)", (y) => fmTiga(rg[y].va, true), (x) => cagr(rg[a].va, rg[c].va, tahunAntara(a, c))],
      ["Bilangan pekerja", (y) => fmTiga(pekerja(y), false), (x) => cagr(pekerja(a), pekerja(c), tahunAntara(a, c))],
      ["VA per pekerja (RM)", (y) => fmTiga(vaPekerja(y), true), (x) => cagr(vaPekerja(a), vaPekerja(c), tahunAntara(a, c))],
      ["Gaji purata per pekerja (RM)", (y) => fmTiga(gajiPekerja(y), true), (x) => cagr(gajiPekerja(a), gajiPekerja(c), tahunAntara(a, c))],
      ["Bilangan rekod padan (IO)", (y) => fmtN.format(st[y].n), null],
    ];
    $("tStatistik").innerHTML = `<thead><tr><th>Metrik</th>${TAHUN_IO.map((y) => `<th class="num">${y}</th>`).join("")}<th class="num">CAGR 2015 → 2026</th></tr></thead><tbody>` +
      baris.map(([lab, f, g]) => `<tr><td><b>${lab}</b></td>${TAHUN_IO.map((y) => `<td class="num">${f(y)}</td>`).join("")}<td class="num">${g ? peratus(g()) : "–"}</td></tr>`).join("") + "</tbody>";
  }

  // Format YYYY-MM-DD ikut tarikh tempatan (toISOString guna UTC dan boleh tolak sehari di Malaysia)
  const tarikhIso = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

  // ---------- Peta ----------
  let GEO = null;
  const normNama = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/^\s*p\.?\s*\d{1,3}\s*[-–:.)]?\s*/, "")
    .replace(/^\s*\d+\s*[-–:.)]?\s*/, "")
    .replace(/wilayah persekutuan|w\.\s*p\.?|\bwp\b|\bdaerah\b|\bbahagian\b|\bjajahan\b|\bparlimen\b/g, "")
    .replace(/\bhulu\b/g, "ulu").replace(/\bpulau pinang\b/g, "pulaupinang").replace(/\bpenang\b/g, "pulaupinang")
    .replace(/\bmalacca\b/g, "melaka").replace(/[^a-z0-9]/g, "");
  async function muatGeo() {
    if (GEO) return GEO;
    const ambil = (f) => fetch("peta/" + f).then((r) => { if (!r.ok) throw new Error(f); return r.json(); });
    const [d, n, pr] = await Promise.all([ambil("daerah.json"), ambil("negeri.json"), ambil("parlimen.json")]);
    const idxD = new Map(), idxN = new Map(), kodD = new Map(), kodN = new Map(), idxP = new Map(), kodP = new Map();
    for (const f of d.features) {
      const p = f.properties;
      p.name = p.code_state + "_" + p.code_district; p.label = p.district;
      kodD.set(p.name, f);
      const k = normNama(p.district);
      if (!idxD.has(k)) idxD.set(k, []);
      idxD.get(k).push(f);
    }
    for (const f of n.features) {
      const p = f.properties;
      p.name = String(p.code_state); p.label = p.state;
      kodN.set(p.name, f); idxN.set(normNama(p.state), f);
    }
    for (const f of pr.features) {
      const p = f.properties;
      p.name = p.code_parlimen; p.label = p.parlimen;
      kodP.set(p.code_parlimen, f); idxP.set(normNama(p.parlimen), f);
    }
    GEO = { d, n, pr, idxD, idxN, kodD, kodN, idxP, kodP };
    return GEO;
  }
  function padanNegeri(v) {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2})\b/);
    if (m && GEO.kodN.has(String(+m[1]))) return GEO.kodN.get(String(+m[1]));
    const n = normNama(s.replace(/jabatan perangkaan( negeri)?/i, ""));
    return GEO.idxN.get(n) || null;
  }
  function padanDaerah(v, negeri) {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    const m = s.match(/^(\d{2})(\d{2})\b/);
    if (m && GEO.kodD.has(+m[1] + "_" + +m[2])) return GEO.kodD.get(+m[1] + "_" + +m[2]);
    const calon = GEO.idxD.get(normNama(s));
    if (calon && calon.length === 1) return calon[0];
    if (calon && calon.length > 1) {
      const fn = padanNegeri(negeri);
      if (fn) { const c = calon.find((f) => f.properties.code_state === fn.properties.code_state); if (c) return c; }
      return calon[0];
    }
    const nn = GEO.idxN.get(normNama(s));
    if (nn) { const c = GEO.d.features.filter((f) => f.properties.code_state === nn.properties.code_state); if (c.length === 1) return c[0]; }
    return null;
  }
  function padanParlimen(v) {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    const m = s.match(/^p\s*\.?\s*(\d{1,3})\b/i) || s.match(/^(\d{1,3})$/);
    if (m) { const k = "P." + String(+m[1]).padStart(3, "0"); if (GEO.kodP.has(k)) return GEO.kodP.get(k); }
    return GEO.idxP.get(normNama(s)) || null;
  }
  const lajurPeta = () => "parlimen";
  const kodKL = () => (GEO.n.features.find((f) => normNama(f.properties.state) === "kualalumpur") || { properties: {} }).properties.code_state;
  function nilaiUkuran(c) {
    const n = c._n || 1;
    return { selesai: (c.selesai / n) * 100, kadar: (c.siap / n) * 100, jumlah: c._n, belumSelesai: c._n - c.selesai, kodA: (c.KodA / n) * 100 }[S.petaUkuran];
  }
  const UKURAN_PETA = { selesai: ["% Selesai", true], kadar: ["Kadar respons", true], jumlah: ["Jumlah pertubuhan", false], belumSelesai: ["Belum selesai", false], kodA: ["Kod A (11 + LK)", true] };

  async function paparPeta(R) {
    const ch = carta("cPeta");
    try { await muatGeo(); } catch (e) { kosongkanCarta(ch, "Fail peta tidak dapat dimuatkan"); return; }
    if (S.hal !== "peta") return;
    if (!ADA_TAHAP() && S.petaUkuran === "selesai") { S.petaUkuran = "kadar"; $("pilihUkuranPeta").value = "kadar"; }
    const aras = S.petaAras;
    const lajur = lajurPeta();
    const KL = kodKL();
    // KL dipecahkan ikut parlimen jika data ada lajur Parlimen untuk kes KL
    const klParlimen = aras !== "negeri" && aras !== "parlimen" && R.some((r) => padanDaerahRekod(r, lajur)?.properties.code_state === KL && padanParlimen(r.parlimen));
    function padanDaerahRekod(r, l) { return padanDaerah(r[l], r.negeri); }
    const padan = new Map(), tak = new Map();
    for (const r of R) {
      const v = r[lajur];
      let f;
      if (aras === "negeri") f = padanNegeri(v);
      else if (aras === "parlimen") f = padanParlimen(v);
      else {
        f = padanDaerah(v, r.negeri);
        if (f && klParlimen && f.properties.code_state === KL) {
          const fp = padanParlimen(r.parlimen);
          if (!fp) { const k = "W.P. Kuala Lumpur (tiada Parlimen)"; tak.set(k, (tak.get(k) || []).concat([r])); continue; }
          f = fp;
        }
      }
      if (!f) { const k = v == null || v === "" ? KOSONG : String(v); tak.set(k, (tak.get(k) || []).concat([r])); continue; }
      const k = f.properties.name;
      if (!padan.has(k)) padan.set(k, { f, rs: [], mentah: new Set(), lajurTapis: f.properties.code_parlimen && aras !== "parlimen" ? "parlimen" : lajur });
      const o = padan.get(k); o.rs.push(r);
      o.mentah.add(String(o.lajurTapis === "parlimen" ? r.parlimen : (v == null || v === "" ? KOSONG : v)));
    }
    // Kawasan yang dilukis
    let ciri;
    const negeriAda = new Set([...padan.values()].map((o) => o.f.properties.code_state));
    if (aras === "negeri") ciri = GEO.n.features;
    else {
      if ([...negeriAda].some((k) => GEO.n.features.some((f) => f.properties.code_state === k && /kualalumpur|putrajaya/.test(normNama(f.properties.state))))) {
        const sel = GEO.n.features.find((f) => normNama(f.properties.state) === "selangor");
        if (sel) negeriAda.add(sel.properties.code_state);
      }
      const asas = aras === "parlimen" ? GEO.pr.features : GEO.d.features;
      ciri = negeriAda.size ? asas.filter((f) => negeriAda.has(f.properties.code_state)) : asas;
      if (klParlimen) ciri = ciri.filter((f) => f.properties.code_state !== KL).concat(GEO.pr.features.filter((f) => f.properties.code_state === KL));
    }
    const namaPeta = "peta_" + aras + "_" + (klParlimen ? "klp_" : "") + [...new Set(ciri.map((f) => f.properties.code_state))].sort().join("-");
    if (!echarts.getMap(namaPeta)) echarts.registerMap(namaPeta, { type: "FeatureCollection", features: ciri });
    const [labelUk, pct] = UKURAN_PETA[S.petaUkuran];
    const data = [...padan.entries()].map(([k, o]) => { const c = kiraKat(o.rs); return { name: k, value: Math.round(nilaiUkuran(c) * 10) / 10, c, mentah: [...o.mentah], lajurTapis: o.lajurTapis, label: o.f.properties.label }; });
    const nilai = data.map((d) => d.value);
    let min = nilai.length ? Math.min(...nilai) : 0, maks = nilai.length ? Math.max(...nilai) : 1;
    if (pct) { min = Math.max(0, Math.floor(min / 5) * 5); maks = Math.min(100, Math.ceil(maks / 5) * 5); } else min = 0;
    if (maks <= min) maks = min + 1;
    const labelDari = new Map(ciri.map((f) => [f.properties.name, f.properties.label]));
    const labelPendek = (s) => String(s || "").replace(/^W\.P\. /, "").replace(/^P\.\d{3} /, "");
    ch.setOption({
      ...asasTema(),
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => {
          const d = p.data;
          if (!d) return `<b>${esc(labelDari.get(p.name) || p.name)}</b><br><span style="color:${css("--muted")}">Tiada pertubuhan dalam tapisan</span>`;
          const c = d.c;
          return `<b>${esc(d.label)}</b><br>${labelUk}: <b>${pct ? d.value.toFixed(1) + "%" : fmtN.format(d.value)}</b><br>` +
            `Jumlah ${fmtN.format(c._n)} · Selesai ${fmtN.format(c.selesai)} (${fmtP(c.selesai / c._n)})<br>` +
            `SMD ${fmtN.format(c.T.SMD)} · Negeri ${fmtN.format(c.T.Negeri)} · Pinda ${fmtN.format(c.T.Pinda)} · Proses ${fmtN.format(c.T.Proses)}`;
        } },
      visualMap: { type: "continuous", min, max: maks, calculable: false, orient: "horizontal", left: 8, bottom: 6,
        itemWidth: 12, itemHeight: Math.max(90, Math.min(180, $("cPeta").clientWidth - 230)),
        text: [pct ? maks + "%" : fmtN.format(maks), (pct ? min + "%" : "0") + "  " + labelUk], textStyle: { color: css("--ink-2"), fontSize: 11.5 },
        inRange: { color: [css("--seq-1"), css("--seq-2"), css("--seq-3"), css("--seq-4"), css("--seq-5")] } },
      series: [{
        type: "map", map: namaPeta, roam: true, scaleLimit: { min: 0.8, max: 16 }, selectedMode: false,
        layoutCenter: ["50%", "48%"], layoutSize: "92%",
        itemStyle: { areaColor: css("--surface-2"), borderColor: css("--border-strong"), borderWidth: 0.8 },
        emphasis: { itemStyle: { areaColor: css("--gold") || "#c99a2e", borderColor: css("--ink"), borderWidth: 1.2 },
          label: { show: true, color: css("--ink"), fontWeight: 700, fontSize: 12 } },
        label: { show: ciri.length <= 45, color: css("--ink"), fontSize: 10.5, fontWeight: 600, textBorderColor: css("--surface"), textBorderWidth: 2.5,
          formatter: (p) => (p.data ? labelPendek(labelDari.get(p.name)) : "") },
        data,
      }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => {
      if (!p.data) return;
      S.petaLabelTapis = p.data.label;
      klikTapis(p.data.lajurTapis, p.data.mentah);
    });
    // Nota
    const takN = [...tak.values()].reduce((a, b) => a + b.length, 0);
    const namaAras = { lokasi: "daerah lokasi", pos: "daerah pos", parlimen: "parlimen", negeri: "negeri" }[aras];
    $("petaSub").textContent = "Ikut " + namaAras + (klParlimen ? " · W.P. Kuala Lumpur dipecah ikut parlimen" : "") + " · klik kawasan untuk tapis · tatal untuk zum";
    const adaKL = R.some((r) => aras !== "negeri" && aras !== "parlimen" && padanDaerah(r[lajur], r.negeri)?.properties.code_state === KL);
    let nota = takN ? `⚠ ${fmtN.format(takN)} pertubuhan (${fmtN.format(tak.size)} nilai) tidak dapat dipadankan dengan peta: ${[...tak.keys()].slice(0, 6).map(esc).join(", ")}${tak.size > 6 ? "…" : ""}. ` : "";
    if (aras === "parlimen" && !adaLajur("parlimen")) nota = "Data semasa tiada lajur <b>Parlimen</b>. Sertakan lajur Parlimen (cth. “P.117 Segambut”) dalam fail muat naik untuk peta ikut parlimen.";
    else if (adaKL && !klParlimen) nota += "W.P. Kuala Lumpur dipapar sebagai satu kawasan kerana data tiada lajur <b>Parlimen</b> untuk kes KL. Sertakan lajur Parlimen untuk pecahan 11 parlimen KL.";
    $("petaNota").innerHTML = nota || "Sumber sempadan: OpenDOSM.";
    // Jadual kedudukan
    const baris = data.map((d) => [d.label, d.c, d.mentah, true, d.lajurTapis]).concat([...tak.entries()].map(([k, rs]) => [k, kiraKat(rs), [k], false, lajur]));
    baris.sort((a, b) => nilaiUkuran(b[1]) - nilaiUkuran(a[1]) || b[1]._n - a[1]._n);
    $("kedudukanSub").textContent = "Disusun ikut " + labelUk.toLowerCase() + " · " + fmtN.format(baris.length) + " kawasan";
    $("tKedudukan").className = "jadual jadual-padat";
    $("tKedudukan").innerHTML = `<thead><tr><th>#</th><th>${{ negeri: "Negeri", parlimen: "Parlimen" }[aras] || "Daerah"}</th><th class="num">Pertubuhan</th><th>${esc(labelUk)}</th></tr></thead><tbody>` +
      baris.map(([l, c, mentah, ok, lt], i) => {
        const v = nilaiUkuran(c);
        const lebar = pct ? v : (v / Math.max(1, ...baris.map((b) => nilaiUkuran(b[1])))) * 100;
        return `<tr data-mentah="${esc(JSON.stringify(mentah))}" data-lajur="${esc(lt)}" data-label="${esc(l)}" style="cursor:pointer">` +
          `<td class="num">${i + 1}</td><td>${esc(l)}${ok ? "" : ' <span class="nota" title="Tiada di peta">⚠</span>'}</td><td class="num">${fmtN.format(c._n)}</td>` +
          `<td><span class="bar-mini"><i style="width:${lebar}%"></i></span>${pct ? v.toFixed(1) + "%" : fmtN.format(v)}</td></tr>`;
      }).join("") + "</tbody>";
  }

  // ---------- Donut kategori respon ----------
  function cartaDonut(R) {
    const k = kiraKat(R), n = k._n || 1;
    const ada = KATEGORI.filter((c) => k[c.k]);
    const ch = carta("cDonut");
    ch.setOption({
      ...asasTema(),
      tooltip: { ...tooltipAsas(), trigger: "item", formatter: (p) => `${tanda(p.color)}<b>${esc(p.name)}</b><br>${fmtN.format(p.value)} pertubuhan · ${fmtP(p.value / n)}` },
      legend: { bottom: 0, left: "center", itemWidth: 10, itemHeight: 10, itemGap: 10, textStyle: { color: css("--ink-2"), fontSize: 11 } },
      title: { text: fmtN.format(k._n), subtext: "pertubuhan", left: "center", top: "34%",
        textStyle: { color: css("--ink"), fontSize: 22, fontWeight: 800 }, subtextStyle: { color: css("--muted"), fontSize: 11 } },
      series: [{
        type: "pie", radius: ["48%", "80%"], center: ["50%", "42%"], avoidLabelOverlap: true,
        itemStyle: { borderColor: css("--surface"), borderWidth: 2, borderRadius: 4 },
        label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 14,
          formatter: (p) => (p.percent >= 6 ? `${(KATEGORI.find((c) => c.label === p.name) || {}).pendek || ""}\n${p.percent.toFixed(1)}%` : "") },
        labelLine: { show: false },
        data: ada.map((c) => ({ name: c.label, value: k[c.k], itemStyle: { color: css(c.warna) } })),
      }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => { const c = KATEGORI.find((x) => x.label === p.name); if (c) klikTapis("_kat", c.k); });
  }

  // ---------- Input-Output & VA ----------
  // IO = perbelanjaan (input) ÷ pendapatan (output). VA diambil dari lajur VA jika ada; jika tiada = output − input (anggaran).
  const TAHUN_IO = ["2015", "2023", "2026"];
  const GANTI_TAHUN = { "2026": "semasa", "2023": "sebelum" };   // andaian jika lajur tahun tiada
  let sumberIo = {};
  function sediaSumberIo() {
    sumberIo = {};
    for (const y of TAHUN_IO) {
      const ada = adaLajur("pendapatan_" + y) || adaLajur("perbelanjaan_" + y) || adaLajur("va_" + y);
      sumberIo[y] = ada ? "lajur" : GANTI_TAHUN[y] && (adaLajur("pendapatan_" + GANTI_TAHUN[y]) || adaLajur("perbelanjaan_" + GANTI_TAHUN[y])) ? GANTI_TAHUN[y] : null;
      sumberIo[y + "va"] = adaLajur("va_" + y);
    }
  }
  function nilaiIo(r, y) {
    const sb = sumberIo[y];
    if (!sb) return null;
    const out = sb === "lajur" ? r["pendapatan_" + y] : r["pendapatan_" + sb];
    const inp = sb === "lajur" ? r["perbelanjaan_" + y] : r["perbelanjaan_" + sb];
    let va = sumberIo[y + "va"] ? r["va_" + y] : null;
    if (va == null && out != null && inp != null) va = out - inp;
    const io = out > 0 && inp != null ? inp / out : null;
    return { out, inp, va, io };
  }
  const fmtIo = (x) => (x == null || !isFinite(x) ? "–" : x.toFixed(2));
  const kelasIo = (x) => (x != null && isFinite(x) && x < 1 ? "io-merah" : "");
  function ringkasIo(R, y) {
    let so = 0, si = 0, sva = 0, n = 0, nva = 0, bawah = 0;
    const ios = [];
    for (const r of R) {
      const v = nilaiIo(r, y);
      if (!v) continue;
      if (v.io != null) { so += v.out; si += v.inp; n++; ios.push(v.io); if (v.io < 1) bawah++; }
      if (v.va != null) { sva += v.va; nva++; }
    }
    return { io: so > 0 ? si / so : null, median: median(ios), n, bawah, va: nva ? sva : null, nva, out: so, inp: si };
  }
  function paparIo(R) {
    sediaSumberIo();
    const ada = TAHUN_IO.filter((y) => sumberIo[y]);
    const nota = TAHUN_IO.map((y) => sumberIo[y] === "lajur" ? `${y}: lajur ${y}` : sumberIo[y] ? `${y}: <b>andaian</b> = Survei ${sumberIo[y] === "semasa" ? "Semasa" : "Sebelum"}` : `${y}: tiada data`).join(" · ");
    $("ioNota").innerHTML = `Sumber nilai — ${nota}. VA = lajur VA jika ada, jika tiada dianggarkan sebagai output − input. Hanya pertubuhan dengan pendapatan &gt; 0 dikira dalam IO.`;
    const S3 = Object.fromEntries(TAHUN_IO.map((y) => [y, ringkasIo(R, y)]));
    $("ioKpi").innerHTML = TAHUN_IO.map((y) => {
      const s3 = S3[y];
      if (!sumberIo[y] || !s3.n) return `<div class="io-kad"><h3>${y}</h3><div class="io-utama" style="color:var(--muted)">–</div><p class="nota">Tiada data ${y}. Sertakan lajur cth. “Pendapatan ${y}”, “Perbelanjaan ${y}”, “VA ${y}”.</p></div>`;
      return `<div class="io-kad"><h3>${y}${sumberIo[y] !== "lajur" ? " · andaian" : ""}</h3>
        <div class="io-utama ${kelasIo(s3.io)}">${fmtIo(s3.io)}</div><p class="nota" style="margin:0 0 6px">IO agregat (input ÷ output)</p>
        <div class="io-baris"><span>Median IO</span><b class="${kelasIo(s3.median)}">${fmtIo(s3.median)}</b></div>
        <div class="io-baris"><span>Pertubuhan IO &lt; 1</span><b>${fmtN.format(s3.bawah)} / ${fmtN.format(s3.n)} (${fmtP(s3.bawah / s3.n)})</b></div>
        <div class="io-baris"><span>Jumlah VA</span><b>${ringkas(s3.va, true)}</b></div>
        <div class="io-baris"><span>Output · Input</span><b>${ringkas(s3.out, true)} · ${ringkas(s3.inp, true)}</b></div></div>`;
    }).join("");
    // Carta IO & VA ikut tahun
    const chIo = carta("cIoTahun");
    if (!ada.length) kosongkanCarta(chIo, "Tiada data input/output");
    else chIo.setOption({
      ...asasTema(),
      grid: { left: 4, right: 16, top: 24, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (ps) => { const y = ps[0].name, x = S3[y]; return `<b>${y}</b><br>IO agregat: <b>${fmtIo(x.io)}</b><br>Median IO: ${fmtIo(x.median)}<br>${fmtN.format(x.n)} pertubuhan`; } },
      xAxis: { type: "category", data: ada, ...paksi(), splitLine: { show: false } },
      yAxis: { type: "value", ...paksi() },
      series: [{ type: "bar", barMaxWidth: 46,
        data: ada.map((y) => ({ value: S3[y].io == null ? null : +S3[y].io.toFixed(3), itemStyle: { color: S3[y].io < 1 ? css("--bad") : css("--s1"), borderRadius: [6, 6, 0, 0] } })),
        label: { show: true, position: "top", color: css("--ink"), fontWeight: 700, formatter: (p) => fmtIo(p.value) },
        markLine: { symbol: "none", silent: true, lineStyle: { color: css("--muted"), type: "dashed", width: 1.5 }, label: { formatter: "1.0", color: css("--muted") }, data: [{ yAxis: 1 }] } }],
    }, true);
    const chVa = carta("cVaTahun");
    const adaVa = TAHUN_IO.filter((y) => S3[y].va != null);
    if (!adaVa.length) kosongkanCarta(chVa, "Tiada data VA");
    else chVa.setOption({
      ...asasTema(),
      grid: { left: 4, right: 16, top: 24, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (ps) => { const y = ps[0].name, x = S3[y]; return `<b>${y}</b><br>Jumlah VA: <b>${ringkas(x.va, true)}</b><br>${fmtN.format(x.nva)} pertubuhan`; } },
      xAxis: { type: "category", data: adaVa, ...paksi(), splitLine: { show: false } },
      yAxis: { type: "value", ...paksi(), axisLabel: { ...paksi().axisLabel, formatter: (v) => ringkas(v, false) } },
      series: [{ type: "bar", barMaxWidth: 46, data: adaVa.map((y) => S3[y].va),
        itemStyle: { color: css("--s3"), borderRadius: [6, 6, 0, 0] },
        label: { show: true, position: "top", color: css("--ink"), fontWeight: 700, formatter: (p) => ringkas(p.value, true) } }],
    }, true);
    // Jadual ikut kumpulan
    const d = $("pilihDimIo").value || "fasa_be";
    const g = [...kumpulKat(R, (r) => nilaiDim(r, d)).entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 60);
    const T = R;
    const sel = (rs) => TAHUN_IO.map((y) => { const x = ringkasIo(rs, y); return `<td class="num ${kelasIo(x.io)}">${fmtIo(x.io)}</td><td class="num">${ringkas(x.va, true)}</td>`; }).join("");
    $("tIoKumpulan").innerHTML = `<thead><tr><th rowspan="2">${esc((DIMENSI_IO.find((x) => x[0] === d) || [d, d])[1])}</th><th rowspan="2" class="num">Pertubuhan</th>` +
      TAHUN_IO.map((y) => `<th colspan="2" class="num">${y}</th>`).join("") + `</tr><tr>` + TAHUN_IO.map(() => `<th class="num">IO</th><th class="num">VA</th>`).join("") + `</tr></thead><tbody>` +
      g.map(([v, rs]) => `<tr><td><b>${esc(v)}</b></td><td class="num">${fmtN.format(rs.length)}</td>${sel(rs)}</tr>`).join("") +
      `<tr class="jumlah"><td>Jumlah</td><td class="num">${fmtN.format(T.length)}</td>${sel(T)}</tr></tbody>`;
    paparSenaraiIo(R);
  }
  const DIMENSI_IO = [["fasa_be", "Fasa BE"], ["tier", "Tier"], ["sektor", "Sektor"], ["subsektor", "Subsektor"], ["pegawai_kerja_luar", "Pegawai Kerja Luar"], ["parlimen", "Parlimen"], ["_kat", "Kategori Respon"], ["_tahap", "Tahap Pencapaian"]];
  let ioHal = 0, ioSemasa = [];
  function paparSenaraiIo(R) {
    const q = ($("ioCari").value || "").trim().toLowerCase();
    const hanya = $("ioBawah1").checked;
    let x = R.map((r) => ({ r, v: Object.fromEntries(TAHUN_IO.map((y) => [y, nilaiIo(r, y)])) }))
      .filter((o) => TAHUN_IO.some((y) => o.v[y] && (o.v[y].io != null || o.v[y].va != null)));
    if (q) x = x.filter((o) => [o.r.no_siri, o.r.nama].some((s) => s && String(s).toLowerCase().includes(q)));
    if (hanya) x = x.filter((o) => TAHUN_IO.some((y) => o.v[y] && o.v[y].io != null && o.v[y].io < 1));
    ioSemasa = x;
    const SAIZ = 50, maks = Math.max(0, Math.ceil(x.length / SAIZ) - 1);
    ioHal = Math.min(ioHal, maks);
    const hal = x.slice(ioHal * SAIZ, (ioHal + 1) * SAIZ);
    const ubah = (a, b) => (a != null && b != null && a !== 0 ? (b - a) / Math.abs(a) : null);
    $("tIo").innerHTML = `<thead><tr><th>No. Siri</th><th>Nama</th>` + TAHUN_IO.map((y) => `<th class="num">IO ${y}</th>`).join("") +
      TAHUN_IO.map((y) => `<th class="num">VA ${y}</th>`).join("") + `<th class="num">Δ VA 2023→2026</th></tr></thead><tbody>` +
      (hal.map((o) => {
        const d = ubah(o.v["2023"]?.va, o.v["2026"]?.va);
        return `<tr data-id="${o.r.id}"><td>${esc(o.r.no_siri)}</td><td class="nama" title="${esc(o.r.nama)}">${esc(o.r.nama)}</td>` +
          TAHUN_IO.map((y) => `<td class="num ${kelasIo(o.v[y]?.io)}">${fmtIo(o.v[y]?.io)}</td>`).join("") +
          TAHUN_IO.map((y) => `<td class="num">${ringkas(o.v[y]?.va, true)}</td>`).join("") +
          `<td class="num ${d == null ? "" : d >= 0 ? "naik" : "turun"}">${d == null ? "–" : (d >= 0 ? "▲ " : "▼ ") + fmtP(Math.abs(d))}</td></tr>`;
      }).join("") || `<tr><td colspan="9" class="nota">Tiada pertubuhan dengan data input/output.</td></tr>`) + "</tbody>";
    $("ioBil").textContent = "(" + fmtN.format(x.length) + ")";
    $("ioHal").textContent = x.length ? `${ioHal * SAIZ + 1}–${Math.min(x.length, (ioHal + 1) * SAIZ)} / ${fmtN.format(x.length)}` : "";
    $("ioSebelum").disabled = ioHal <= 0;
    $("ioSelepas").disabled = ioHal >= maks;
  }
  function eksportIo() {
    const kepala = ["No. Siri", "Nama"].concat(TAHUN_IO.flatMap((y) => [`Output ${y}`, `Input ${y}`, `IO ${y}`, `VA ${y}`]));
    unduh("input-output-" + new Date().toISOString().slice(0, 10) + ".csv", [kepala].concat(ioSemasa.map((o) =>
      [o.r.no_siri, o.r.nama].concat(TAHUN_IO.flatMap((y) => { const v = o.v[y] || {}; return [v.out ?? "", v.inp ?? "", v.io == null ? "" : v.io.toFixed(4), v.va ?? ""]; })))));
  }

  // ---------- Perbandingan 3 tahun (2015 · 2023 · 2026) ----------
  const TAHUN3 = ["2015", "2023", "2026"];
  const VAR3 = [["pendapatan", "Pendapatan", true], ["perbelanjaan", "Perbelanjaan", true], ["gaji", "Gaji / upah", true], ["pekerja", "Bilangan pekerja", false], ["harta_tetap", "Harta tetap", true]];
  const WARNA_TAHUN = { "2015": "--s0", "2023": "--s1", "2026": "--s3" };
  let tigaCache = null;
  // Lajur tahun jika ada; jika tiada, guna Survei Sebelum (2023) / Survei Semasa (2026) sebagai andaian
  function lajurTiga(k, y) {
    if (adaLajur(`${k}_${y}`)) return `${k}_${y}`;
    const alt = y === "2023" ? "sebelum" : y === "2026" ? "semasa" : null;
    if (alt && adaLajur(`${k}_${alt}`)) return `${k}_${alt}`;
    return null;
  }
  const nombor = (v) => (v == null || v === "" || !isFinite(+v) ? null : +v);
  function dataTiga(R) {
    const out = {};
    for (const [k, label, rm] of VAR3) {
      const col = Object.fromEntries(TAHUN3.map((y) => [y, lajurTiga(k, y)]));
      const andaian = Object.fromEntries(TAHUN3.map((y) => [y, col[y] && !col[y].startsWith(`${k}_${y}`) ? (y === "2023" ? "Survei Sebelum" : "Survei Semasa") : null]));
      const t = {}, n = {};
      for (const y of TAHUN3) {
        t[y] = null; n[y] = 0;
        if (!col[y]) continue;
        let s = 0;
        for (const r of R) { const v = nombor(r[col[y]]); if (v != null) { s += v; n[y]++; } }
        t[y] = n[y] ? s : null;
      }
      // Perubahan dikira pada rekod yang ada nilai bagi kedua-dua tahun (perbandingan adil)
      const pasang = (y1, y2) => {
        if (!col[y1] || !col[y2]) return null;
        let a = 0, b = 0, c = 0;
        for (const r of R) {
          const x = nombor(r[col[y1]]), z = nombor(r[col[y2]]);
          if (x != null && z != null) { a += x; b += z; c++; }
        }
        return c && a ? { pct: b / a - 1, n: c } : null;
      };
      out[k] = { label, rm, col, andaian, t, n, d1523: pasang("2015", "2023"), d2326: pasang("2023", "2026"), d1526: pasang("2015", "2026") };
    }
    return out;
  }
  const fmTiga = (v, rm) => (v == null || !isFinite(v) ? "–" : rm ? ringkas(v, true) : fmtN.format(Math.round(v)));
  const dpTiga = (a, b) => (a == null || b == null || !b ? "–" : `${a >= b ? "▲" : "▼"} ${fmtP(Math.abs(a / b - 1))}`);
  const chipTiga = (lab, d) => `<span class="chip ${d ? (d.pct >= 0 ? "chip-naik" : "chip-turun") : ""}">${lab} ${d ? (d.pct >= 0 ? "▲" : "▼") + " " + fmtP(Math.abs(d.pct)) : "–"}</span>`;
  const pctTiga = (d) => (d == null ? "–" : `<span class="${d.pct >= 0 ? "naik" : "turun"}">${d.pct >= 0 ? "▲ " : "▼ "}${fmtP(Math.abs(d.pct))}</span>`);

  function paparTiga(R) {
    const D = (tigaCache = dataTiga(R));
    const ada = VAR3.filter(([k]) => TAHUN3.some((y) => D[k].t[y] != null));
    const sumber = TAHUN3.map((y) => {
      const kurang = VAR3.filter(([k]) => D[k].t[y] == null).map(([, l]) => l);
      const guna = VAR3.filter(([k]) => D[k].andaian[y]).map(([, l]) => l);
      return `<b>${y}</b>${kurang.length ? " tiada: " + kurang.join(", ") : " lengkap"}${guna.length ? " · andaian " + VAR3.filter(([k]) => D[k].andaian[y]).map(([k]) => D[k].andaian[y]).filter((v, i, a) => a.indexOf(v) === i).join("/") : ""}`;
    }).join(" · ");
    $("tigaNota").innerHTML = ada.length ? sumber + ". Perubahan (%) dikira pada rekod yang ada nilai bagi kedua-dua tahun." : "Tiada data 2015, 2023 atau 2026 dalam tapisan ini. Sertakan lajur seperti <i>Gaji 2015</i>, <i>Pekerja 2023</i>, <i>Harta Tetap 2026</i>.";

    // Jadual ringkasan
    $("tTiga").innerHTML = `<thead><tr><th>Pemboleh ubah</th><th class="num">2015</th><th class="num">2023</th><th class="num">2026</th>` +
      `<th class="num">2015 → 2023</th><th class="num">2023 → 2026</th><th class="num">2015 → 2026</th><th class="num">Rekod padan</th></tr></thead><tbody>` +
      ada.map(([k, label, rm]) => {
        const d = D[k];
        return `<tr><td><b>${label}</b></td>${TAHUN3.map((y) => `<td class="num">${fmTiga(d.t[y], rm)}</td>`).join("")}` +
          `<td class="num">${pctTiga(d.d1523)}</td><td class="num">${pctTiga(d.d2326)}</td><td class="num">${pctTiga(d.d1526)}</td>` +
          `<td class="num">${d.d1526 ? fmtN.format(d.d1526.n) : "–"}</td></tr>`;
      }).join("") + `</tbody>`;

    // Kad per pemboleh ubah
    $("tigaKad").innerHTML = ada.map(([k, label, rm]) => {
      const d = D[k];
      const vals = TAHUN3.map((y) => d.t[y]).filter((v) => v != null);
      const mx = Math.max(1, ...vals);
      return `<div class="tiga-kad"><div class="tiga-tajuk">${label}</div><div class="tiga-bars">` +
        TAHUN3.map((y) => {
          const v = d.t[y];
          const h = v == null ? 4 : Math.max(6, Math.round((v / mx) * 110));
          return `<div class="tiga-bar"><span class="tiga-nilai">${v == null ? "–" : rm ? ringkas(v, false) : fmtN.format(Math.round(v))}</span>` +
            `<i style="height:${h}px;background:${v == null ? "var(--grid)" : css(WARNA_TAHUN[y])}"></i><b>${y}</b></div>`;
        }).join("") +
        `</div><div class="tiga-chips">${chipTiga("15→23", d.d1523)}${chipTiga("23→26", d.d2326)}</div></div>`;
    }).join("") || '<p class="nota">Tiada data.</p>';

    // Carta indeks (2015 = 100)
    const ch = carta("cIndeks");
    const siri = ada.filter(([k]) => D[k].t["2015"] != null).map(([k, label]) => {
      const b = D[k].t["2015"];
      return { name: label, type: "line", smooth: 0.25, symbol: "circle", symbolSize: 9, connectNulls: true,
        lineStyle: { width: 2.8 }, data: TAHUN3.map((y) => (D[k].t[y] == null ? null : +((D[k].t[y] / b) * 100).toFixed(1))),
        label: { show: true, position: "top", fontSize: 11.5, fontWeight: 700, color: css("--ink"), formatter: (p) => (p.dataIndex === TAHUN3.length - 1 && p.value != null ? p.value : "") } };
    });
    if (!siri.length) kosongkanCarta(ch, "Perlu data 2015 untuk indeks");
    else ch.setOption({
      ...asasTema(),
      color: ["--s1", "--s3", "--s7", "--s4", "--s5"].map(css),
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: css("--ink-2"), fontSize: 11.5 } },
      grid: { left: 8, right: 20, top: 24, bottom: 40, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", formatter: (ps) => `<b>${ps[0].axisValue}</b><br>` + ps.map((p) => `${tanda(p.color)}${esc(p.seriesName)}: <b>${p.value == null ? "–" : p.value}</b>`).join("<br>") },
      xAxis: { type: "category", data: TAHUN3, boundaryGap: false, ...paksi(), splitLine: { show: false } },
      yAxis: { type: "value", scale: true, ...paksi() },
      series: siri,
    }, true);
    paparKawal();
    paparTigaRekod(R);
  }

  // ---------- Perbandingan 3 tahun setiap pertubuhan ----------
  let tigaHalRek = 0, tigaQ = "", tigaSenarai = [];
  function paparTigaRekod(R) {
    const D = tigaCache || {};
    const q = tigaQ.trim().toLowerCase();
    let x = R.filter((r) => VAR3.some(([k]) => TAHUN3.some((y) => D[k] && D[k].col[y] && nombor(r[D[k].col[y]]) != null)));
    if (q) x = x.filter((r) => [r.no_siri, r.nama, r[FE_KEY]].some((v) => v && String(v).toLowerCase().includes(q)));
    tigaSenarai = x;
    const SAIZ = 50, maks = Math.max(0, Math.ceil(x.length / SAIZ) - 1);
    tigaHalRek = Math.min(tigaHalRek, maks);
    const hal = x.slice(tigaHalRek * SAIZ, (tigaHalRek + 1) * SAIZ);
    const val = (r, k, y, rm) => { const c = D[k] && D[k].col[y]; const v = c ? nombor(r[c]) : null; return v == null ? "–" : rm ? ringkas(v, false) : fmtN.format(Math.round(v)); };
    const dlt = (r, k) => { const d = D[k]; if (!d || !d.col["2015"] || !d.col["2026"]) return null; const a = nombor(r[d.col["2015"]]), b = nombor(r[d.col["2026"]]); return a && b != null ? b / a - 1 : null; };
    const chip = (v) => (v == null ? "–" : `<span class="chip ${v >= 0 ? "chip-naik" : "chip-turun"}">${v >= 0 ? "▲" : "▼"} ${fmtP(Math.abs(v))}</span>`);
    $("tTigaRekod").innerHTML = `<thead><tr><th>No. Siri</th><th>Nama</th><th>FE</th>` +
      VAR3.map(([k, label]) => `<th class="num">${label}<br><span class="nota">2015 · 2023 · 2026</span></th><th>Δ 15→26</th>`).join("") +
      `</tr></thead><tbody>` + hal.map((r) => `<tr data-id="${r.id}"><td>${esc(r.no_siri)}</td><td class="nama" title="${esc(r.nama)}">${esc(r.nama)}</td><td>${esc(r[FE_KEY] || "–")}</td>` +
        VAR3.map(([k, , rm]) => `<td class="num"><span class="tr3">${TAHUN3.map((y) => val(r, k, y, rm)).join(" <i>·</i> ")}</span></td><td>${chip(dlt(r, k))}</td>`).join("") +
        `</tr>`).join("") + (hal.length ? "" : `<tr><td colspan="${3 + VAR3.length * 2}" class="nota">Tiada pertubuhan dengan data 2015/2023/2026.</td></tr>`) + `</tbody>`;
    $("tigaRekodSub").textContent = `${fmtN.format(x.length)} pertubuhan · klik baris untuk butiran · Δ = perubahan 2015 → 2026`;
    $("tigaHal").textContent = x.length ? `${tigaHalRek * SAIZ + 1}–${Math.min(x.length, (tigaHalRek + 1) * SAIZ)} / ${fmtN.format(x.length)}` : "";
    $("tigaSebelum").disabled = tigaHalRek <= 0;
    $("tigaSelepas").disabled = tigaHalRek >= maks;
  }
  function eksportTiga() {
    const D = tigaCache || {};
    const kepala = ["No. Siri", "Nama", "FE"].concat(VAR3.flatMap(([, l]) => TAHUN3.map((y) => `${l} ${y}`)));
    const baris = tigaSenarai.map((r) => [r.no_siri, r.nama, r[FE_KEY] || ""].concat(VAR3.flatMap(([k]) => TAHUN3.map((y) => { const c = D[k] && D[k].col[y]; return c ? (r[c] ?? "") : ""; }))));
    unduh("perbandingan-3-tahun-" + new Date().toISOString().slice(0, 10) + ".csv", [kepala].concat(baris));
  }

  // Kawal anggaran: laras 2026 (−30% hingga +30%), kesan dikira serta-merta
  function paparKawal() {
    const D = tigaCache || {};
    const rows = VAR3.filter(([k]) => D[k]).map(([k, label, rm]) => {
      const d = D[k];
      const b26 = d.t["2026"], L = S.tigaLaras[k] || 0;
      const dil = b26 == null ? null : b26 * (1 + L / 100);
      return `<div class="laras-baris" data-k="${k}">` +
        `<div class="laras-atas"><b>${label}</b><span class="laras-pct">${L >= 0 ? "+" : ""}${L}%</span></div>` +
        `<input type="range" min="-30" max="30" step="1" value="${L}" data-k="${k}"${b26 == null ? " disabled" : ""} aria-label="Laras ${esc(label)} 2026">` +
        `<div class="laras-info"><span>2026 asal <b>${fmTiga(b26, rm)}</b></span><span>Dilaras <b data-out="dil">${fmTiga(dil, rm)}</b></span></div>` +
        `<div class="laras-info"><span>vs 2023 <b data-out="d23">${dpTiga(dil, d.t["2023"])}</b></span><span>vs 2015 <b data-out="d15">${dpTiga(dil, d.t["2015"])}</b></span></div>` +
        `</div>`;
    });
    $("tigaKawal").innerHTML = rows.join("") || '<p class="nota">Tiada data 2026 untuk dilaraskan.</p>';
  }
  function kemaskiniKawal(k) {
    const d = tigaCache && tigaCache[k];
    const row = document.querySelector(`.laras-baris[data-k="${k}"]`);
    if (!d || !row) return;
    const L = S.tigaLaras[k] || 0;
    const b26 = d.t["2026"];
    const dil = b26 == null ? null : b26 * (1 + L / 100);
    row.querySelector(".laras-pct").textContent = `${L >= 0 ? "+" : ""}${L}%`;
    row.querySelector('[data-out="dil"]').textContent = fmTiga(dil, d.rm);
    row.querySelector('[data-out="d23"]').textContent = dpTiga(dil, d.t["2023"]);
    row.querySelector('[data-out="d15"]').textContent = dpTiga(dil, d.t["2015"]);
  }

  // ---------- Prestasi ----------
  function statusSasaran(p) {
    const sas = S.sasaran;
    if (!sas) return "";
    if (p * 100 >= sas) return '<span class="pil capai">✓ Capai</span>';
    if (p * 100 >= sas - 10) return '<span class="pil hampir">Hampir</span>';
    return '<span class="pil jauh">Bawah sasaran</span>';
  }
  function cartaDimensi(R) {
    const d = S.dimensi;
    const tahapMod = S.ukurPrestasi === "tahap" && ADA_TAHAP();
    const senarai = tahapMod ? TAHAP : KATEGORI;
    const kunci = tahapMod ? "_tahap" : "_kat";
    const kumpul = new Map();
    for (const r of R) {
      const v = nilaiDim(r, d);
      if (!kumpul.has(v)) kumpul.set(v, Object.fromEntries(senarai.map((c) => [c.k, 0])));
      kumpul.get(v)[r[kunci]]++;
    }
    const jumlah = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    const capaiO = (o) => (tahapMod ? o.Selesai : jumlah(o) - o.Belum);
    const peratus = (o) => capaiO(o) / jumlah(o);
    let baris = [...kumpul.entries()].sort((a, b) => jumlah(b[1]) - jumlah(a[1])).slice(0, 30);
    if (S.peratus) baris.sort((a, b) => peratus(b[1]) - peratus(a[1]));
    baris.reverse();
    const kat = senarai.filter((c) => baris.some(([, o]) => o[c.k]));
    const pc = S.peratus, sas = S.sasaran;
    const el = $("cDimensi");
    const sempit = el.clientWidth < 640;
    const atas = sempit ? 84 : 40;
    el.style.height = Math.max(260, baris.length * 30 + atas + 40) + "px";
    const ch = carta("cDimensi");
    ch.resize();
    const nmCapai = tahapMod ? "Selesai" : "Ada respon";
    ch.setOption({
      ...asasTema(),
      legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { color: css("--ink-2"), fontSize: 11.5 } },
      grid: { left: 4, right: 70, top: atas, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: css("--accent-soft") } },
        formatter: (ps) => {
          const o = kumpul.get(ps[0].name); const t = jumlah(o); const c = capaiO(o);
          return `<b>${esc(ps[0].name)}</b><br>Jumlah ${fmtN.format(t)} · ${nmCapai} <b>${fmtN.format(c)}</b> (${fmtP(c / t)})<br>` +
            (sas ? (c / t * 100 >= sas ? `<span style="color:${css("--good")}">✓ Capai sasaran ${sas}%</span>` : `Baki ke sasaran ${sas}%: <b>${fmtN.format(Math.max(0, Math.ceil(sas / 100 * t) - c))}</b>`) + "<br>" : "") +
            senarai.filter((x) => o[x.k]).map((x) => `${tanda(css(x.warna))}${esc(x.label)}: ${fmtN.format(o[x.k])} (${fmtP(o[x.k] / t)})`).join("<br>");
        } },
      xAxis: { type: "value", ...paksi(), max: pc ? 100 : null, axisLabel: { ...paksi().axisLabel, formatter: pc ? "{value}%" : null } },
      yAxis: { type: "category", data: baris.map((b) => b[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--ink-2"), fontSize: 12, width: 170, overflow: "truncate", fontWeight: 500 } },
      series: kat.map((c, i) => ({
        name: c.label, type: "bar", stack: "s", barMaxWidth: 20,
        itemStyle: { color: css(c.warna), borderColor: css("--surface"), borderWidth: 1.5,
          borderRadius: i === kat.length - 1 ? [0, 5, 5, 0] : i === 0 ? [5, 0, 0, 5] : 0 },
        emphasis: { focus: "series" },
        data: baris.map(([, o]) => (pc ? Math.round((o[c.k] / jumlah(o)) * 1000) / 10 : o[c.k])),
        markLine: i === 0 && pc && sas ? { symbol: "none", silent: true, lineStyle: { color: css("--bad"), type: "dashed", width: 2 },
          label: { formatter: "Sasaran " + sas + "%", color: css("--bad"), fontSize: 11, fontWeight: 700, position: "end" }, data: [{ xAxis: sas }] } : undefined,
        label: i === kat.length - 1 ? { show: true, position: "right", color: css("--ink"), fontSize: 12, fontWeight: 700,
          formatter: (p) => fmtP(peratus(kumpul.get(p.name))) } : undefined,
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis(d, p.name));
  }
  // ---------- Paparan FE: kad & kuadran ----------
  const FE_KEY = "pegawai_kerja_luar";
  function dataFe(R) {
    const m = kumpulKat(R, (r) => (r[FE_KEY] == null || r[FE_KEY] === "" ? null : String(r[FE_KEY])));
    return [...m.entries()].map(([nama, rs]) => {
      const c = kiraKat(rs);
      return { nama, c, n: c._n, p: capai(c) / (c._n || 1) };
    }).sort((a, b) => b.p - a.p || b.n - a.n);
  }
  function paparKadFe(R) {
    const el = $("kadFe");
    const senarai = dataFe(R);
    if (!senarai.length) { el.innerHTML = '<p class="nota">Tiada lajur Pegawai Kerja Luar dalam data.</p>'; return; }
    const T = kiraKat(R), n = T._n || 1;
    const tahapMod = ukurUtama() === "selesai";
    const nm = tahapMod ? "Selesai" : "Siap";
    const siap = capai(T), pSiap = siap / n, baki = n - siap;
    const tarikh = new Date().toLocaleDateString("ms-MY", { dateStyle: "long" });
    const kpi = [
      ["Jumlah agihan", fmtN.format(n), "pertubuhan dalam tapisan", "--ink-2", null],
      [nm, fmtN.format(siap), fmtP(pSiap) + " daripada agihan", "--s3", pSiap],
      ["Kod A (11 + LK)", fmtN.format(T.KodA), fmtP(T.KodA / n) + " daripada agihan", "--s1", T.KodA / n],
      ["LK (12–60)", fmtN.format(T.LK), fmtP(T.LK / n) + " daripada agihan · termasuk 14: " + fmtN.format(T.K14), "--s7", T.LK / n],
      ["Kod B (71–77)", fmtN.format(T.KodB), fmtP(T.KodB / n) + " daripada agihan", "--s4", T.KodB / n],
      ["Baki belum " + nm.toLowerCase(), fmtN.format(baki), "agihan − " + nm.toLowerCase(), "--bad", baki / n],
    ];
    const segmen = KATEGORI.filter((c) => T[c.k]).map((c, i, a) => {
      const w = (T[c.k] / n) * 100;
      return `<i class="fe-seg" style="--w:${w.toFixed(2)}%;--d:${i * 120}ms;background:${css(c.warna)}" title="${esc(c.label)}: ${fmtN.format(T[c.k])}">` +
        (w >= 9 ? `<span>${esc(c.pendek || c.label.split(" ·")[0])} ${fmtP(T[c.k] / n)}</span>` : "") + `</i>`;
    }).join("");
    const legenda = KATEGORI.filter((c) => T[c.k]).map((c) => `<span><i class="kd-dot" style="background:${css(c.warna)}"></i>${esc(c.label)}: <b>${fmtN.format(T[c.k])}</b></span>`).join("");
    const baris = senarai.map((f, i) => {
      const c = f.c;
      const pct = f.p * 100;
      return `<div class="ffe-row" data-nama="${esc(f.nama)}" style="--d:${320 + i * 60}ms">` +
        `<div class="ffe-no${i === 0 ? " ffe-juara" : ""}">${i + 1}</div>` +
        `<div class="ffe-nm" title="${esc(f.nama)}">${esc(f.nama)}</div>` +
        `<div class="ffe-num" data-count="${f.n}">0</div>` +
        `<div class="ffe-mini"><span>11 <b>${fmtN.format(c.A1)}</b></span><span>14 <b>${fmtN.format(c.K14)}</b></span><span>LK <b>${fmtN.format(c.LK)}</b></span><span>Kod A <b>${fmtP(c.KodA / (c._n || 1))}</b></span><span>B <b>${fmtN.format(c.KodB)}</b></span></div>` +
        `<div class="ffe-bar"><div class="ffe-track"><i style="--w:${pct.toFixed(2)}%;--d:${360 + i * 60}ms"></i></div><b class="ffe-pct" data-count="${pct.toFixed(1)}" data-suffix="%">0%</b></div>` +
        `<div class="ffe-baki">${fmtN.format(c._n - capai(c))}</div></div>`;
    }).join("");
    el.innerHTML =
      `<div class="fe-hero">` +
        `<div class="fe-hero-teks"><p class="fe-kicker">${esc(cfg.TAJUK || "Dashboard")}</p>` +
        `<h3>Prestasi Pegawai Kerja Luar</h3>` +
        `<p class="fe-meta">${esc(tarikh)} · ${senarai.length} FE · ${fmtN.format(n)} pertubuhan</p></div>` +
        `<div class="fe-hero-angka"><span class="fe-besar" data-count="${(pSiap * 100).toFixed(1)}" data-suffix="%">0%</span><span class="fe-kecil">${nm} keseluruhan</span></div>` +
      `</div>` +
      `<div class="fe-kpi-baris">` + kpi.map(([l, v, s, w, p], i) =>
        `<div class="fe-kpi" style="--c:var(${w});--d:${i * 70}ms"><div class="fe-kpi-label">${esc(l)}</div>` +
        `<div class="fe-kpi-nilai">${v}</div><div class="fe-kpi-sub">${esc(s)}</div>` +
        (p == null ? "" : `<div class="fe-kpi-track"><i style="--w:${(Math.min(1, p) * 100).toFixed(1)}%"></i></div>`) + `</div>`).join("") +
      `</div>` +
      `<div class="fe-komposisi"><div class="fe-komp-tajuk">Komposisi status respon</div><div class="fe-komp-bar">${segmen}</div><div class="fe-legenda-kuadran">${legenda}</div></div>` +
      `<div class="fe-jadual"><div class="ffe-kepala"><div>#</div><div>Nama FE</div><div>Agihan</div><div>Komposisi</div><div>% ${nm}</div><div>Baki</div></div>` +
      `<div class="ffe-senarai">${baris}</div></div>`;
    el.onclick = (e) => {
      const row = e.target.closest(".ffe-row");
      if (row) klikTapis(FE_KEY, row.dataset.nama);
    };
    animasiFe(el);
  }
  // Kira naik nombor & peratus; respek pilihan 'kurangkan gerakan'
  function animasiFe(el) {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.querySelectorAll("[data-count]").forEach((node) => {
      const to = parseFloat(node.dataset.count), suf = node.dataset.suffix || "";
      const dec = node.dataset.suffix ? 1 : 0;
      const fmt = (v) => (dec ? v.toFixed(1) : fmtN.format(Math.round(v))) + suf;
      if (rm || !isFinite(to)) { node.textContent = fmt(to); return; }
      const mula = performance.now() + 240, dur = 900;
      const step = (t) => {
        const k = Math.min(1, Math.max(0, (t - mula) / dur));
        node.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function cartaKuadran(R) {
    const ch = carta("cKuadran");
    const senarai = dataFe(R);
    if (senarai.length < 2) return kosongkanCarta(ch, "Perlu sekurang-kurangnya 2 FE");
    const medN = median(senarai.map((f) => f.n));
    const medP = median(senarai.map((f) => f.p * 100));
    const kuad = (f) => (f.n >= medN ? (f.p * 100 >= medP ? "Bintang" : "Perlu bantuan") : (f.p * 100 >= medP ? "Cekap · kecil" : "Perlu susulan"));
    const warnaK = { "Bintang": "--good", "Perlu bantuan": "--s4", "Cekap · kecil": "--s1", "Perlu susulan": "--bad" };
    const data = senarai.map((f) => ({ name: f.nama, value: [f.n, +(f.p * 100).toFixed(1)], k: kuad(f), itemStyle: { color: css(warnaK[kuad(f)]) } }));
    const label = senarai.length <= 30;
    // Julat paksi: pastikan titik tak tercantum walaupun nilai hampir sama
    const julat = (nilai, pad, had) => {
      let lo = Math.min(...nilai) - pad, hi = Math.max(...nilai) + pad;
      if (hi - lo < 2 * pad) { const tengah = (hi + lo) / 2; lo = tengah - pad; hi = tengah + pad; }
      return [Math.max(0, Math.floor(lo)), Math.min(had, Math.ceil(hi))];
    };
    const nMin = Math.min(...senarai.map((f) => f.n)), nMax = Math.max(...senarai.map((f) => f.n));
    // Jika ada FE yang jauh lebih besar (cth. 18,000 vs 1,000), guna skala log supaya yang kecil tetap kelihatan
    const logX = nMax / Math.max(1, nMin) > 15;
    const [xMin, xMax] = logX ? [Math.max(1, Math.floor(nMin * 0.7)), Math.ceil(nMax * 1.3)] : julat(senarai.map((f) => f.n), Math.max(2, Math.round(nMax * 0.08)), Infinity);
    const [yMin, yMax] = julat(senarai.map((f) => f.p * 100), 3, 100);
    ch.setOption({
      ...asasTema(),
      grid: { left: 8, right: 24, top: 30, bottom: 44, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `<b>${esc(p.name)}</b><br>${fmtN.format(p.value[0])} pertubuhan · <b>${p.value[1].toFixed(1)}%</b> selesai<br>Kuadran: <b>${esc(p.data.k)}</b>` },
      xAxis: { type: logX ? "log" : "value", name: "Jumlah pertubuhan" + (logX ? " (skala log)" : ""), nameLocation: "middle", nameGap: 26, nameTextStyle: { color: css("--muted"), fontSize: 11.5 }, ...paksi(), min: xMin, max: xMax },
      yAxis: { type: "value", name: "% selesai", nameTextStyle: { color: css("--muted"), fontSize: 11.5 }, ...paksi(), min: yMin, max: yMax, axisLabel: { ...paksi().axisLabel, formatter: "{value}%" } },
      series: [{
        type: "scatter", symbolSize: (v) => 14 + Math.min(18, Math.sqrt(v[0]) * 1.4), data,
        itemStyle: { opacity: 0.9, borderColor: css("--surface"), borderWidth: 2 },
        emphasis: { focus: "self", scale: 1.15 },
        labelLayout: { hideOverlap: true, moveOverlap: "shiftY" },
        label: { show: label, position: "right", color: css("--ink"), fontSize: 11, fontWeight: 600, formatter: (p) => p.name },
        markLine: { symbol: "none", silent: true, lineStyle: { color: css("--muted"), type: "dashed", width: 1.2 }, label: { show: false },
          data: [{ xAxis: medN }, { yAxis: +medP.toFixed(1) }] },
      }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis(FE_KEY, p.name));
  }

  let skorSemasa = [];
  function paparSkor(R) {
    const d = S.dimensi;
    const label = (DIMENSI.find((x) => x[0] === d) || [d, d])[1];
    const g = [...kumpulKat(R, (r) => nilaiDim(r, d)).entries()].map(([v, rs]) => [v, kiraKat(rs)])
      .sort((a, b) => capai(b[1]) / b[1]._n - capai(a[1]) / a[1]._n || b[1]._n - a[1]._n);
    const sas = S.sasaran;
    const baki = (c) => Math.max(0, Math.ceil((sas / 100) * c._n) - capai(c));
    const T = kiraKat(R);
    const tahapMod = ukurUtama() === "selesai";
    const nm = tahapMod ? "Selesai" : "Siap";
    skorSemasa = [[label, "Jumlah", nm, "% " + nm, "Semakan SMD", "Semakan Negeri", "Pinda Semula", "Dalam Proses", "Kod 11", "Kod 14", "LK (12-60)", "Kod A (11+LK)", "Kod B (71-77)"]]
      .concat(g.map(([v, c]) => [v, c._n, capai(c), (capai(c) / c._n * 100).toFixed(1), c.T.SMD, c.T.Negeri, c.T.Pinda, c.T.Proses, c.A1, c.K14, c.LK, c.KodA, c.KodB]));
    const nCapai = g.filter(([, c]) => sas && capai(c) / c._n * 100 >= sas).length;
    $("skorSub").textContent = `${g.length} kumpulan · disusun ikut % ${nm.toLowerCase()}`;
    const sel = (c) => `<td class="num">${fmtN.format(c._n)}</td><td class="num">${fmtN.format(capai(c))}</td>` +
      `<td><span class="bar-mini"><i style="width:${Math.min(100, capai(c) / c._n * 100)}%"></i></span>${fmtP(capai(c) / c._n)}</td>` +
      (tahapMod ? `<td class="num">${fmtN.format(c.T.SMD)}</td><td class="num">${fmtN.format(c.T.Negeri)}</td><td class="num">${fmtN.format(c.T.Pinda)}</td><td class="num">${fmtN.format(c.T.Proses)}</td>` : "") +
      `<td class="num">${fmtN.format(c.A1)}</td><td class="num">${fmtN.format(c.K14)}</td><td class="num">${fmtN.format(c.LK)}</td><td class="num">${fmtN.format(c.KodA)}</td><td class="num">${fmtN.format(c.KodB)}</td>`;
    $("tSkor").innerHTML = `<thead><tr><th>#</th><th>${esc(label)}</th><th class="num">Jumlah</th><th class="num">${nm}</th><th>% ${nm}</th>` +
      (tahapMod ? `<th class="num">SMD</th><th class="num">Negeri</th><th class="num">Pinda</th><th class="num">Proses</th>` : "") +
      `<th class="num">11</th><th class="num">14</th><th class="num">LK</th><th class="num">Kod A</th><th class="num">Kod B</th></tr></thead><tbody>` +
      g.map(([v, c], i) => `<tr><td class="num">${i + 1}</td><td><b>${esc(v)}</b></td>${sel(c)}</tr>`).join("") +
      `<tr class="jumlah"><td></td><td>Jumlah</td>${sel(T)}</tr></tbody>`;
  }

  // ---------- Analisis nilai ----------
  function paparKewangan(R) {
    let h = `<thead><tr><th>Pemboleh ubah</th><th class="num">Rekod padan</th><th class="num">Jumlah sebelum</th><th class="num">Jumlah semasa</th>` +
      `<th class="num">Perubahan jumlah</th><th class="num">Median perubahan</th><th class="num">Jumlah semasa (semua)</th></tr></thead><tbody>`;
    for (const [k, label, rm] of UKURAN) {
      let n = 0, a = 0, b = 0, semua = 0;
      const ub = [];
      for (const r of R) {
        const s0 = r[k + "_sebelum"], s1 = r[k + "_semasa"];
        if (s1 != null) semua += +s1;
        if (s0 != null && s1 != null) { n++; a += +s0; b += +s1; if (+s0 > 0) ub.push(s1 / s0 - 1); }
      }
      const uj = a ? (b - a) / Math.abs(a) : NaN, md = median(ub);
      const kl = (x) => (!isFinite(x) ? "" : x >= 0 ? "naik" : "turun");
      const tx = (x) => (isFinite(x) ? (x >= 0 ? "▲ " : "▼ ") + fmtP(Math.abs(x)) : "–");
      h += `<tr><td><b>${esc(label)}</b></td><td class="num">${fmtN.format(n)}</td><td class="num">${n ? ringkas(a, rm) : "–"}</td><td class="num">${n ? ringkas(b, rm) : "–"}</td>` +
        `<td class="num ${kl(uj)}">${tx(uj)}</td><td class="num ${kl(md)}">${tx(md)}</td><td class="num">${ringkas(semua, rm)}</td></tr>`;
    }
    $("tKewangan").innerHTML = h + "</tbody>";
  }
  function kesSemakan(R) {
    const amb = S.ambang / 100;
    const out = [];
    for (const r of R) {
      for (const [k, label, rm] of UKURAN) {
        const a = r[k + "_sebelum"], b = r[k + "_semasa"];
        if (a == null || b == null || !(a > 0)) continue;
        const ub = b / a - 1;
        if (Math.abs(ub) > amb) out.push({ r, k, label, rm, a, b, ub });
      }
    }
    return out.sort((x, y) => Math.abs(y.ub) - Math.abs(x.ub));
  }
  function paparSemakan(R) {
    const x = kesSemakan(R);
    const rekodUnik = new Set(x.map((o) => o.r.id)).size;
    $("tSemakan").closest(".kad").querySelector(".kad-sub").textContent =
      `${fmtN.format(rekodUnik)} rekod · ${fmtN.format(x.length)} nilai melebihi ±${S.ambang}% · klik untuk butiran`;
    $("tSemakan").innerHTML = `<thead><tr><th>No. Siri / Nama</th><th>Pemboleh ubah</th><th class="num">Sebelum</th><th class="num">Semasa</th><th class="num">Ubah</th></tr></thead><tbody>` +
      (x.slice(0, 300).map((o) => `<tr data-id="${o.r.id}"><td class="nama" title="${esc(o.r.nama)}"><b>${esc(o.r.no_siri || o.r.no_id || "")}</b> ${esc(o.r.nama || "")}</td>` +
        `<td>${esc(o.label)}</td><td class="num">${ringkas(o.a, o.rm)}</td><td class="num">${ringkas(o.b, o.rm)}</td>` +
        `<td class="num ${o.ub >= 0 ? "naik" : "turun"}">${o.ub >= 0 ? "+" : ""}${(o.ub * 100).toFixed(0)}%</td></tr>`).join("") ||
        `<tr><td colspan="5" class="nota">Tiada nilai melebihi ambang.</td></tr>`) + "</tbody>";
  }
  function cartaSerak(R) {
    const k = S.ukuranSerak;
    const u = UKURAN.find((x) => x[0] === k) || UKURAN[0];
    const amb = S.ambang / 100;
    const dalam = [], luar = [];
    let mn = Infinity, mx = 0;
    for (const r of R) {
      const a = r[k + "_sebelum"], b = r[k + "_semasa"];
      if (!(a > 0) || !(b > 0)) continue;
      mn = Math.min(mn, a, b); mx = Math.max(mx, a, b);
      (Math.abs(b / a - 1) > amb ? luar : dalam).push([a, b, r.id, r.nama || "", r.no_siri || r.no_id || ""]);
    }
    const ch = carta("cSerak");
    if (!dalam.length && !luar.length) return kosongkanCarta(ch, "Tiada rekod dengan nilai sebelum & semasa > 0");
    const pendek = (v) => (v >= 1e9 ? v / 1e9 + " bil" : v >= 1e6 ? v / 1e6 + " j" : v >= 1e3 ? v / 1e3 + " k" : String(v));
    const paksiLog = (nama, jarak) => ({ type: "log", name: nama, nameLocation: "middle", nameGap: jarak, nameTextStyle: { color: css("--muted"), fontSize: 11.5 },
      ...paksi(), axisLabel: { ...paksi().axisLabel, formatter: pendek } });
    const titik = (nama, data, warna) => ({ name: nama, type: "scatter", data: data.slice(0, 6000), symbolSize: 8,
      itemStyle: { color: warna, opacity: 0.75, borderColor: css("--surface"), borderWidth: 1 } });
    ch.setOption({
      ...asasTema(),
      legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: css("--ink-2"), fontSize: 11.5 } },
      grid: { left: 30, right: 20, top: 34, bottom: 30, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => { const [a, b, , nama, siri] = p.data; return `<b>${esc(siri)}</b> ${esc(nama)}<br>Sebelum: ${ringkas(a, u[2])}<br>Semasa: ${ringkas(b, u[2])}<br>Ubah: <b>${b / a >= 1 ? "+" : ""}${((b / a - 1) * 100).toFixed(1)}%</b>`; } },
      xAxis: paksiLog(u[1] + " — sebelum", 30),
      yAxis: paksiLog(u[1] + " — semasa", 50),
      series: [
        titik("Dalam ambang ±" + S.ambang + "%", dalam, css("--s1")),
        { ...titik("Melebihi ambang", luar, css("--s4")),
          markLine: { symbol: "none", silent: true, lineStyle: { color: css("--muted"), type: "dashed", width: 1 }, label: { show: false },
            data: [[{ coord: [mn, mn] }, { coord: [mx, mx] }]] } },
      ],
    }, true);
    ch.off("click");
    ch.on("click", (p) => butiran(p.data[2]));
  }

  // ---------- Jadual rekod ----------
  const LAJUR_JADUAL = [
    ["no_siri", "No. Siri"], ["nama", "Nama Pendaftaran"], ["pegawai_kerja_luar", "Pegawai Kerja Luar"],
    ["msic_5", "Kod Industri"], ["status_respon_semasa", "Status Semasa"], ["status_respon_sebelum", "Status Sebelum"],
    ["status_rekod", "Status Rekod"], ["cara_terima", "Cara Terima"], ["tarikh_terima", "Tarikh Terima"], ["pmks", "PMKS"],
    ["pendapatan_semasa", "Pendapatan Semasa"], ["perbelanjaan_semasa", "Perbelanjaan Semasa"], ["gaji_semasa", "Gaji Semasa"],
    ["pekerja_semasa", "Pekerja Semasa"], ["harta_tetap_semasa", "Harta Tetap Semasa"],
    ["catatan_negeri", "Catatan Negeri"], ["catatan_pinda_smd", "Catatan Pinda SMD"],
  ];
  const SAIZ_HAL = 50;
  let lajurJadual = LAJUR_JADUAL;
  let paparanSemasa = [];
  function rekodCarian(R) {
    const q = S.cari.trim().toLowerCase();
    let x = q ? R.filter((r) => [r.no_id, r.nama, r.no_siri, r.pegawai_kerja_luar].some((v) => v != null && String(v).toLowerCase().includes(q))) : R.slice();
    if (S.hanyaPinda) x = x.filter(adaPinda);
    if (S.susunK) {
      const k = S.susunK, j = JENIS[k], arah = S.susunArah;
      x.sort((a, b) => {
        const va = a[k], vb = b[k];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return (j === "n" || j === "i" ? va - vb : String(va).localeCompare(String(vb), "ms", { numeric: true })) * arah;
      });
    }
    return x;
  }
  function paparRekod(R) {
    const x = rekodCarian(R);
    paparanSemasa = x;
    const maksHal = Math.max(0, Math.ceil(x.length / SAIZ_HAL) - 1);
    S.halaman = Math.min(S.halaman, maksHal);
    const hal = x.slice(S.halaman * SAIZ_HAL, (S.halaman + 1) * SAIZ_HAL);
    const anak = (k) => (S.susunK === k ? (S.susunArah > 0 ? " ▲" : " ▼") : "");
    let h = `<thead><tr>${lajurJadual.map(([k, l]) => `<th data-k="${k}" class="${JENIS[k] === "n" ? "num" : ""}">${esc(l)}${anak(k)}</th>`).join("")}</tr></thead><tbody>`;
    for (const r of hal) {
      h += `<tr data-id="${r.id}">` + lajurJadual.map(([k]) => {
        const v = r[k];
        if (k === "status_rekod") {
          const t = TAHAP.find((z) => z.k === r._tahap);
          return `<td><span class="lencana" style="--c:var(${t.warna})"><i></i>${esc(v || "–")}</span></td>`;
        }
        if (k === "status_respon_semasa") {
          const c = KATEGORI.find((z) => z.k === r._kat);
          return `<td><span class="lencana" style="--c:var(${c.warna})"><i></i>${esc(v || "–")}</span></td>`;
        }
        if (JENIS[k] === "n") return `<td class="num">${v == null ? "" : fmtN.format(v)}</td>`;
        if (JENIS[k] === "d") return `<td>${tarikhPapar(v)}</td>`;
        return `<td class="${k === "nama" ? "nama" : ""}" title="${esc(v)}">${esc(v)}</td>`;
      }).join("") + "</tr>";
    }
    if (!hal.length) h += `<tr><td colspan="${lajurJadual.length}" class="nota">Tiada rekod.</td></tr>`;
    $("tRekod").innerHTML = h + "</tbody>";
    $("bilRekod").textContent = "(" + fmtN.format(x.length) + ")";
    $("pgInfo").textContent = x.length ? `${S.halaman * SAIZ_HAL + 1}–${Math.min(x.length, (S.halaman + 1) * SAIZ_HAL)} / ${fmtN.format(x.length)}` : "";
    $("pgSebelum").disabled = S.halaman <= 0;
    $("pgSelepas").disabled = S.halaman >= maksHal;
  }
  function butiran(id) {
    const r = S.rekod.find((z) => String(z.id) === String(id));
    if (!r) return;
    $("butiranTajuk").textContent = (r.no_siri || r.no_id || "") + " · " + (r.nama || "");
    $("butiranIsi").innerHTML = LAJUR.filter(([k]) => !DAERAH_BUANG.has(k)).map(([k, l, j]) => {
      const v = r[k];
      const t = v == null || v === "" ? "–" : j === "n" ? fmtN.format(v) : j === "d" ? tarikhPapar(v) : v;
      return `<dt>${esc(l)}</dt><dd>${esc(t)}</dd>`;
    }).join("") + `<dt>Kategori respon</dt><dd>${esc(KAT_LABEL[r._kat])}</dd><dt>Tahap pencapaian</dt><dd>${esc(TAHAP_LABEL[r._tahap])}</dd>` +
      Object.entries(r.tambahan || {}).map(([k, v]) => `<dt>${esc(k)} <span class="nota">(tambahan)</span></dt><dd>${esc(v)}</dd>`).join("");
    $("dButiran").showModal();
  }
  function eksportCsv() {
    const x = paparanSemasa;
    const sel = (v) => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const baris = [LAJUR.map((l) => sel(l[1])).concat(["Tahap Pencapaian", "Kategori Respon"]).join(",")]
      .concat(x.map((r) => LAJUR.map(([k]) => sel(r[k])).concat([sel(TAHAP_LABEL[r._tahap]), sel(KAT_LABEL[r._kat])]).join(",")));
    const blob = new Blob(["﻿" + baris.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mko-ditapis-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Baca fail ----------
  function keTeks(v) {
    if (v == null) return null;
    let s = typeof v === "number" ? (Number.isInteger(v) ? String(v) : String(v)) : String(v);
    s = s.trim();
    return s === "" ? null : s;
  }
  function keNombor(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    let s = String(v).trim().replace(/^RM\s*/i, "").replace(/\s/g, "");
    if (s === "" || s === "-" || s === "–") return null;
    let neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    s = s.replace(/,/g, "");
    const n = Number(s);
    return isFinite(n) ? (neg ? -n : n) : null;
  }
  const dua = (n) => String(n).padStart(2, "0");
  function keTarikh(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number" && v > 20000 && v < 80000) {
      const d = XLSX.SSF.parse_date_code(v);
      return d ? `${d.y}-${dua(d.m)}-${dua(d.d)}` : null;
    }
    if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${dua(v.getMonth() + 1)}-${dua(v.getDate())}`;
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return sahTarikh(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);   // dd/mm/yyyy (format Malaysia)
    if (m) return sahTarikh(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    const BULAN = { jan: 1, feb: 2, mac: 3, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, ogo: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dis: 12, dec: 12 };
    m = s.match(/^(\d{1,2})[\s-]+([A-Za-z]{3})[A-Za-z]*[\s-]+(\d{4})/);
    if (m && BULAN[m[2].toLowerCase()]) return sahTarikh(+m[3], BULAN[m[2].toLowerCase()], +m[1]);
    return null;
  }
  function sahTarikh(y, mo, d) {
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
    return `${y}-${dua(mo)}-${dua(d)}`;
  }
  function tukarNilai(k, v) {
    const j = JENIS[k];
    if (j === "n") return keNombor(v);
    if (j === "i") { const n = keNombor(v); return n == null ? null : Math.round(n); }
    if (j === "d") return keTarikh(v);
    return keTeks(v);
  }

  async function bacaFail(fail) {
    const buf = await fail.arrayBuffer();
    const csv = /\.csv$/i.test(fail.name);
    const wb = XLSX.read(buf, csv ? { type: "array", raw: true, codepage: 65001 } : { type: "array" });
    let terbaik = null, calonHeader = null;
    for (const nama of wb.SheetNames) {
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[nama], { header: 1, raw: true, defval: null, blankrows: false });
      for (let i = 0; i < Math.min(30, aoa.length); i++) {
        // Cuba header satu baris, dan header dua baris (sel bergabung di atas, cth. "Pendapatan (RM)" / "Survei Sebelum")
        const atas = aoa[i] || [], bawah = aoa[i + 1] || [];
        let isi = null;
        const atasIsi = atas.map((v) => (v != null && String(v).trim() !== "" ? (isi = String(v).trim()) : isi));
        const dua = Array.from({ length: Math.max(atas.length, bawah.length) }, (_, c) =>
          bawah[c] != null && String(bawah[c]).trim() !== "" ? (atasIsi[c] || "") + " " + String(bawah[c]).trim() : atas[c]);
        for (const [header, baris] of [[atas, 1], [dua, 2]]) {
          const peta = header.map(petaHeader);
          const skor = new Set(peta.filter(Boolean)).size;
          // Fail kecil (cth. No. Siri + satu lajur) dibenarkan jika ada lajur kunci
          const adaKunci = peta.includes("no_siri");
          if ((skor >= 3 || (skor >= 1 && adaKunci)) && (!terbaik || skor > terbaik.skor))
            terbaik = { skor, aoa, i: i + baris - 1, peta, header, helaian: nama };
        }
      }
      if (!calonHeader) {
        const r = aoa.slice(0, 15).find((b) => b && b.filter((v) => v != null && String(v).trim() !== "").length >= 3);
        if (r) calonHeader = { helaian: nama, sel: r.filter((v) => v != null && String(v).trim() !== "").map(String) };
      }
    }
    if (!terbaik) throw new Error("Lajur 'No. Siri' tidak dijumpai dalam mana-mana helaian." +
      (calonHeader ? ` Header yang dijumpai (helaian ${calonHeader.helaian}): ${calonHeader.sel.slice(0, 15).join(" | ")}${calonHeader.sel.length > 15 ? " …" : ""}` : ""));
    const { aoa, i, peta, header } = terbaik;
    const guna = new Map();   // kunci -> indeks lajur pertama
    const tidakDikenal = [], idxTambahan = [];
    peta.forEach((k, idx) => {
      if (k && !guna.has(k)) guna.set(k, idx);
      else if (!k && header[idx] != null && String(header[idx]).trim()) {
        tidakDikenal.push(String(header[idx]).trim());
        idxTambahan.push([String(header[idx]).trim().slice(0, 80), idx]);
      }
    });
    if (!guna.has("no_siri")) throw new Error("Lajur 'No. Siri' tidak dijumpai — No. Siri (12 digit) wajib sebagai kunci rekod.");
    const rekod = [], siriSalah = [], contohLapik = [];
    let siriLapik = 0;
    for (let b = i + 1; b < aoa.length; b++) {
      const row = aoa[b];
      if (!row || row.every((v) => v == null || String(v).trim() === "")) continue;
      const r = {};
      for (const [k, idx] of guna) r[k] = tukarNilai(k, row[idx]);
      // Lajur yang tidak dikenal disimpan dalam "tambahan" supaya tiada data hilang
      for (const [h, idx] of idxTambahan) {
        const v = row[idx];
        if (v != null && String(v).trim() !== "") { r.tambahan = r.tambahan || {}; r.tambahan[h] = typeof v === "number" ? v : String(v).trim(); }
      }
      if (!r.no_id && !r.nama && !r.no_siri) continue;   // baris jumlah / nota
      const ns = normSiri(r.no_siri);
      if (!ns.nilai) { siriSalah.push({ baris: b + 1, nilai: ns.status === "kosong" ? "(kosong)" : ns.asal }); continue; }
      if (ns.status === "lapik") { siriLapik++; if (contohLapik.length < 3) contohLapik.push(ns.asal + " → " + ns.nilai); }
      r.no_siri = ns.nilai;
      if (!r.msic_3 && r.msic_5) r.msic_3 = String(r.msic_5).replace(/\D/g, "").slice(0, 3) || null;
      rekod.push(r);
    }
    const hilang = LAJUR.map((l) => l[0]).filter((k) => !guna.has(k) && !(k === "msic_3" && guna.has("msic_5")));
    return { rekod, hilang, tidakDikenal, helaian: terbaik.helaian, nama: fail.name, siriSalah, siriLapik, contohLapik, lajurFail: [...guna.keys()] };
  }

  // ---------- Gabung beberapa fail ikut No. Siri ----------
  // Kunci padanan: No. Siri (atau NO ID jika No. Siri tiada). Sifar di depan diabaikan semasa memadan
  // supaya "03507000001" (teks) sepadan dengan 3507000001 (nombor Excel).
  // No. Siri mesti tepat 12 digit. Excel selalu membuang sifar di depan (cth. 012345678901 -> 12345678901),
  // jadi nilai nombor yang kurang daripada 12 digit dilapik dengan sifar. Lebih 12 digit / ada huruf = tidak sah.
  const PANJANG_SIRI = 12;
  function normSiri(v) {
    if (v == null || String(v).trim() === "") return { status: "kosong", nilai: null };
    const s = String(v).trim().replace(/[\s\-']/g, "");
    if (!/^\d+$/.test(s)) return { status: "salah", nilai: null, asal: String(v) };
    if (s.length > PANJANG_SIRI) return { status: "salah", nilai: null, asal: String(v) };
    if (s.length < PANJANG_SIRI) return { status: "lapik", nilai: s.padStart(PANJANG_SIRI, "0"), asal: s };
    return { status: "ok", nilai: s };
  }
  function kunciRekod(r) {
    const n = normSiri(r.no_siri);
    return n.nilai;
  }
  // Daerah pos & lokasi tidak lagi dipaparkan (peta, penapis, carta, jadual atau butiran)
  const DAERAH_BUANG = new Set(["daerah_pos_label", "daerah_pos_semasa", "daerah_lokasi_label", "daerah_lokasi_semasa", "_dl", "_dp"]);
  const SISTEM = new Set(["id", "muat_naik_id", "_kat", "_tahap", "_dl", "_dp"]);
  // ---------- Frame + kemas kini terpilih ----------
  // Frame = senarai pertubuhan tulang belakang (populasi). Fail lain hanya mengemas kini lajur tertentu
  // bagi No. Siri yang ada dalam frame; rekod tidak ditambah atau dibuang, sel kosong tidak memadam nilai.
  const JENIS_FAIL = {
    Frame: { label: "Frame (tulang belakang)", lajur: null },
    K7: { label: "K7 · Status respon & status rekod", lajur: ["status_respon_semasa", "status_respon_sebelum", "status_rekod"] },
    K5: { label: "K5 · Nilai utama, tarikh & catatan", lajur: [
      ...["pendapatan", "perbelanjaan", "harta_tetap", "pekerja", "gaji", "stok_akhir", "nilai_jualan"].flatMap((k) => [k + "_sebelum", k + "_semasa"]),
      ...["2015", "2023", "2026"].flatMap((y) => ["pendapatan_" + y, "perbelanjaan_" + y, "va_" + y]),
      "tarikh_terima", "cara_terima", "kes_anggaran", "catatan_kes_anggaran", "catatan_mko", "catatan_negeri", "catatan_pinda_smd", "tambahan"] },
    Umum: { label: "Umum · semua lajur dalam fail (cth. nama FE)", lajur: "semua" },
  };
  const BUKAN_KEMASKINI = new Set(["no_siri", "bil", "id", "muat_naik_id"]);
  function teka_jenis(nama) {
    if (/\bk\s*-?\s*7\b|jadual\s*k7/i.test(nama)) return "K7";
    if (/\bk\s*-?\s*5\b|jadual\s*k5/i.test(nama)) return "K5";
    if (/frame|profil|rangka|fasa|induk|senarai[_\s]pertubuhan/i.test(nama)) return "Frame";
    return "Umum";
  }
  function lajurBolehUbah(jenis, h) {
    const j = JENIS_FAIL[jenis];
    const dalamFail = new Set(h.lajurFail || []);
    if (h.rekod.some((r) => r.tambahan)) dalamFail.add("tambahan");
    let calon = j.lajur === "semua" || j.lajur == null ? [...dalamFail] : j.lajur.filter((k) => dalamFail.has(k));
    if (dalamFail.has("msic_5") && (j.lajur === "semua" || j.lajur == null)) calon.push("msic_3");
    return calon.filter((k) => !BUKAN_KEMASKINI.has(k));
  }
  const bersih = (r) => { const o = {}; for (const k in r) if (!SISTEM.has(k)) o[k] = r[k]; return o; };
  const kosong = (v) => v == null || v === "";

  function binaData(fail, asas) {
    // fail: [{ h, jenis }]; asas: rekod sedia ada (boleh kosong)
    const frame = fail.filter((f) => f.jenis === "Frame");
    const kemaskini = fail.filter((f) => f.jenis !== "Frame")
      .sort((a, b) => ["Umum", "K5", "K7"].indexOf(a.jenis) - ["Umum", "K5", "K7"].indexOf(b.jenis));
    const stat = new Map();
    const pop = new Map();
    let dibuangFrame = 0, mod;
    if (frame.length) {
      mod = "frame";
      for (const f of frame) {
        const st = { padan: 0, baharu: 0, takPadan: 0, duplikat: 0, ubah: {} };
        const lihat = new Set();
        for (const r0 of f.h.rekod) {
          const k = kunciRekod(r0); if (!k) continue;
          if (lihat.has(k)) st.duplikat++; lihat.add(k);
          const r = bersih(r0); r.no_siri = k;
          const lama = pop.get(k);
          if (!lama) { pop.set(k, r); st.baharu++; continue; }
          for (const c in r) if (!kosong(r[c])) lama[c] = c === "tambahan" ? { ...(lama.tambahan || {}), ...r[c] } : r[c];
        }
        stat.set(f, st);
      }
      // Kekalkan nilai sedia ada (K5/K7 terdahulu) bagi pertubuhan yang masih dalam frame
      const lamaPeta = new Map((asas || []).map((r) => [kunciRekod(r), r]));
      for (const [k, r] of pop) {
        const lama = lamaPeta.get(k);
        if (!lama) continue;
        const gabung = bersih(lama);
        for (const c in r) if (!kosong(r[c])) gabung[c] = c === "tambahan" ? { ...(gabung.tambahan || {}), ...r[c] } : r[c];
        pop.set(k, gabung);
      }
      dibuangFrame = [...lamaPeta.keys()].filter((k) => k && !pop.has(k)).length;
    } else if (asas && asas.length) {
      mod = "kemaskini";
      for (const r of asas) { const k = kunciRekod(r); if (k) pop.set(k, bersih(r)); }
    } else {
      return { ralat: "Belum ada data. Muat naik fail Frame (senarai pertubuhan tulang belakang) dahulu, atau tukar jenis salah satu fail kepada “Frame”." };
    }
    for (const f of kemaskini) {
      const st = { padan: 0, baharu: 0, takPadan: 0, duplikat: 0, ubah: {} };
      const lajur = lajurBolehUbah(f.jenis, f.h);
      const lihat = new Set();
      for (const r of f.h.rekod) {
        const k = kunciRekod(r); if (!k) continue;
        const sasar = pop.get(k);
        if (!sasar) { st.takPadan++; continue; }
        if (lihat.has(k)) st.duplikat++; else st.padan++;
        lihat.add(k);
        for (const c of lajur) {
          let v = c === "msic_3" ? (r.msic_3 || (r.msic_5 ? String(r.msic_5).replace(/\D/g, "").slice(0, 3) : null)) : r[c];
          if (kosong(v)) continue;
          if (c === "tambahan") { sasar.tambahan = { ...(sasar.tambahan || {}), ...v }; continue; }
          if (String(sasar[c] ?? "") !== String(v)) { st.ubah[c] = (st.ubah[c] || 0) + 1; sasar[c] = v; }
        }
      }
      st.lajur = lajur;
      stat.set(f, st);
    }
    const rekod = [...pop.values()];
    for (const r of rekod) if (!r.msic_3 && r.msic_5) r.msic_3 = String(r.msic_5).replace(/\D/g, "").slice(0, 3) || null;
    return { rekod, stat, mod, dibuangFrame };
  }

  // ---------- Muat naik ----------
  let hasilBaca = null;
  let failDibaca = [];       // [{ h, jenis }]
  let sahAmaran = false;
  async function pilihFail(e) {
    const senarai = [...(e.target.files || [])];
    failDibaca = [];
    hasilBaca = null;
    sahAmaran = false;
    $("btnSahMuatNaik").disabled = true;
    $("mnRalat").textContent = "";
    $("semakan").innerHTML = "";
    if (!senarai.length) return;
    $("semakan").textContent = "Membaca " + senarai.length + " fail…";
    const ralat = [];
    for (const f of senarai) {
      try {
        const h = await bacaFail(f);
        if (!h.rekod.length) throw new Error("tiada baris data di bawah header");
        failDibaca.push({ h, jenis: teka_jenis(f.name) });
      } catch (err) { ralat.push(f.name + ": " + (err.message || err)); }
    }
    // Jika belum ada data dan tiada fail Frame, jadikan fail pertama Frame
    if (!S.rekod.length && failDibaca.length && !failDibaca.some((f) => f.jenis === "Frame")) failDibaca[0].jenis = "Frame";
    $("mnRalat").textContent = ralat.length ? "Diabaikan — " + ralat.join(" | ") : "";
    paparPratonton();
  }
  function paparPratonton() {
    hasilBaca = null;
    $("btnSahMuatNaik").disabled = true;
    if (!failDibaca.length) { $("semakan").innerHTML = ""; return; }
    const g = binaData(failDibaca, S.rekod);
    const pilihJenis = (i, j) => `<select data-jenis="${i}">${Object.entries(JENIS_FAIL).map(([k, v]) => `<option value="${k}"${k === j ? " selected" : ""}>${esc(v.label)}</option>`).join("")}</select>`;
    let html = `<table class="jadual semak-fail"><thead><tr><th>Fail</th><th>Jenis</th><th class="num">Baris</th><th class="num">Padan</th><th class="num">Tiada dalam frame</th></tr></thead><tbody>` +
      failDibaca.map((f, i) => {
        const st = g.stat ? g.stat.get(f) : null;
        const isFrame = f.jenis === "Frame";
        return `<tr><td>${esc(f.h.nama)} <span class="nota">(${esc(f.h.helaian)})</span></td><td>${pilihJenis(i, f.jenis)}</td><td class="num">${fmtN.format(f.h.rekod.length)}</td>` +
          `<td class="num">${st ? (isFrame ? fmtN.format(st.baharu) + " (populasi)" : fmtN.format(st.padan)) : "–"}</td>` +
          `<td class="num${st && st.takPadan ? " turun" : ""}">${st && !isFrame ? fmtN.format(st.takPadan) + (st.takPadan ? " (diabaikan)" : "") : "–"}</td></tr>`;
      }).join("") + `</tbody></table>`;
    if (g.ralat) {
      $("semakan").innerHTML = html + `<p class="amaran">${esc(g.ralat)}</p>`;
      return;
    }
    // Lajur yang akan dikemas kini setiap fail
    const amaran = [];
    html += `<div class="ringkas-ubah">` + failDibaca.map((f) => {
      const st = g.stat.get(f);
      if (f.jenis === "Frame") {
        const lj = (f.h.lajurFail || []).filter((k) => !BUKAN_KEMASKINI.has(k));
        if (lj.length <= 1) amaran.push(`${f.h.nama}: hanya ${lj.length} lajur dikenal (selain No. Siri) — semak header fail.`);
        return `<p><b>${esc(f.h.nama)}</b> → frame dengan ${lj.length} lajur: <span class="nota">${lj.map((k) => esc(LABEL[k] || k)).join(", ")}</span></p>`;
      }
      const ubahan = Object.entries(st.ubah).sort((a, b) => b[1] - a[1]);
      if (!st.lajur.length) amaran.push(`${f.h.nama}: tiada lajur jenis ${f.jenis} dijumpai dalam fail ini — tiada apa dikemas kini.`);
      return `<p><b>${esc(f.h.nama)}</b> → kemas kini ${st.lajur.length} lajur bagi ${fmtN.format(st.padan)} pertubuhan:</p>` +
        (ubahan.length ? `<ul>${ubahan.map(([k, n]) => `<li>${esc(LABEL[k] || k)}: <b>${fmtN.format(n)}</b> berubah</li>`).join("")}</ul>` : `<p class="nota">Tiada nilai berubah.</p>`) +
        (st.lajur.length ? `<p class="nota">Lajur yang dibenarkan: ${st.lajur.map((k) => esc(LABEL[k] || k)).join(", ")}. Lajur lain dalam fail ini diabaikan.</p>` : "");
    }).join("") + `</div>`;
    // Pengawal: lajur penting yang berisi sebelum ini tidak boleh jadi kosong
    if (S.rekod.length) {
      const penting = ["pegawai_kerja_luar", "status_respon_semasa", "status_rekod", "parlimen", "pendapatan_semasa", "tarikh_terima", "fasa_be", "tier"];
      for (const c of penting) {
        const sebelum = S.rekod.filter((r) => !kosong(r[c])).length / S.rekod.length;
        const selepas = g.rekod.filter((r) => !kosong(r[c])).length / (g.rekod.length || 1);
        if (sebelum >= 0.3 && selepas < sebelum * 0.5) amaran.push(`${LABEL[c] || c} akan jatuh daripada ${fmtP(sebelum)} berisi kepada ${fmtP(selepas)}.`);
      }
    }
    const kat = {}; for (const r of g.rekod) { const k = kategori(r.status_respon_semasa); kat[k] = (kat[k] || 0) + 1; }
    html += `<p><strong>${fmtN.format(g.rekod.length)}</strong> pertubuhan selepas simpan` +
      (g.mod === "frame" ? ` (frame baharu${S.rekod.length ? `; ${fmtN.format(g.dibuangFrame)} pertubuhan lama tiada dalam frame baharu akan dikeluarkan` : ""}).` : ` (sama seperti sekarang — tiada pertubuhan ditambah atau dibuang).`) + `</p>` +
      `<p class="nota">Kategori respon: ${KATEGORI.filter((c) => kat[c.k]).map((c) => esc(c.pendek || c.label) + " " + fmtN.format(kat[c.k])).join(" · ")}</p>`;
    // No. Siri tidak sah
    const salah = failDibaca.flatMap((f) => f.h.siriSalah.map((x) => ({ ...x, fail: f.h.nama })));
    const lapik = failDibaca.reduce((a, f) => a + f.h.siriLapik, 0);
    if (salah.length) html = `<p class="amaran"><b>${fmtN.format(salah.length)} baris diabaikan</b> kerana No. Siri bukan 12 digit.</p>` +
      `<details><summary>Lihat baris</summary><p class="nota">${salah.slice(0, 30).map((x) => `${esc(x.fail)} baris ${x.baris}: ${esc(x.nilai)}`).join("<br>")}${salah.length > 30 ? "<br>…" : ""}</p></details>` + html;
    if (lapik) html += `<p class="nota">${fmtN.format(lapik)} No. Siri kurang 12 digit dilapik dengan sifar di depan.</p>`;
    if (amaran.length) html += `<div class="kotak-amaran"><b>⚠ Semak sebelum simpan:</b><ul>${amaran.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` +
      `<label class="pilihan-gabung"><input type="checkbox" id="sahAmaran"${sahAmaran ? " checked" : ""}> <span>Saya faham dan tetap mahu simpan</span></label></div>`;
    $("semakan").innerHTML = html;
    hasilBaca = { nama: (g.mod === "kemaskini" ? "Kemas kini: " : "Frame: ") + failDibaca.map((f) => f.h.nama + " [" + f.jenis + "]").join(" + ").slice(0, 480), rekod: g.rekod };
    $("btnSahMuatNaik").disabled = !g.rekod.length || (amaran.length && !sahAmaran);
    $("btnSahMuatNaik").textContent = g.mod === "frame" ? "Simpan frame" : "Simpan kemas kini";
  }

  async function muatVersi() {
    const el = $("senaraiVersi");
    if (!S.pentadbir) { el.innerHTML = ""; return; }
    const { data, error } = await sb.rpc("senarai_versi");
    if (error || !Array.isArray(data)) { el.innerHTML = ""; return; }
    const lama = data.filter((v) => v.status === "lama");
    el.innerHTML = `<details><summary>Versi data (${data.length}) · pulihkan jika tersalah muat naik</summary>` +
      (lama.length ? "" : `<p class="nota">Tiada versi lama disimpan.</p>`) +
      `<table class="jadual"><tbody>${data.map((v) => `<tr><td>${new Date(v.created_at).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })}</td>` +
        `<td class="nama" title="${esc(v.nama_fail)}">${esc(v.nama_fail)}</td><td class="num">${fmtN.format(v.bil_rekod)}</td>` +
        `<td>${v.status === "aktif" ? '<span class="pil capai">Aktif</span>' : `<button class="btn btn-garis" data-pulih="${v.id}">Pulihkan</button>`}</td></tr>`).join("")}</tbody></table></details>`;
  }

  async function sahMuatNaik() {
    if (!hasilBaca) return;
    const btn = $("btnSahMuatNaik");
    btn.disabled = true;
    $("mnRalat").textContent = "";
    $("kemajuan").hidden = false;
    const bar = $("kemajuanBar");
    bar.style.width = "0%";
    let id = null;
    try {
      const { data: mn, error: e1 } = await sb.from("muat_naik")
        .insert({ nama_fail: hasilBaca.nama, bil_rekod: hasilBaca.rekod.length, dimuat_naik_oleh: S.sesi?.user?.email || null })
        .select("id").single();
      if (e1) throw e1;
      id = mn.id;
      const SAIZ = 500;
      const semua = hasilBaca.rekod;
      for (let i = 0; i < semua.length; i += SAIZ) {
        const ketul = semua.slice(i, i + SAIZ).map((r) => ({ ...r, muat_naik_id: id }));
        const { error } = await sb.from("rekod").insert(ketul);
        if (error) throw error;
        bar.style.width = Math.round(((i + ketul.length) / semua.length) * 95) + "%";
      }
      const { data: n, error: e2 } = await sb.rpc("aktifkan_muat_naik", { p_id: id });
      if (e2) throw e2;
      bar.style.width = "100%";
      id = null;
      $("dMuatNaik").close();
      toast("Berjaya: " + fmtN.format(n) + " rekod kini aktif.");
      S.muatNaik = null;
      await muatData();
    } catch (err) {
      console.error(err);
      $("mnRalat").textContent = "Gagal: " + (err.message || err) + ". Data lama tidak terjejas.";
      if (id) await sb.rpc("batal_muat_naik", { p_id: id });
      btn.disabled = false;
    } finally {
      setTimeout(() => ($("kemajuan").hidden = true), 800);
    }
  }

  // ---------- Log masuk ----------
  async function semakSesi() {
    const { data } = await sb.auth.getSession();
    S.sesi = data.session;
    S.pentadbir = false;
    if (S.sesi) {
      const { data: ok } = await sb.rpc("saya_pentadbir");
      S.pentadbir = !!ok;
    }
    $("btnLog").textContent = S.sesi ? "Log keluar" : "Log masuk";
    $("btnLog").title = S.sesi ? S.sesi.user.email : "";
    $("btnMuatNaik").hidden = !S.pentadbir;
  }

  // ---------- Peristiwa ----------
  function simpanPaparan() {
    try { localStorage.setItem("sup_paparan", JSON.stringify({ peratus: S.peratus, ambang: S.ambang, hal: S.hal })); } catch (e) { /* abaikan */ }
  }
  function tukarHalaman(h) {
    S.hal = h;
    document.querySelectorAll(".tab [role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.hal === h)));
    simpanPaparan();
    papar();
  }
  function segmen(id, fn) {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      $(id).querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      fn(b.dataset.v);
    });
  }
  function bukaLaci(buka) {
    $("laci").hidden = !buka;
    $("laciLatar").hidden = !buka;
    if (!buka) tutupPopover();
  }

  function ikat() {
    document.querySelectorAll("[data-tutup]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
    $("btnLog").addEventListener("click", async () => {
      if (S.sesi) { await sb.auth.signOut(); await semakSesi(); toast("Telah log keluar."); return; }
      $("logRalat").textContent = "";
      $("dLog").showModal();
    });
    $("fLog").addEventListener("submit", async (e) => {
      e.preventDefault();
      $("logRalat").textContent = "";
      const { error } = await sb.auth.signInWithPassword({
        email: $("logEmel").value.trim().toLowerCase(), password: $("logKata").value });
      if (error) { $("logRalat").textContent = "Log masuk gagal: " + error.message; return; }
      await semakSesi();
      $("dLog").close();
      $("logKata").value = "";
      toast(S.pentadbir ? "Log masuk berjaya. Anda boleh muat naik data." : "Log masuk berjaya, tetapi e-mel ini tiada kebenaran muat naik.", 5000);
    });
    $("btnCetak").addEventListener("click", () => window.print());
    $("sektorKad").addEventListener("click", (e) => { const b = e.target.closest("[data-sektor]"); if (b) klikTapis("_sektor4", b.dataset.sektor); });
    $("amaranPinda").addEventListener("click", () => { S.hanyaPinda = true; S.halaman = 0; tukarHalaman("rekod"); });
    $("btnPinda").addEventListener("click", () => { S.hanyaPinda = !S.hanyaPinda; S.halaman = 0; papar(); });
    $("btnPng").addEventListener("click", () => eksportPngRingkasan().catch((err) => alert("Gagal jana gambar: " + err.message)));
    $("btnMuatNaik").addEventListener("click", () => {
      $("fail").value = ""; hasilBaca = null; failDibaca = []; $("semakan").innerHTML = ""; $("mnRalat").textContent = "";
      $("btnSahMuatNaik").disabled = true;
      $("btnSahMuatNaik").textContent = "Simpan";
      $("bilSediaAda").textContent = fmtN.format(S.rekod.length);
      $("dMuatNaik").showModal();
      muatVersi();
    });
    $("fail").addEventListener("change", pilihFail);
    $("semakan").addEventListener("change", (e) => {
      if (e.target.dataset.jenis != null) { failDibaca[+e.target.dataset.jenis].jenis = e.target.value; sahAmaran = false; paparPratonton(); }
      else if (e.target.id === "sahAmaran") { sahAmaran = e.target.checked; paparPratonton(); }
    });
    $("senaraiVersi").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-pulih]");
      if (!b) return;
      if (!confirm("Pulihkan versi ini sebagai data aktif? Versi semasa disimpan sebagai versi lama.")) return;
      const { data: n, error } = await sb.rpc("pulihkan_muat_naik", { p_id: b.dataset.pulih });
      if (error) { toast("Gagal: " + error.message, 5000); return; }
      $("dMuatNaik").close();
      toast("Versi dipulihkan: " + fmtN.format(n) + " rekod.");
      S.muatNaik = null; await muatData();
    });
    const zon = document.querySelector(".zon-fail");
    ["dragenter", "dragover"].forEach((ev) => zon.addEventListener(ev, (e) => { e.preventDefault(); zon.classList.add("atas"); }));
    ["dragleave", "drop"].forEach((ev) => zon.addEventListener(ev, () => zon.classList.remove("atas")));
    zon.addEventListener("drop", (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) { $("fail").files = e.dataTransfer.files; pilihFail({ target: $("fail") }); }
    });
    $("btnSahMuatNaik").addEventListener("click", sahMuatNaik);
    $("btnMuatSemula").addEventListener("click", () => { S.muatNaik = null; muatData(); });
    $("btnTema").addEventListener("click", () => {
      const gelap = document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = gelap ? "light" : "dark";
      try { localStorage.setItem("sup_tema", document.documentElement.dataset.theme); } catch (e) { /* abaikan */ }
      if (S.rekod.length) papar();
    });

    // Tab
    document.querySelector(".tab").addEventListener("click", (e) => {
      const b = e.target.closest("[role=tab]");
      if (b) tukarHalaman(b.dataset.hal);
    });

    // Dropdown penapis
    document.addEventListener("click", (e) => {
      const dd = e.target.closest(".dd");
      if (dd && !dd.disabled) {
        if (ddAktif === dd.dataset.dd && !$("popover").hidden) tutupPopover(); else bukaPopover(dd);
        return;
      }
      if (!e.target.closest("#popover")) tutupPopover();
    });
    $("popover").addEventListener("change", (e) => {
      const t = e.target;
      if (t.type !== "checkbox") return;
      const s = new Set(S.tapis[ddAktif] || []);
      if (t.checked) s.add(t.value); else s.delete(t.value);
      setTapis(ddAktif, s);
    });
    $("popover").addEventListener("input", (e) => { if (e.target.type === "search") paparPopover(); });
    $("popover").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pv]");
      if (!b) return;
      if (b.dataset.pv === "kosong") setTapis(ddAktif, null);
      else {
        const q = ($("popover").querySelector("input").value || "").toLowerCase();
        const { nilai, kira } = nilaiPopover();
        setTapis(ddAktif, new Set(nilai.filter((v) => kira.get(v) && (!q || labelNilai(ddAktif, v).toLowerCase().includes(q)))));
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { tutupPopover(); bukaLaci(false); } });
    $("btnPenapisLain").addEventListener("click", () => bukaLaci(true));
    $("laciLatar").addEventListener("click", () => bukaLaci(false));
    document.querySelector("[data-tutup-laci]").addEventListener("click", () => bukaLaci(false));
    $("btnKosong").addEventListener("click", () => { S.tapis = {}; S.halaman = 0; papar(); });
    $("cip").addEventListener("click", (e) => {
      const d = e.target.dataset.buang;
      if (d) { delete S.tapis[d]; S.halaman = 0; papar(); }
    });

    // Peta
    $("pilihUkuranPeta").addEventListener("change", (e) => { S.petaUkuran = e.target.value; papar(); });
    $("tKedudukan").addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-mentah]");
      if (!tr) return;
      S.petaLabelTapis = tr.dataset.label;
      klikTapis(tr.dataset.lajur || lajurPeta(), JSON.parse(tr.dataset.mentah));
    });

    // Prestasi
    $("pilihDimensi").addEventListener("change", (e) => { S.dimensi = e.target.value; papar(); });
    segmen("segPeratus", (v) => { S.peratus = v === "1"; simpanPaparan(); papar(); });
    segmen("segUkurPrestasi", (v) => { S.ukurPrestasi = v; papar(); });
    segmen("segPaparanFe", (v) => { S.paparFe = v; papar(); });

    $("btnEksportSkor").addEventListener("click", () => unduh("kad-skor-" + new Date().toISOString().slice(0, 10) + ".csv", skorSemasa));

    // Nilai
    $("pilihUkuranSerak").addEventListener("change", (e) => { S.ukuranSerak = e.target.value; papar(); });
    $("ambang").addEventListener("change", (e) => {
      const v = Math.max(5, Math.min(1000, +e.target.value || 50)); S.ambang = v; e.target.value = v; simpanPaparan(); papar();
    });
    $("pilihDimIo").innerHTML = DIMENSI_IO.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
    $("pilihDimIo").addEventListener("change", (e) => { e.target.dataset.dipilih = "1"; papar(); });
    $("tigaKawal").addEventListener("input", (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      S.tigaLaras[k] = +e.target.value;
      kemaskiniKawal(k);
    });
    $("btnResetLaras").addEventListener("click", () => { S.tigaLaras = {}; paparKawal(); });
    let tundaTiga;
    $("tigaCari").addEventListener("input", (e) => { clearTimeout(tundaTiga); tundaTiga = setTimeout(() => { tigaQ = e.target.value; tigaHalRek = 0; paparTigaRekod(ditapis()); }, 200); });
    $("tigaSebelum").addEventListener("click", () => { tigaHalRek--; paparTigaRekod(ditapis()); });
    $("tigaSelepas").addEventListener("click", () => { tigaHalRek++; paparTigaRekod(ditapis()); });
    $("btnEksportTiga").addEventListener("click", eksportTiga);
    $("tTigaRekod").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) butiran(tr.dataset.id); });
    $("ioBawah1").addEventListener("change", () => { ioHal = 0; paparSenaraiIo(ditapis()); });
    let tundaIo;
    $("ioCari").addEventListener("input", () => { clearTimeout(tundaIo); tundaIo = setTimeout(() => { ioHal = 0; paparSenaraiIo(ditapis()); }, 200); });
    $("ioSebelum").addEventListener("click", () => { ioHal--; paparSenaraiIo(ditapis()); });
    $("ioSelepas").addEventListener("click", () => { ioHal++; paparSenaraiIo(ditapis()); });
    $("btnEksportIo").addEventListener("click", eksportIo);
    $("tIo").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) butiran(tr.dataset.id); });
    $("tSemakan").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) butiran(tr.dataset.id); });

    // Rekod
    let tunda;
    $("cari").addEventListener("input", (e) => {
      clearTimeout(tunda);
      tunda = setTimeout(() => { S.cari = e.target.value; S.halaman = 0; paparRekod(ditapis()); }, 200);
    });
    $("tRekod").addEventListener("click", (e) => {
      const th = e.target.closest("th[data-k]");
      if (th) {
        const k = th.dataset.k;
        if (S.susunK === k) S.susunArah *= -1; else { S.susunK = k; S.susunArah = 1; }
        paparRekod(ditapis());
        return;
      }
      const tr = e.target.closest("tr[data-id]");
      if (tr) butiran(tr.dataset.id);
    });
    $("pgSebelum").addEventListener("click", () => { S.halaman--; paparRekod(ditapis()); });
    $("pgSelepas").addEventListener("click", () => { S.halaman++; paparRekod(ditapis()); });
    $("btnEksport").addEventListener("click", eksportCsv);

    let saizTunda;
    window.addEventListener("resize", () => {
      clearTimeout(saizTunda);
      saizTunda = setTimeout(() => { tutupPopover(); if (S.rekod.length) paparHalaman(); }, 200);
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => S.rekod.length && papar());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) muatData(true); });
  }

  // ---------- Mula ----------
  async function mula() {
    const tajuk = cfg.TAJUK || "Dashboard Statistik Utama Pertubuhan";
    document.title = tajuk;
    $("tajuk").textContent = tajuk;
    try {
      const t = JSON.parse(localStorage.getItem("sup_paparan") || "{}");
      if (t.peratus != null) S.peratus = t.peratus;
      if (t.ambang != null) S.ambang = t.ambang;
      if (t.hal && document.querySelector(`.tab [data-hal="${t.hal}"]`)) S.hal = t.hal;
    } catch (e) { /* abaikan */ }
    $("ambang").value = S.ambang;
    $("segPeratus").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.v === "1") === S.peratus)));
    document.querySelectorAll(".tab [role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.hal === S.hal)));
    ikat();
    await semakSesi();
    await muatData();
    $("kakiMasa").textContent = "Dipaparkan " + new Date().toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" });
    if (cfg.SEMAK_SETIAP_SAAT > 0) setInterval(() => { if (!document.hidden) muatData(true); }, cfg.SEMAK_SETIAP_SAAT * 1000);
  }
  mula();
})();
