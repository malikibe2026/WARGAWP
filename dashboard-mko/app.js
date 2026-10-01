// Dashboard MKO — baca data aktif dari Supabase, tapis silang ala Power BI, muat naik fail ganti data.
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
    { k: "LK", label: "LK · Layak Kira", warna: "--s3" },
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
    dimensi: null, peratus: false, sasaran: 45,
    cari: "", halaman: 0, susunK: null, susunArah: 1,
    carta: {},
  };
  const KOSONG = "(Tiada)";
  const SLICER = [
    ["_kat", "Kategori Respon"],
    ["pegawai_kerja_luar", "Pegawai Kerja Luar"],
    ["penyelia", "Penyelia"],
    ["pegawai", "Pegawai"],
    ["pejabat_operasi", "Pejabat Perangkaan / Operasi"],
    ["daerah_lokasi_semasa", "Daerah Lokasi (Semasa)"],
    ["daerah_pos_semasa", "Daerah Pos (Semasa)"],
    ["kod_survei", "Kod Banci / Survei"],
    ["sektor", "Sektor"],
    ["subsektor", "Subsektor"],
    ["msic_3", "Kod Industri 3 digit"],
    ["pmks", "PMKS"],
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

  // ---------- Muat data ----------
  async function muatData(senyap) {
    try {
      const { data: mn, error: e1 } = await sb.from("muat_naik").select("*")
        .eq("status", "aktif").order("created_at", { ascending: false }).limit(1);
      if (e1) throw e1;
      const aktif = mn && mn[0];
      if (senyap && aktif && S.muatNaik && aktif.id === S.muatNaik.id) return;
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
      sediaDimensi();
      bersihTapisLapuk();
      papar();
      if (senyap) toast("Data terkini dimuatkan (" + fmtN.format(semua.length) + " rekod).");
    } catch (e) {
      console.error(e);
      $("info").textContent = "Gagal memuatkan data: " + (e.message || e);
    }
  }
  // Pilihan "ikut" hanya untuk lajur yang ada >1 nilai dalam data semasa
  function sediaDimensi() {
    const ada = DIMENSI.filter(([k]) => new Set(S.rekod.map((r) => nilaiDim(r, k))).size > 1);
    const senarai = ada.length ? ada : DIMENSI.slice(0, 1);
    if (!senarai.some(([k]) => k === S.dimensi)) S.dimensi = senarai[0][0];
    const pilih = $("pilihDimensi");
    pilih.innerHTML = senarai.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
    pilih.value = S.dimensi;
    lajurJadual = LAJUR_JADUAL.filter(([k]) => S.rekod.some((r) => r[k] != null && r[k] !== ""));
  }
  function bersihTapisLapuk() {
    for (const d of Object.keys(S.tapis)) {
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
  function togolTapis(d, v, tunggal) {
    const s = S.tapis[d] || new Set();
    if (tunggal && !(s.size === 1 && s.has(v))) { s.clear(); s.add(v); }
    else if (s.has(v)) s.delete(v); else s.add(v);
    if (s.size) S.tapis[d] = s; else delete S.tapis[d];
    S.halaman = 0;
    papar();
  }

  // ---------- Paparan ----------
  function papar() {
    const mn = S.muatNaik;
    $("info").textContent = mn
      ? "Data: " + (mn.nama_fail || "–") + " · " + fmtN.format(S.rekod.length) + " rekod · dikemas kini " +
        new Date(mn.created_at).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })
      : "Belum ada data dimuat naik";
    const ada = S.rekod.length > 0;
    $("kosong").hidden = ada;
    document.querySelector(".grid").hidden = !ada;
    $("kpi").hidden = !ada;
    paparSlicer();
    paparCip();
    if (!ada) return;
    const R = ditapis();
    paparKpi(R);
    cartaDimensi(R);
    cartaStatus(R);
    cartaTarikh(R);
    cartaBar("cCara", R, "cara_terima", 12);
    cartaBar("cRekod", R, "status_rekod", 12);
    cartaBar("cMsic", R, "msic_3", 10);
    paparMatriks(R);
    paparKewangan(R);
    paparRekod(R);
  }

  function paparKpi(R) {
    const n = R.length;
    const kira = {}; for (const c of KATEGORI) kira[c.k] = 0;
    for (const r of R) kira[r._kat]++;
    const siap = n - kira.Belum;
    const terima = R.filter((r) => r.tarikh_terima).length;
    const kad = [
      ["Jumlah kes", fmtN.format(n), "rekod dalam tapisan", null, "--ink-2"],
      ["Siap (ada kod respon)", fmtN.format(siap), fmtP(siap / n) + " daripada jumlah", siap / n, "--s1"],
      ["A1 · Lengkap", fmtN.format(kira.A1), fmtP(kira.A1 / n), kira.A1 / n, "--s1"],
      ["LK · Layak Kira", fmtN.format(kira.LK), fmtP(kira.LK / n), kira.LK / n, "--s3"],
      ["Kod B · Dalam proses", fmtN.format(kira.KodB), fmtP(kira.KodB / n), kira.KodB / n, "--s4"],
      ["Borang diterima", fmtN.format(terima), "ada Tarikh Terima · " + fmtP(terima / n), terima / n, "--s7"],
    ];
    $("kpi").innerHTML = kad.map(([l, v, s, p, c]) =>
      `<div class="kpi" style="--c:var(${c})"><div class="label">${esc(l)}</div><div class="nilai">${v}</div>` +
      `<div class="sub">${esc(s)}</div>${p == null ? "" : `<div class="meter"><div style="width:${Math.min(100, p * 100)}%"></div></div>`}</div>`
    ).join("");
  }

  function paparSlicer() {
    const bekas = $("slicerSenarai");
    const buka = new Set([...bekas.querySelectorAll("details[open]")].map((x) => x.dataset.d));
    const cariLama = {};
    bekas.querySelectorAll("input[type=search]").forEach((i) => (cariLama[i.dataset.d] = i.value));
    const html = [];
    for (const [d, label] of SLICER) {
      const asas = ditapis(d);
      const kira = new Map();
      for (const r of S.rekod) kira.set(nilaiDim(r, d), 0);
      if (kira.size <= 1 && !S.tapis[d]) continue;   // tiada pilihan bermakna
      for (const r of asas) { const v = nilaiDim(r, d); kira.set(v, kira.get(v) + 1); }
      let nilai = [...kira.keys()];
      if (d === "_kat") nilai = KATEGORI.map((c) => c.k).filter((k) => kira.has(k));
      else nilai.sort((a, b) => kira.get(b) - kira.get(a) || a.localeCompare(b, "ms", { numeric: true }));
      const pilih = S.tapis[d];
      const q = (cariLama[d] || "").toLowerCase();
      const item = nilai.filter((v) => !q || labelNilai(d, v).toLowerCase().includes(q)).map((v) =>
        `<label class="sl-item${kira.get(v) ? "" : " sifar"}"><input type="checkbox" data-d="${d}" value="${esc(v)}"${pilih && pilih.has(v) ? " checked" : ""}>` +
        `<span class="t" title="${esc(labelNilai(d, v))}">${esc(labelNilai(d, v))}</span><span class="n">${fmtN.format(kira.get(v))}</span></label>`
      ).join("");
      html.push(`<details class="sl" data-d="${d}"${buka.has(d) || pilih ? " open" : ""}><summary><span>${esc(label)}</span>` +
        `${pilih ? `<span class="aktif">${pilih.size} dipilih</span>` : `<span class="nota">${nilai.length}</span>`}</summary>` +
        `<div class="sl-badan">${nilai.length > 8 ? `<input type="search" data-d="${d}" placeholder="Cari…" value="${esc(cariLama[d] || "")}">` : ""}` +
        `<div class="sl-senarai">${item}</div></div></details>`);
    }
    bekas.innerHTML = html.join("") || '<p class="nota">Tiada penapis.</p>';
  }

  function paparCip() {
    const c = [];
    for (const d in S.tapis) {
      const label = (SLICER.find((x) => x[0] === d) || [d, d])[1];
      const v = [...S.tapis[d]].map((x) => labelNilai(d, x));
      c.push(`<span class="cip"><strong>${esc(label)}:</strong> ${esc(v.length > 3 ? v.slice(0, 3).join(", ") + " +" + (v.length - 3) : v.join(", "))}` +
        `<button data-buang="${d}" aria-label="Buang penapis">×</button></span>`);
    }
    $("cip").innerHTML = c.join("");
  }

  // ---------- Carta ----------
  function carta(id) {
    if (!S.carta[id]) {
      S.carta[id] = echarts.init($(id), null, { renderer: "svg" });
    }
    return S.carta[id];
  }
  function asasTema() {
    return {
      textStyle: { fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: css("--ink-2") },
      tooltip: {
        backgroundColor: css("--surface"), borderColor: css("--border"), textStyle: { color: css("--ink"), fontSize: 12 },
        extraCssText: "box-shadow:0 4px 16px rgba(0,0,0,.15);border-radius:6px;",
      },
      animationDuration: 300,
    };
  }
  const paksi = () => ({
    axisLine: { lineStyle: { color: css("--axis") } }, axisTick: { show: false },
    axisLabel: { color: css("--muted"), fontSize: 11 }, splitLine: { lineStyle: { color: css("--grid") } },
  });

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
    let baris = [...kumpul.entries()].sort((a, b) => jumlah(b[1]) - jumlah(a[1])).slice(0, 25);
    if (S.peratus) baris.sort((a, b) => peratusSiap(b[1]) - peratusSiap(a[1]));
    baris.reverse();
    const kat = KATEGORI.filter((c) => baris.some(([, o]) => o[c.k]));
    const pc = S.peratus;
    const sas = S.sasaran;
    const ch = carta("cDimensi");
    const sempit = $("cDimensi").clientWidth < 640;
    const atas = sempit ? 78 : 34;
    $("cDimensi").style.height = Math.max(240, baris.length * 26 + atas + 46) + "px";
    ch.resize();
    ch.setOption({
      ...asasTema(),
      legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: css("--ink-2"), fontSize: 11 } },
      grid: { left: 8, right: 64, top: atas, bottom: 8, containLabel: true },
      tooltip: { ...asasTema().tooltip, trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (ps) => {
          const o = kumpul.get(ps[0].name); const t = jumlah(o); const siap = t - o.Belum;
          return `<strong>${esc(ps[0].name)}</strong><br>Jumlah: ${fmtN.format(t)} · Siap: ${fmtN.format(siap)} (${fmtP(siap / t)})<br>` +
            (pc && sas ? (siap / t * 100 >= sas ? "✓ CAPAI sasaran " : "Bawah sasaran ") + sas + "% · baki " + fmtN.format(Math.max(0, Math.round(sas / 100 * t) - siap)) + " kes<br>" : "") +
            KATEGORI.filter((c) => o[c.k]).map((c) => `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${css(c.warna)}"></span>${esc(c.label)}: ${fmtN.format(o[c.k])} (${fmtP(o[c.k] / t)})`).join("<br>");
        } },
      xAxis: { type: "value", ...paksi(), max: pc ? 100 : null,
        axisLabel: { ...paksi().axisLabel, formatter: pc ? "{value}%" : null } },
      yAxis: { type: "category", data: baris.map((b) => b[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--ink-2"), fontSize: 11, width: 170, overflow: "truncate",
          formatter: (v) => { const o = kumpul.get(v); const t = jumlah(o); return (pc && sas && (t - o.Belum) / t * 100 >= sas ? "✓ " : "") + v; } } },
      series: kat.map((c, i) => ({
        name: c.label, type: "bar", stack: "s", barMaxWidth: 18,
        itemStyle: { color: css(c.warna), borderColor: css("--surface"), borderWidth: 1,
          borderRadius: i === kat.length - 1 ? [0, 4, 4, 0] : 0 },
        emphasis: { focus: "series" },
        data: baris.map(([, o]) => (pc ? Math.round((o[c.k] / jumlah(o)) * 1000) / 10 : o[c.k])),
        markLine: i === 0 && pc && sas ? { symbol: "none", silent: true,
          lineStyle: { color: css("--bad"), type: "dashed", width: 2 },
          label: { formatter: "Sasaran " + sas + "%", color: css("--bad"), fontSize: 11, position: "end" },
          data: [{ xAxis: sas }] } : undefined,
        label: i === kat.length - 1 ? {
          show: true, position: "right", color: css("--ink-2"), fontSize: 11,
          formatter: (p) => { const o = kumpul.get(p.name); const t = jumlah(o); return fmtP((t - o.Belum) / t); },
        } : undefined,
      })),
    }, true);
    ch.off("click");
    ch.on("click", (p) => togolTapis(d, p.name, true));
  }

  function cartaStatus(R) {
    const kira = new Map();
    for (const r of R) {
      const v = r.status_respon_semasa == null || r.status_respon_semasa === "" ? KOSONG : String(r.status_respon_semasa);
      kira.set(v, (kira.get(v) || 0) + 1);
    }
    const susun = [...kira.entries()].sort((a, b) => (a[0] === KOSONG) - (b[0] === KOSONG) ||
      a[0].localeCompare(b[0], "ms", { numeric: true }));
    const ch = carta("cStatus");
    ch.setOption({
      ...asasTema(),
      grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
      tooltip: { ...asasTema().tooltip, trigger: "item",
        formatter: (p) => `<strong>${esc(p.name)}</strong><br>${esc(KAT_LABEL[kategori(p.name === KOSONG ? "" : p.name)])}<br>${fmtN.format(p.value)} rekod (${fmtP(p.value / R.length)})` },
      xAxis: { type: "category", data: susun.map((s) => s[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--muted"), fontSize: 11, interval: 0, rotate: susun.length > 10 ? 45 : 0,
          formatter: (v) => (v.length > 14 ? v.slice(0, 13) + "…" : v) } },
      yAxis: { type: "value", ...paksi() },
      series: [{ type: "bar", barMaxWidth: 28,
        data: susun.map(([k, v]) => ({ value: v, itemStyle: { color: css(KATEGORI.find((c) => c.k === kategori(k === KOSONG ? "" : k)).warna), borderRadius: [4, 4, 0, 0] } })),
        label: { show: susun.length <= 14, position: "top", color: css("--ink-2"), fontSize: 11, formatter: (p) => fmtN.format(p.value) } }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => togolTapis("status_respon_semasa", p.name, true));
  }

  function cartaTarikh(R) {
    const kira = new Map();
    for (const r of R) if (r.tarikh_terima) kira.set(r.tarikh_terima, (kira.get(r.tarikh_terima) || 0) + 1);
    const hari = [...kira.keys()].sort();
    let k = 0;
    const kum = hari.map((h) => (k += kira.get(h)));
    const ch = carta("cTarikh");
    ch.setOption({
      ...asasTema(),
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: { ...asasTema().tooltip, trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: css("--axis") } },
        formatter: (ps) => `<strong>${tarikhPapar(hari[ps[0].dataIndex])}</strong><br>Diterima hari ini: ${fmtN.format(kira.get(hari[ps[0].dataIndex]))}<br>Kumulatif: ${fmtN.format(ps[0].value)} (${fmtP(ps[0].value / R.length)})` },
      xAxis: { type: "category", data: hari.map(tarikhPapar), boundaryGap: false, ...paksi(), splitLine: { show: false } },
      yAxis: { type: "value", ...paksi() },
      series: [{ type: "line", data: kum, smooth: false, symbol: "circle", symbolSize: hari.length > 40 ? 0 : 8,
        lineStyle: { width: 2, color: css("--s1") }, itemStyle: { color: css("--s1"), borderColor: css("--surface"), borderWidth: 2 },
        areaStyle: { color: css("--s1"), opacity: 0.10 } }],
      graphic: hari.length ? [] : [{ type: "text", left: "center", top: "middle",
        style: { text: "Tiada Tarikh Terima dalam tapisan", fill: css("--muted"), fontSize: 12 } }],
    }, true);
  }

  function cartaBar(id, R, d, had) {
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
      grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...asasTema().tooltip, trigger: "item",
        formatter: (p) => `<strong>${esc(p.name)}</strong><br>${fmtN.format(p.value)} rekod (${fmtP(p.value / R.length)})` },
      xAxis: { type: "value", ...paksi() },
      yAxis: { type: "category", data: s.map((x) => x[0]), ...paksi(), splitLine: { show: false },
        axisLabel: { color: css("--ink-2"), fontSize: 11, width: 130, overflow: "truncate" } },
      series: [{ type: "bar", barMaxWidth: 16, data: s.map((x) => x[1]),
        itemStyle: { color: css("--s1"), borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: "right", color: css("--ink-2"), fontSize: 11, formatter: (p) => fmtN.format(p.value) } }],
    }, true);
    ch.off("click");
    ch.on("click", (p) => { if (p.name !== "Lain-lain") togolTapis(d, p.name, true); });
  }

  function paparMatriks(R) {
    const k = KATEGORI.map((c) => c.k);
    const m = {}; for (const a of k) { m[a] = {}; for (const b of k) m[a][b] = 0; }
    for (const r of R) m[kategori(r.status_respon_sebelum)][r._kat]++;
    const maks = Math.max(1, ...k.flatMap((a) => k.map((b) => m[a][b])));
    const pendek = { A1: "A1", LK: "LK", "50": "50", KodB: "Kod B", Lain: "Lain", Belum: "Belum" };
    const biru = css("--s1");
    let h = `<table class="matriks"><thead><tr><th class="baris">Sebelum ↓ / Semasa →</th>${k.map((b) => `<th>${pendek[b]}</th>`).join("")}</tr></thead><tbody>`;
    for (const a of k) {
      h += `<tr><th class="baris">${pendek[a]}</th>`;
      for (const b of k) {
        const v = m[a][b]; const t = v / maks;
        h += `<td style="background:color-mix(in srgb, ${biru} ${Math.round(t * 85)}%, transparent);color:${t > 0.5 ? "#fff" : "inherit"}" title="Sebelum ${esc(KAT_LABEL[a])} → Semasa ${esc(KAT_LABEL[b])}: ${v}">${v ? fmtN.format(v) : "·"}</td>`;
      }
      h += "</tr>";
    }
    $("matriks").innerHTML = h + "</tbody></table>";
  }

  function paparKewangan(R) {
    let h = `<thead><tr><th>Item</th><th class="num">Bil. rekod padan</th><th class="num">Sebelum</th><th class="num">Semasa</th><th class="num">Perubahan</th><th class="num">Jumlah semasa (semua rekod)</th></tr></thead><tbody>`;
    for (const [k, label, rm] of UKURAN) {
      let n = 0, a = 0, b = 0, semua = 0;
      for (const r of R) {
        const s0 = r[k + "_sebelum"], s1 = r[k + "_semasa"];
        if (s1 != null) semua += +s1;
        if (s0 != null && s1 != null) { n++; a += +s0; b += +s1; }
      }
      const ub = a ? (b - a) / Math.abs(a) : NaN;
      const kelas = !isFinite(ub) ? "" : ub >= 0 ? "naik" : "turun";
      h += `<tr><td>${esc(label)}</td><td class="num">${fmtN.format(n)}</td><td class="num">${n ? ringkas(a, rm) : "–"}</td><td class="num">${n ? ringkas(b, rm) : "–"}</td>` +
        `<td class="num ${kelas}">${isFinite(ub) ? (ub >= 0 ? "▲ " : "▼ ") + fmtP(Math.abs(ub)) : "–"}</td><td class="num">${ringkas(semua, rm)}</td></tr>`;
    }
    $("tKewangan").innerHTML = h + "</tbody>";
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
    $("btnSahMuatNaik").addEventListener("click", sahMuatNaik);
    $("btnMuatSemula").addEventListener("click", () => { S.muatNaik = null; muatData(); });

    $("slicerSenarai").addEventListener("change", (e) => {
      const t = e.target;
      if (t.type === "checkbox") togolTapis(t.dataset.d, t.value, false);
    });
    $("slicerSenarai").addEventListener("input", (e) => {
      const t = e.target;
      if (t.type !== "search") return;
      const q = t.value.toLowerCase();
      t.closest(".sl-badan").querySelectorAll(".sl-item").forEach((el) => {
        el.hidden = !el.textContent.toLowerCase().includes(q);
      });
    });
    $("btnKosong").addEventListener("click", () => { S.tapis = {}; S.halaman = 0; papar(); });
    $("cip").addEventListener("click", (e) => {
      const d = e.target.dataset.buang;
      if (d) { delete S.tapis[d]; S.halaman = 0; papar(); }
    });
    $("btnSlicer").addEventListener("click", () => $("slicer").classList.toggle("buka"));
    document.addEventListener("click", (e) => {
      const sl = $("slicer");
      if (sl.classList.contains("buka") && !sl.contains(e.target) && e.target !== $("btnSlicer")) sl.classList.remove("buka");
    });

    const pilih = $("pilihDimensi");
    pilih.addEventListener("change", () => { S.dimensi = pilih.value; papar(); });
    try {
      const t = JSON.parse(localStorage.getItem("mko_paparan") || "{}");
      if (t.sasaran != null) S.sasaran = t.sasaran;
      if (t.peratus != null) S.peratus = t.peratus;
    } catch (e) { /* abaikan */ }
    const simpanPaparan = () => { try { localStorage.setItem("mko_paparan", JSON.stringify({ sasaran: S.sasaran, peratus: S.peratus })); } catch (e) { /* abaikan */ } };
    $("modPeratus").checked = S.peratus;
    $("sasaran").value = S.sasaran;
    $("modPeratus").addEventListener("change", (e) => { S.peratus = e.target.checked; simpanPaparan(); papar(); });
    $("sasaran").addEventListener("change", (e) => {
      const v = Math.max(0, Math.min(100, +e.target.value || 0)); S.sasaran = v; e.target.value = v; simpanPaparan(); papar();
    });

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
      saizTunda = setTimeout(() => Object.values(S.carta).forEach((c) => c.resize()), 150);
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => S.rekod.length && papar());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) muatData(true); });
  }

  // ---------- Mula ----------
  async function mula() {
    document.title = cfg.TAJUK || "Dashboard MKO";
    $("tajuk").textContent = cfg.TAJUK || "Dashboard MKO";
    $("btnMuatNaik").hidden = true;
    ikat();
    sb.auth.onAuthStateChange(() => {});
    await semakSesi();
    await muatData();
    if (cfg.SEMAK_SETIAP_SAAT > 0) setInterval(() => { if (!document.hidden) muatData(true); }, cfg.SEMAK_SETIAP_SAAT * 1000);
  }
  mula();
})();
