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
    ["kod_survei", "Kod Survei - Semasa", "t"],
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
    ["catatan_negeri", "Catatan Negeri", "t"],
    ["ditambah_oleh", "Ditambah oleh", "t"],
    ["dikemaskini_oleh", "Dikemaskini oleh", "t"],
    ["tarikh_dikemaskini", "Tarikh Dikemaskini", "t"],
  ];
  const JENIS = Object.fromEntries(LAJUR.map(([k, , j]) => [k, j]));
  const LABEL = Object.fromEntries(LAJUR.map(([k, l]) => [k, l]));

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
    catatannegeri: "catatan_negeri", ditambaholeh: "ditambah_oleh", dikemaskinioleh: "dikemaskini_oleh",
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
  function petaHeader(h) {
    const n = norm(h);
    if (!n) return null;
    if (HEADER_TETAP[n]) return HEADER_TETAP[n];
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
    { k: "A1", label: "A1 · Lengkap (11)", warna: "--s1" },
    { k: "LK", label: "LK · Lain-lain Keputusan", warna: "--s3" },
    { k: "50", label: "50 · Salah Penyiasatan", warna: "--s7" },
    { k: "KodB", label: "Kod B · Dalam proses (71–77)", warna: "--s4" },
    { k: "Lain", label: "Kod lain", warna: "--s5" },
    { k: "Belum", label: "Belum ada respon", warna: "--s0" },
  ];
  const KAT_LABEL = Object.fromEntries(KATEGORI.map((c) => [c.k, c.label]));
  const LK = new Set([12, 13, 14, 21, 22, 23, 31, 40]);
  function kategori(status) {
    const m = String(status == null ? "" : status).trim().match(/^(\d{1,3})/);
    if (!m) return String(status == null ? "" : status).trim() ? "Lain" : "Belum";
    const k = +m[1];
    if (k === 11) return "A1";
    if (LK.has(k)) return "LK";
    if (k === 50) return "50";
    if (k >= 71 && k <= 77) return "KodB";
    return "Lain";
  }

  // ---------- Keadaan ----------
  const S = {
    rekod: [], muatNaik: null, pentadbir: false, sesi: null,
    tapis: {},             // dim -> Set(nilai)
    hal: "ringkasan",
    dimensi: null, peratus: true, sasaran: 45, ambang: 50, ukuranSerak: "pendapatan",
    petaAras: "lokasi", petaUkuran: "kadar",
    cari: "", halaman: 0, susunK: null, susunArah: 1,
    carta: {},
  };
  const KOSONG = "(Tiada)";
  // Penapis utama (sentiasa kelihatan) dan penapis lain (dalam laci)
  const PENAPIS_UTAMA = [
    ["sektor", "Sektor"],
    ["subsektor", "Subsektor"],
    ["pegawai_kerja_luar", "Pegawai Kerja Luar"],
  ];
  const PENAPIS_LAIN = [
    ["_kat", "Kategori Respon"],
    ["penyelia", "Penyelia"],
    ["pegawai", "Pegawai"],
    ["daerah_lokasi_semasa", "Daerah Lokasi (Semasa)"],
    ["daerah_pos_semasa", "Daerah Pos (Semasa)"],
    ["pmks", "PMKS"],
    ["msic_3", "Kod Industri 3 digit"],
    ["pejabat_operasi", "Pejabat Perangkaan / Operasi"],
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
    ["penyelia", "Penyelia"],
    ["pegawai", "Pegawai"],
    ["sektor", "Sektor"],
    ["subsektor", "Subsektor"],
    ["pmks", "PMKS"],
    ["daerah_lokasi_semasa", "Daerah Lokasi"],
    ["daerah_pos_semasa", "Daerah Pos"],
    ["pejabat_operasi", "Pejabat Perangkaan"],
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
  const labelNilai = (d, v) => (d === "_kat" ? KAT_LABEL[v] || v : v);
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
    const o = { _n: R.length };
    for (const c of KATEGORI) o[c.k] = 0;
    for (const r of R) o[r._kat]++;
    o.siap = o._n - o.Belum;
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
      for (const r of semua) r._kat = kategori(r.status_respon_semasa);
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
      paparKpi(R); cartaKomposisi(R); cartaStatus(R); cartaTarikh(R); cartaKadarIkut(R);
      cartaBar("cCara", R, "cara_terima", 8);
      cartaBar("cPmks", R, adaLajur("pmks") ? "pmks" : "bbu_sbu", 8);
      paparMatriks(R); paparPenemuan(R);
    } else if (S.hal === "peta") paparPeta(R);
    else if (S.hal === "prestasi") { cartaDimensi(R); paparSkor(R); }
    else if (S.hal === "nilai") { paparKewangan(R); cartaSerak(R); paparSemakan(R); }
    else if (S.hal === "rekod") paparRekod(R);
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
    const kosong = !adaLajur(d) && d !== "_kat";
    return `<button type="button" class="dd${aktif ? " aktif" : ""}" data-dd="${d}"${kosong ? ' disabled title="Lajur ini tiada dalam data"' : ""}>` +
      `<span class="dd-label">${esc(label)}</span><span class="dd-nilai">${kosong ? "Tiada data" : esc(teksPilihan(d))}</span></button>`;
  }
  function paparPenapis() {
    $("penapisUtama").innerHTML = PENAPIS_UTAMA.map(([d, l]) => htmlDd(d, l)).join("");
    const lain = PENAPIS_LAIN.filter(([d]) => d === "_kat" || new Set(S.rekod.map((r) => nilaiDim(r, d))).size > 1 || S.tapis[d]);
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
  function paparKpi(R) {
    const k = kiraKat(R), n = k._n || 1;
    const kadar = k.siap / n;
    const C = 2 * Math.PI * 40;
    const sas = S.sasaran;
    const hero = `<div class="kpi kpi-hero">
      <svg class="cincin" viewBox="0 0 100 100" role="img" aria-label="Kadar respons ${fmtP(kadar)}">
        <circle class="lat" cx="50" cy="50" r="40" fill="none" stroke-width="10"/>
        <circle class="isi" cx="50" cy="50" r="40" fill="none" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, kadar))}" transform="rotate(-90 50 50)"/>
        <text x="50" y="57" text-anchor="middle">${Math.round(kadar * 100)}%</text>
      </svg>
      <div><div class="label">Kadar respons</div>
        <div class="nilai">${fmtN.format(k.siap)} <span style="font-size:15px;color:var(--muted);font-weight:600">/ ${fmtN.format(k._n)}</span></div>
        <div class="sub">${sas ? (kadar * 100 >= sas ? `<span class="naik">✓ Capai sasaran ${sas}%</span>` :
          `Perlu <b>${fmtN.format(Math.max(0, Math.ceil(sas / 100 * k._n) - k.siap))}</b> kes lagi untuk ${sas}%`) : "kes ada kod respon"}</div></div></div>`;
    const kad = [
      ["Jumlah pertubuhan", fmtN.format(k._n), "dalam tapisan semasa", null, "--ink-2"],
      ["A1 · Lengkap", fmtN.format(k.A1), fmtP(k.A1 / n) + " daripada jumlah", k.A1 / n, "--s1"],
      ["LK · Lain-lain Keputusan", fmtN.format(k.LK), fmtP(k.LK / n) + " daripada jumlah", k.LK / n, "--s3"],
      ["Kod B · Dalam proses", fmtN.format(k.KodB), fmtP(k.KodB / n) + " · perlu susulan", k.KodB / n, "--s4"],
      ["Belum ada respon", fmtN.format(k.Belum), fmtP(k.Belum / n) + " daripada jumlah", k.Belum / n, "--s0"],
    ];
    $("kpi").innerHTML = hero + kad.map(([l, v, s, p, c]) =>
      `<div class="kpi" style="--c:var(${c})"><div class="label"><i></i>${esc(l)}</div><div class="nilai">${v}</div>` +
      `<div class="sub">${esc(s)}</div>${p == null ? "" : `<div class="meter"><div style="width:${Math.min(100, p * 100)}%"></div></div>`}</div>`
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

  function cartaKomposisi(R) {
    const k = kiraKat(R), n = k._n || 1;
    const kat = KATEGORI.filter((c) => k[c.k]);
    const ch = carta("cKomposisi");
    ch.setOption({
      ...asasTema(),
      grid: { left: 0, right: 0, top: 4, bottom: 4 },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `${tanda(p.color)}<b>${esc(p.seriesName)}</b><br>${fmtN.format(k[kat[p.seriesIndex].k])} kes · ${fmtP(p.value / 100)}` },
      xAxis: { type: "value", max: 100, show: false },
      yAxis: { type: "category", data: ["Komposisi"], show: false },
      series: kat.map((c, i) => ({
        name: c.label, type: "bar", stack: "k", barWidth: 30,
        data: [Math.round((k[c.k] / n) * 1000) / 10],
        itemStyle: { color: css(c.warna), borderColor: css("--surface"), borderWidth: 2,
          borderRadius: [i === 0 ? 8 : 0, i === kat.length - 1 ? 8 : 0, i === kat.length - 1 ? 8 : 0, i === 0 ? 8 : 0] },
        label: { show: k[c.k] / n >= 0.07, position: "inside", color: "#fff", fontWeight: 700, fontSize: 12,
          formatter: () => c.label.split(" ·")[0] + "  " + fmtP(k[c.k] / n) },
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis("_kat", kat[p.seriesIndex].k));
  }

  function cartaStatus(R) {
    const kira = new Map();
    for (const r of R) {
      const v = r.status_respon_semasa == null || r.status_respon_semasa === "" ? KOSONG : String(r.status_respon_semasa);
      kira.set(v, (kira.get(v) || 0) + 1);
    }
    const susun = [...kira.entries()].sort((a, b) => (a[0] === KOSONG) - (b[0] === KOSONG) ||
      a[0].localeCompare(b[0], "ms", { numeric: true }));
    const katDari = (k) => KATEGORI.find((c) => c.k === kategori(k === KOSONG ? "" : k));
    const ch = carta("cStatus");
    ch.setOption({
      ...asasTema(),
      legend: { bottom: 0, left: "center", itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { color: css("--ink-2"), fontSize: 11.5 },
        data: KATEGORI.filter((c) => susun.some(([k]) => katDari(k).k === c.k)).map((c) => ({ name: c.label, itemStyle: { color: css(c.warna) } })) },
      grid: { left: 4, right: 8, top: 22, bottom: 36, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => `<b>Kod ${esc(p.name)}</b><br>${esc(katDari(p.name).label)}<br>${fmtN.format(p.value)} kes (${fmtP(p.value / R.length)})` },
      xAxis: { type: "category", data: susun.map((s) => s[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--muted"), fontSize: 11, interval: 0, rotate: susun.length > 14 ? 45 : 0,
          formatter: (v) => (v.length > 12 ? v.slice(0, 11) + "…" : v) } },
      yAxis: { type: "value", ...paksi() },
      series: KATEGORI.map((c) => ({
        name: c.label, type: "bar", stack: "s", barMaxWidth: 30,
        data: susun.map(([k, v]) => (katDari(k).k === c.k ? v : null)),
        itemStyle: { color: css(c.warna), borderRadius: [5, 5, 0, 0] },
        label: { show: susun.length <= 16, position: "top", color: css("--ink-2"), fontSize: 11, formatter: (p) => (p.value ? fmtN.format(p.value) : "") },
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis("status_respon_semasa", p.name));
  }

  function cartaTarikh(R) {
    const kira = new Map();
    for (const r of R) if (r.tarikh_terima) kira.set(r.tarikh_terima, (kira.get(r.tarikh_terima) || 0) + 1);
    const hari = [...kira.keys()].sort();
    const ch = carta("cTarikh");
    if (!hari.length) return kosongkanCarta(ch, "Tiada Tarikh Terima dalam tapisan");
    let k = 0;
    const kum = hari.map((h) => (k += kira.get(h)));
    const n = R.length || 1;
    const sas = S.sasaran;
    ch.setOption({
      ...asasTema(),
      grid: { left: 4, right: 48, top: 22, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "line", lineStyle: { color: css("--axis") } },
        formatter: (ps) => { const i = ps[0].dataIndex; return `<b>${tarikhPapar(hari[i])}</b><br>Diterima hari ini: ${fmtN.format(kira.get(hari[i]))}<br>Kumulatif: <b>${fmtN.format(kum[i])}</b> (${fmtP(kum[i] / n)})`; } },
      xAxis: { type: "category", data: hari.map(tarikhPapar), boundaryGap: false, ...paksi(), splitLine: { show: false } },
      yAxis: { type: "value", ...paksi(), max: (v) => Math.max(v.max, sas ? Math.ceil(sas / 100 * n) : 0) },
      series: [{ type: "line", data: kum, smooth: 0.2, showSymbol: hari.length <= 31, symbol: "circle", symbolSize: 7,
        lineStyle: { width: 2.5, color: css("--s1") }, itemStyle: { color: css("--s1"), borderColor: css("--surface"), borderWidth: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: css("--s1") + "40" }, { offset: 1, color: css("--s1") + "00" }]) },
        endLabel: { show: true, formatter: (p) => fmtN.format(p.value), color: css("--ink"), fontWeight: 700, fontSize: 12 },
        markLine: sas ? { symbol: "none", silent: true, lineStyle: { color: css("--bad"), type: "dashed", width: 1.5 },
          label: { formatter: `Sasaran ${sas}% (${fmtN.format(Math.ceil(sas / 100 * n))})`, color: css("--bad"), fontSize: 11, position: "insideStartTop" },
          data: [{ yAxis: Math.ceil(sas / 100 * n) }] } : undefined }],
    }, true);
  }

  // Kadar respons ikut sektor (atau lajur lain jika sektor tiada)
  function cartaKadarIkut(R) {
    const d = ["sektor", "subsektor", "msic_3", "kod_survei"].find(adaLajur) || "sektor";
    const tajuk = { sektor: "sektor", subsektor: "subsektor", msic_3: "kod industri (3 digit)", kod_survei: "kod survei" }[d];
    document.querySelector("#cSektor").closest(".kad").querySelector("h2").textContent = "Kadar respons ikut " + tajuk;
    const kumpul = kumpulKat(R, (r) => nilaiDim(r, d));
    let baris = [...kumpul.entries()].map(([k, rs]) => { const c = kiraKat(rs); return [k, c.siap / c._n, c]; })
      .sort((a, b) => b[2]._n - a[2]._n).slice(0, 12).sort((a, b) => a[1] - b[1]);
    const ch = carta("cSektor");
    const sas = S.sasaran;
    ch.setOption({
      ...asasTema(),
      grid: { left: 4, right: 70, top: 10, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => { const c = baris[p.dataIndex][2]; return `<b>${esc(p.name)}</b><br>Kadar respons: <b>${fmtP(c.siap / c._n)}</b><br>${fmtN.format(c.siap)} siap / ${fmtN.format(c._n)} kes<br>A1 ${fmtN.format(c.A1)} · LK ${fmtN.format(c.LK)} · Kod B ${fmtN.format(c.KodB)}`; } },
      xAxis: { type: "value", max: 100, ...paksi(), axisLabel: { ...paksi().axisLabel, formatter: "{value}%" } },
      yAxis: { type: "category", data: baris.map((b) => b[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--ink-2"), fontSize: 11.5, width: 150, overflow: "truncate" } },
      series: [{ type: "bar", barMaxWidth: 16, data: baris.map((b) => Math.round(b[1] * 1000) / 10),
        itemStyle: { color: css("--s1"), borderRadius: [0, 5, 5, 0] },
        showBackground: true, backgroundStyle: { color: css("--grid"), borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: "right", color: css("--ink-2"), fontSize: 11.5,
          formatter: (p) => p.value.toFixed(1) + "%  (" + fmtN.format(baris[p.dataIndex][2]._n) + ")" },
        markLine: sas ? { symbol: "none", silent: true, lineStyle: { color: css("--bad"), type: "dashed", width: 1.5 },
          label: { show: false }, data: [{ xAxis: sas }] } : undefined }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis(d, p.name));
  }

  function cartaBar(id, R, d, had) {
    const tajukEl = $(id).closest(".kad").querySelector("h2");
    if (id === "cPmks") tajukEl.textContent = d === "pmks" ? "Saiz pertubuhan (PMKS)" : "BBU / SBU";
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
        formatter: (p) => `<b>${esc(p.name)}</b><br>${fmtN.format(p.value)} kes (${fmtP(p.value / R.length)})` },
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

  function paparMatriks(R) {
    const k = KATEGORI.map((c) => c.k);
    const m = {}; for (const a of k) { m[a] = {}; for (const b of k) m[a][b] = 0; }
    for (const r of R) m[kategori(r.status_respon_sebelum)][r._kat]++;
    const maks = Math.max(1, ...k.flatMap((a) => k.map((b) => m[a][b])));
    const pendek = { A1: "A1", LK: "LK", "50": "50", KodB: "Kod B", Lain: "Lain", Belum: "Belum" };
    const biru = css("--s1");
    let h = `<table class="matriks"><thead><tr><th class="baris"></th>${k.map((b) => `<th>${pendek[b]}</th>`).join("")}</tr></thead><tbody>`;
    for (const a of k) {
      h += `<tr><th class="baris">${pendek[a]}</th>`;
      for (const b of k) {
        const v = m[a][b]; const t = v / maks;
        h += `<td style="background:color-mix(in srgb, ${biru} ${Math.round(6 + t * 80)}%, transparent);color:${t > 0.5 ? "#fff" : "inherit"}" title="Sebelum ${esc(KAT_LABEL[a])} → Semasa ${esc(KAT_LABEL[b])}: ${v}">${v ? fmtN.format(v) : "·"}</td>`;
      }
      h += "</tr>";
    }
    $("matriks").innerHTML = h + "</tbody></table>";
  }

  // ---------- Penemuan automatik ----------
  function paparPenemuan(R) {
    const out = [];
    const k = kiraKat(R), n = k._n;
    const sas = S.sasaran;
    const kadar = k.siap / (n || 1);
    if (sas) {
      out.push(kadar * 100 >= sas
        ? ["baik", "✓", `Kadar respons <b>${fmtP(kadar)}</b> telah melepasi sasaran ${sas}%.`]
        : ["amaran", "!", `Kadar respons <b>${fmtP(kadar)}</b>; perlu <b>${fmtN.format(Math.ceil(sas / 100 * n) - k.siap)}</b> kes lagi untuk capai sasaran ${sas}%.`]);
    }
    const terbaikTerendah = (d, nama, min) => {
      if (!adaLajur(d)) return;
      const g = [...kumpulKat(R, (r) => (r[d] == null || r[d] === "" ? null : String(r[d]))).entries()]
        .map(([v, rs]) => [v, kiraKat(rs)]).filter(([, c]) => c._n >= min);
      if (g.length < 2) return;
      g.sort((a, b) => b[1].siap / b[1]._n - a[1].siap / a[1]._n);
      const [t, ct] = g[0], [r, cr] = g[g.length - 1];
      out.push(["", "↑", `${nama} tertinggi: <b>${esc(t)}</b> (${fmtP(ct.siap / ct._n)}); terendah: <b>${esc(r)}</b> (${fmtP(cr.siap / cr._n)}, ${fmtN.format(cr.Belum)} kes belum).`]);
    };
    terbaikTerendah("pegawai_kerja_luar", "Pegawai Kerja Luar", 5);
    terbaikTerendah("daerah_lokasi_semasa", "Daerah", 5);
    if (k.KodB) out.push(["amaran", "B", `<b>${fmtN.format(k.KodB)}</b> kes masih Kod B (dalam proses) — perlu susulan sebelum boleh dikira siap.`]);
    const tarikh = R.map((r) => r.tarikh_terima).filter(Boolean).sort();
    if (tarikh.length) {
      const akhir = new Date(tarikh[tarikh.length - 1] + "T00:00:00");
      const h7 = new Date(akhir); h7.setDate(h7.getDate() - 6);
      const h14 = new Date(akhir); h14.setDate(h14.getDate() - 13);
      const iso = (d) => d.toISOString().slice(0, 10);
      const ini = tarikh.filter((t) => t >= iso(h7)).length;
      const lepas = tarikh.filter((t) => t >= iso(h14) && t < iso(h7)).length;
      const ub = lepas ? (ini - lepas) / lepas : NaN;
      out.push([isFinite(ub) && ub < 0 ? "amaran" : "baik", "⏱", `7 hari terakhir (hingga ${tarikhPapar(iso(akhir))}): <b>${fmtN.format(ini)}</b> borang diterima` +
        (isFinite(ub) ? `, ${ub >= 0 ? "naik" : "turun"} ${fmtP(Math.abs(ub))} berbanding 7 hari sebelumnya.` : ".")]);
    }
    const p = R.filter((r) => r.pendapatan_sebelum > 0 && r.pendapatan_semasa != null).map((r) => r.pendapatan_semasa / r.pendapatan_sebelum - 1);
    if (p.length >= 5) out.push(["", "RM", `Median perubahan pendapatan: <b>${(median(p) >= 0 ? "+" : "") + fmtP(median(p))}</b> (${fmtN.format(p.length)} pertubuhan padan).`]);
    const semak = kesSemakan(R).length;
    if (semak) out.push(["amaran", "?", `<b>${fmtN.format(semak)}</b> rekod berubah lebih ±${S.ambang}% berbanding penyiasatan sebelum — lihat tab <b>Analisis Nilai</b>.`]);
    $("penemuan").innerHTML = out.slice(0, 7).map(([j, t, h]) => `<li><span class="tanda ${j}">${t}</span><span>${h}</span></li>`).join("") ||
      '<li class="nota">Tiada penemuan untuk tapisan ini.</li>';
  }

  // ---------- Peta ----------
  let GEO = null;
  const normNama = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/^\s*\d+\s*[-–:.)]?\s*/, "")
    .replace(/wilayah persekutuan|w\.\s*p\.?|\bwp\b|\bdaerah\b|\bbahagian\b|\bjajahan\b/g, "")
    .replace(/\bhulu\b/g, "ulu").replace(/\bpulau pinang\b/g, "pulaupinang").replace(/\bpenang\b/g, "pulaupinang")
    .replace(/\bmalacca\b/g, "melaka").replace(/[^a-z0-9]/g, "");
  async function muatGeo() {
    if (GEO) return GEO;
    const [d, n] = await Promise.all([fetch("peta/daerah.json").then((r) => r.json()), fetch("peta/negeri.json").then((r) => r.json())]);
    const idxD = new Map(), idxN = new Map(), kodD = new Map(), kodN = new Map();
    for (const f of d.features) {
      const p = f.properties;
      p.name = p.code_state + "_" + p.code_district;
      p.label = p.district;
      kodD.set(p.name, f);
      const k = normNama(p.district);
      if (!idxD.has(k)) idxD.set(k, []);
      idxD.get(k).push(f);
    }
    for (const f of n.features) {
      const p = f.properties;
      p.name = String(p.code_state);
      p.label = p.state;
      kodN.set(p.name, f);
      idxN.set(normNama(p.state), f);
    }
    GEO = { d, n, idxD, idxN, kodD, kodN };
    return GEO;
  }
  function padanNegeri(v) {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2})\b/);
    if (m && GEO.kodN.has(String(+m[1]))) return GEO.kodN.get(String(+m[1]));
    return GEO.idxN.get(normNama(s)) || null;
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
    const nn = GEO.idxN.get(normNama(s));   // cth. "Kuala Lumpur" -> daerah W.P. Kuala Lumpur
    if (nn) { const c = GEO.d.features.filter((f) => f.properties.code_state === nn.properties.code_state); if (c.length === 1) return c[0]; }
    return null;
  }
  function lajurPeta() {
    if (S.petaAras === "negeri") return "negeri";
    return S.petaAras === "pos" ? "daerah_pos_semasa" : "daerah_lokasi_semasa";
  }
  function nilaiUkuran(c) {
    const n = c._n || 1;
    return { kadar: (c.siap / n) * 100, jumlah: c._n, siap: c.siap, belum: c.Belum, a1: (c.A1 / n) * 100 }[S.petaUkuran];
  }
  const UKURAN_PETA = { kadar: ["Kadar respons", true], jumlah: ["Jumlah kes", false], siap: ["Kes siap", false], belum: ["Belum ada respon", false], a1: ["A1", true] };

  async function paparPeta(R) {
    const ch = carta("cPeta");
    try { await muatGeo(); } catch (e) { kosongkanCarta(ch, "Fail peta tidak dapat dimuatkan"); return; }
    if (S.hal !== "peta") return;
    const negeriAras = S.petaAras === "negeri";
    const lajur = lajurPeta();
    // Padankan setiap nilai mentah kepada poligon
    const padan = new Map(), tak = new Map();   // kunci poligon -> {rs, mentah:Set}
    for (const r of R) {
      const v = r[lajur];
      const f = negeriAras ? padanNegeri(v) : padanDaerah(v, r.negeri);
      if (!f) { const k = v == null || v === "" ? KOSONG : String(v); tak.set(k, (tak.get(k) || []).concat([r])); continue; }
      const k = f.properties.name;
      if (!padan.has(k)) padan.set(k, { f, rs: [], mentah: new Set() });
      const o = padan.get(k); o.rs.push(r); o.mentah.add(v == null || v === "" ? KOSONG : String(v));
    }
    // Kawasan peta: negeri yang ada data (aras daerah), seluruh Malaysia (aras negeri)
    let ciri;
    if (negeriAras) ciri = GEO.n.features;
    else {
      const negeri = new Set([...padan.values()].map((o) => o.f.properties.code_state));
      // KL & Putrajaya terlalu kecil untuk berdiri sendiri — papar bersama Selangor sebagai konteks
      const kodSel = GEO.n.features.find((f) => normNama(f.properties.state) === "selangor");
      if (kodSel && [...negeri].some((k) => GEO.n.features.some((f) => f.properties.code_state === k && /kualalumpur|putrajaya/.test(normNama(f.properties.state)))))
        negeri.add(kodSel.properties.code_state);
      ciri = negeri.size ? GEO.d.features.filter((f) => negeri.has(f.properties.code_state)) : GEO.d.features;
    }
    const namaPeta = "peta_" + (negeriAras ? "negeri" : [...new Set(ciri.map((f) => f.properties.code_state))].sort().join("-"));
    if (!echarts.getMap(namaPeta)) echarts.registerMap(namaPeta, { type: "FeatureCollection", features: ciri });
    const [labelUk, pct] = UKURAN_PETA[S.petaUkuran];
    const data = [...padan.entries()].map(([k, o]) => { const c = kiraKat(o.rs); return { name: k, value: Math.round(nilaiUkuran(c) * 10) / 10, c, mentah: [...o.mentah], label: o.f.properties.label }; });
    const nilai = data.map((d) => d.value);
    // Julat ikut data supaya beza antara kawasan jelas (seperti Power BI)
    let min = nilai.length ? Math.min(...nilai) : 0, maks = nilai.length ? Math.max(...nilai) : 1;
    if (pct) { min = Math.max(0, Math.floor(min / 5) * 5); maks = Math.min(100, Math.ceil(maks / 5) * 5); }
    else { min = 0; }
    if (maks <= min) maks = min + 1;
    const labelDari = new Map(ciri.map((f) => [f.properties.name, f.properties.label]));
    S.petaData = data;
    ch.setOption({
      ...asasTema(),
      tooltip: { ...tooltipAsas(), trigger: "item",
        formatter: (p) => {
          const d = p.data;
          if (!d) return `<b>${esc(labelDari.get(p.name) || p.name)}</b><br><span style="color:${css("--muted")}">Tiada kes dalam tapisan</span>`;
          const c = d.c;
          return `<b>${esc(d.label)}</b><br>${labelUk}: <b>${pct ? d.value.toFixed(1) + "%" : fmtN.format(d.value)}</b><br>` +
            `Jumlah ${fmtN.format(c._n)} · Siap ${fmtN.format(c.siap)} (${fmtP(c.siap / c._n)})<br>A1 ${fmtN.format(c.A1)} · LK ${fmtN.format(c.LK)} · Kod B ${fmtN.format(c.KodB)} · Belum ${fmtN.format(c.Belum)}`;
        } },
      visualMap: { type: "continuous", min, max: maks, calculable: false, orient: "horizontal", left: 8, bottom: 6,
        itemWidth: 12, itemHeight: Math.max(90, Math.min(180, $("cPeta").clientWidth - 230)), text: [pct ? maks + "%" : fmtN.format(maks), (pct ? min + "%" : "0") + "  " + labelUk], textStyle: { color: css("--ink-2"), fontSize: 11.5 },
        inRange: { color: [css("--seq-1"), css("--seq-2"), css("--seq-3"), css("--seq-4"), css("--seq-5")] } },
      series: [{
        type: "map", map: namaPeta, roam: true, scaleLimit: { min: 0.8, max: 12 }, selectedMode: false,
        layoutCenter: ["50%", "48%"], layoutSize: "92%",
        itemStyle: { areaColor: css("--surface-2"), borderColor: css("--border-strong"), borderWidth: 0.8 },
        emphasis: { itemStyle: { areaColor: css("--gold") || "#c99a2e", borderColor: css("--ink"), borderWidth: 1.2 },
          label: { show: true, color: css("--ink"), fontWeight: 700, fontSize: 12 } },
        label: { show: ciri.length <= 40, color: css("--ink"), fontSize: 11, fontWeight: 600, textBorderColor: css("--surface"), textBorderWidth: 2.5,
          formatter: (p) => (p.data ? (labelDari.get(p.name) || "").replace(/^W\.P\. /, "") : "") },
        data,
      }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => {
      if (!p.data) return;
      S.petaLabelTapis = p.data.label;
      klikTapis(lajur, p.data.mentah);
    });
    // Nota padanan
    const takN = [...tak.values()].reduce((a, b) => a + b.length, 0);
    $("petaSub").textContent = (negeriAras ? "Ikut negeri" : "Ikut " + LABEL[lajur]) + " · klik kawasan untuk tapis · tatal untuk zum";
    $("petaNota").innerHTML = takN
      ? `⚠ ${fmtN.format(takN)} kes (${fmtN.format(tak.size)} nilai) tidak dapat dipadankan dengan sempadan peta: ${[...tak.keys()].slice(0, 6).map(esc).join(", ")}${tak.size > 6 ? "…" : ""}`
      : (data.length === 1 && !negeriAras ? "Semua kes berada dalam satu daerah pentadbiran. Sempadan rasmi DOSM tidak memecahkan W.P. Kuala Lumpur kepada daerah kecil." : "Sumber sempadan: OpenDOSM.");
    // Jadual kedudukan (termasuk nilai yang tidak dipadankan)
    const baris = data.map((d) => [d.label, d.c, d.mentah, true]).concat([...tak.entries()].map(([k, rs]) => [k, kiraKat(rs), [k], false]));
    baris.sort((a, b) => b[1].siap / b[1]._n - a[1].siap / a[1]._n || b[1]._n - a[1]._n);
    $("kedudukanSub").textContent = "Disusun ikut kadar respons · " + fmtN.format(baris.length) + " kawasan";
    $("tKedudukan").innerHTML = `<thead><tr><th>#</th><th>${negeriAras ? "Negeri" : "Daerah"}</th><th class="num">Kes</th><th>Kadar respons</th></tr></thead><tbody>` +
      baris.map(([l, c, , ok], i) => `<tr data-mentah="${esc(JSON.stringify([...([].concat(baris[i][2]))]))}" data-label="${esc(l)}" class="${ok ? "" : "tiada-peta"}" style="cursor:pointer">` +
        `<td class="num">${i + 1}</td><td>${esc(l)}${ok ? "" : ' <span class="nota" title="Tiada di peta">⚠</span>'}</td><td class="num">${fmtN.format(c._n)}</td>` +
        `<td><span class="bar-mini"><i style="width:${(c.siap / c._n) * 100}%"></i></span>${fmtP(c.siap / c._n)}</td></tr>`).join("") + "</tbody>";
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
    const kumpul = new Map();
    for (const r of R) {
      const v = nilaiDim(r, d);
      if (!kumpul.has(v)) kumpul.set(v, Object.fromEntries(KATEGORI.map((c) => [c.k, 0])));
      kumpul.get(v)[r._kat]++;
    }
    const jumlah = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    const peratusSiap = (o) => (jumlah(o) - o.Belum) / jumlah(o);
    let baris = [...kumpul.entries()].sort((a, b) => jumlah(b[1]) - jumlah(a[1])).slice(0, 30);
    if (S.peratus) baris.sort((a, b) => peratusSiap(b[1]) - peratusSiap(a[1]));
    baris.reverse();
    const kat = KATEGORI.filter((c) => baris.some(([, o]) => o[c.k]));
    const pc = S.peratus, sas = S.sasaran;
    const el = $("cDimensi");
    const sempit = el.clientWidth < 640;
    const atas = sempit ? 84 : 40;
    el.style.height = Math.max(260, baris.length * 30 + atas + 40) + "px";
    const ch = carta("cDimensi");
    ch.resize();
    ch.setOption({
      ...asasTema(),
      legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { color: css("--ink-2"), fontSize: 11.5 } },
      grid: { left: 4, right: 70, top: atas, bottom: 4, containLabel: true },
      tooltip: { ...tooltipAsas(), trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: css("--accent-soft") } },
        formatter: (ps) => {
          const o = kumpul.get(ps[0].name); const t = jumlah(o); const siap = t - o.Belum;
          return `<b>${esc(ps[0].name)}</b><br>Jumlah ${fmtN.format(t)} · Siap <b>${fmtN.format(siap)}</b> (${fmtP(siap / t)})<br>` +
            (sas ? (siap / t * 100 >= sas ? `<span style="color:${css("--good")}">✓ Capai sasaran ${sas}%</span>` : `Baki ke sasaran ${sas}%: <b>${fmtN.format(Math.max(0, Math.ceil(sas / 100 * t) - siap))}</b> kes`) + "<br>" : "") +
            KATEGORI.filter((c) => o[c.k]).map((c) => `${tanda(css(c.warna))}${esc(c.label)}: ${fmtN.format(o[c.k])} (${fmtP(o[c.k] / t)})`).join("<br>");
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
          formatter: (p) => fmtP(peratusSiap(kumpul.get(p.name))) } : undefined,
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => klikTapis(d, p.name));
  }
  let skorSemasa = [];
  function paparSkor(R) {
    const d = S.dimensi;
    const label = (DIMENSI.find((x) => x[0] === d) || [d, d])[1];
    const g = [...kumpulKat(R, (r) => nilaiDim(r, d)).entries()].map(([v, rs]) => [v, kiraKat(rs)])
      .sort((a, b) => b[1].siap / b[1]._n - a[1].siap / a[1]._n || b[1]._n - a[1]._n);
    const sas = S.sasaran;
    const baki = (c) => Math.max(0, Math.ceil((sas / 100) * c._n) - c.siap);
    const T = kiraKat(R);
    skorSemasa = [[label, "Jumlah", "Siap", "% Siap", "A1", "LK", "50", "Kod B", "Belum", "Baki ke sasaran"]]
      .concat(g.map(([v, c]) => [v, c._n, c.siap, (c.siap / c._n * 100).toFixed(1), c.A1, c.LK, c["50"], c.KodB, c.Belum, sas ? baki(c) : ""]));
    const capai = g.filter(([, c]) => sas && c.siap / c._n * 100 >= sas).length;
    $("skorSub").textContent = sas ? `${capai} daripada ${g.length} capai sasaran ${sas}%` : `${g.length} kumpulan`;
    const sel = (c) => `<td class="num">${fmtN.format(c._n)}</td><td class="num">${fmtN.format(c.siap)}</td>` +
      `<td><span class="bar-mini"><i style="width:${Math.min(100, c.siap / c._n * 100)}%"></i></span>${fmtP(c.siap / c._n)}</td>` +
      `<td class="num">${fmtN.format(c.A1)}</td><td class="num">${fmtN.format(c.LK)}</td><td class="num">${fmtN.format(c["50"])}</td>` +
      `<td class="num">${fmtN.format(c.KodB)}</td><td class="num">${fmtN.format(c.Belum)}</td><td class="num">${sas ? fmtN.format(baki(c)) : "–"}</td>`;
    $("tSkor").innerHTML = `<thead><tr><th>#</th><th>${esc(label)}</th><th class="num">Jumlah</th><th class="num">Siap</th><th>% Siap</th>` +
      `<th class="num">A1</th><th class="num">LK</th><th class="num">50</th><th class="num">Kod B</th><th class="num">Belum</th><th class="num">Baki</th><th>Status</th></tr></thead><tbody>` +
      g.map(([v, c], i) => `<tr><td class="num">${i + 1}</td><td><b>${esc(v)}</b></td>${sel(c)}<td>${statusSasaran(c.siap / c._n)}</td></tr>`).join("") +
      `<tr class="jumlah"><td></td><td>Jumlah</td>${sel(T)}<td>${statusSasaran(T.siap / (T._n || 1))}</td></tr></tbody>`;
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
    ["daerah_lokasi_semasa", "Daerah Lokasi"], ["msic_5", "Kod Industri"], ["status_respon_semasa", "Status Semasa"], ["status_respon_sebelum", "Status Sebelum"],
    ["status_rekod", "Status Rekod"], ["tarikh_terima", "Tarikh Terima"], ["pendapatan_semasa", "Pendapatan Semasa"],
    ["pekerja_semasa", "Pekerja Semasa"],
  ];
  const SAIZ_HAL = 50;
  let lajurJadual = LAJUR_JADUAL;
  let paparanSemasa = [];
  function rekodCarian(R) {
    const q = S.cari.trim().toLowerCase();
    let x = q ? R.filter((r) => [r.no_id, r.nama, r.no_siri, r.pegawai_kerja_luar].some((v) => v != null && String(v).toLowerCase().includes(q))) : R.slice();
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
    $("butiranIsi").innerHTML = LAJUR.map(([k, l, j]) => {
      const v = r[k];
      const t = v == null || v === "" ? "–" : j === "n" ? fmtN.format(v) : j === "d" ? tarikhPapar(v) : v;
      return `<dt>${esc(l)}</dt><dd>${esc(t)}</dd>`;
    }).join("") + `<dt>Kategori respon</dt><dd>${esc(KAT_LABEL[r._kat])}</dd>`;
    $("dButiran").showModal();
  }
  function eksportCsv() {
    const x = paparanSemasa;
    const sel = (v) => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const baris = [LAJUR.map((l) => sel(l[1])).join(",")].concat(x.map((r) => LAJUR.map(([k]) => sel(r[k])).join(",")));
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
    let terbaik = null;
    for (const nama of wb.SheetNames) {
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[nama], { header: 1, raw: true, defval: null, blankrows: false });
      for (let i = 0; i < Math.min(30, aoa.length); i++) {
        const peta = (aoa[i] || []).map(petaHeader);
        const skor = new Set(peta.filter(Boolean)).size;
        if (skor >= 3 && (!terbaik || skor > terbaik.skor)) terbaik = { skor, aoa, i, peta, helaian: nama };
      }
    }
    if (!terbaik) throw new Error("Header tidak dijumpai. Pastikan baris header mengandungi lajur seperti 'NO ID', 'Nama Pendaftaran', 'Status Respon Lawatan Semasa'.");
    const { aoa, i, peta } = terbaik;
    const header = aoa[i];
    const guna = new Map();   // kunci -> indeks lajur pertama
    const tidakDikenal = [];
    peta.forEach((k, idx) => {
      if (k && !guna.has(k)) guna.set(k, idx);
      else if (!k && header[idx] != null && String(header[idx]).trim()) tidakDikenal.push(String(header[idx]).trim());
    });
    const rekod = [];
    for (let b = i + 1; b < aoa.length; b++) {
      const row = aoa[b];
      if (!row || row.every((v) => v == null || String(v).trim() === "")) continue;
      const r = {};
      for (const [k, idx] of guna) r[k] = tukarNilai(k, row[idx]);
      if (!r.no_id && !r.nama && !r.no_siri) continue;   // baris jumlah / nota
      if (!r.msic_3 && r.msic_5) r.msic_3 = String(r.msic_5).replace(/\D/g, "").slice(0, 3) || null;
      rekod.push(r);
    }
    const hilang = LAJUR.map((l) => l[0]).filter((k) => !guna.has(k) && !(k === "msic_3" && guna.has("msic_5")));
    return { rekod, hilang, tidakDikenal, helaian: terbaik.helaian, nama: fail.name };
  }

  // ---------- Muat naik ----------
  let hasilBaca = null;
  async function pilihFail(e) {
    const f = e.target.files[0];
    hasilBaca = null;
    $("btnSahMuatNaik").disabled = true;
    $("mnRalat").textContent = "";
    $("semakan").innerHTML = "";
    if (!f) return;
    $("semakan").textContent = "Membaca fail…";
    try {
      const h = await bacaFail(f);
      if (!h.rekod.length) throw new Error("Tiada baris data dijumpai di bawah header.");
      hasilBaca = h;
      const kat = {}; for (const r of h.rekod) { const k = kategori(r.status_respon_semasa); kat[k] = (kat[k] || 0) + 1; }
      const tTidakSah = h.rekod.filter((r) => r.tarikh_terima == null).length;
      $("semakan").innerHTML =
        `<p><strong>${fmtN.format(h.rekod.length)}</strong> rekod dijumpai (helaian: ${esc(h.helaian)}).</p>` +
        `<ul><li>Lajur dikenal pasti: ${LAJUR.length - h.hilang.length} / ${LAJUR.length}</li>` +
        `<li>Kategori respon: ${KATEGORI.filter((c) => kat[c.k]).map((c) => esc(c.label.split(" ·")[0]) + " " + fmtN.format(kat[c.k])).join(", ")}</li>` +
        `<li>Rekod tanpa Tarikh Terima: ${fmtN.format(tTidakSah)}</li></ul>` +
        (h.hilang.includes("status_respon_semasa") ? `<p class="amaran">Lajur "Status Respon Lawatan Semasa" tidak dijumpai — kategori respon tidak dapat dikira.</p>` : "") +
        (h.hilang.length ? `<p class="nota">Lajur tiada dalam fail ini (dibiarkan kosong): ${h.hilang.map((k) => esc(LABEL[k])).join("; ")}</p>` : "") +
        (h.tidakDikenal.length ? `<p class="nota">Header diabaikan: ${h.tidakDikenal.map(esc).join("; ")}</p>` : "") +
        (S.rekod.length ? `<p>Data semasa (${fmtN.format(S.rekod.length)} rekod) akan <strong>diganti</strong>.</p>` : "");
      $("btnSahMuatNaik").disabled = false;
    } catch (err) {
      $("semakan").innerHTML = "";
      $("mnRalat").textContent = err.message || String(err);
    }
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
    try { localStorage.setItem("sup_paparan", JSON.stringify({ sasaran: S.sasaran, peratus: S.peratus, ambang: S.ambang, hal: S.hal })); } catch (e) { /* abaikan */ }
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
    $("btnMuatNaik").addEventListener("click", () => {
      $("fail").value = ""; hasilBaca = null; $("semakan").innerHTML = ""; $("mnRalat").textContent = "";
      $("btnSahMuatNaik").disabled = true;
      $("dMuatNaik").showModal();
    });
    $("fail").addEventListener("change", pilihFail);
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
    segmen("segPetaAras", (v) => { S.petaAras = v; papar(); });
    $("pilihUkuranPeta").addEventListener("change", (e) => { S.petaUkuran = e.target.value; papar(); });
    $("tKedudukan").addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-mentah]");
      if (!tr) return;
      S.petaLabelTapis = tr.dataset.label;
      klikTapis(lajurPeta(), JSON.parse(tr.dataset.mentah));
    });

    // Prestasi
    $("pilihDimensi").addEventListener("change", (e) => { S.dimensi = e.target.value; papar(); });
    segmen("segPeratus", (v) => { S.peratus = v === "1"; simpanPaparan(); papar(); });
    $("sasaran").addEventListener("change", (e) => {
      const v = Math.max(0, Math.min(100, +e.target.value || 0)); S.sasaran = v; e.target.value = v; simpanPaparan(); papar();
    });
    $("btnEksportSkor").addEventListener("click", () => unduh("kad-skor-" + new Date().toISOString().slice(0, 10) + ".csv", skorSemasa));

    // Nilai
    $("pilihUkuranSerak").addEventListener("change", (e) => { S.ukuranSerak = e.target.value; papar(); });
    $("ambang").addEventListener("change", (e) => {
      const v = Math.max(5, Math.min(1000, +e.target.value || 50)); S.ambang = v; e.target.value = v; simpanPaparan(); papar();
    });
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
      if (t.sasaran != null) S.sasaran = t.sasaran;
      if (t.peratus != null) S.peratus = t.peratus;
      if (t.ambang != null) S.ambang = t.ambang;
      if (t.hal && document.querySelector(`.tab [data-hal="${t.hal}"]`)) S.hal = t.hal;
    } catch (e) { /* abaikan */ }
    $("sasaran").value = S.sasaran;
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
