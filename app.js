// Logik antara muka Direktori Warga.
(function () {
  const cfg = window.WARGA_CONFIG || {};
  const $ = s => document.querySelector(s);
  const TANPA_GAMBAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe6ee"/>' +
    '<circle cx="50" cy="38" r="18" fill="#9fb0c3"/><path d="M16 92c4-20 18-30 34-30s30 10 34 30z" fill="#9fb0c3"/></svg>');

  // Gambar yang gagal dimuat (cth. belum dimuat naik) diganti dengan ikon lalai.
  document.addEventListener("error", e => {
    if (e.target.tagName === "IMG" && e.target.src !== TANPA_GAMBAR) e.target.src = TANPA_GAMBAR;
  }, true);

  const keadaan = { data: [], urutanUnit: new Map(), admin: false, paparan: "grid", sedangEdit: null, gambarBaru: undefined };

  // ---------- Utiliti ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function toast(msg, ralat) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (ralat ? " error" : "");
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 3500);
  }

  function formatTarikh(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }

  function nomborGred(g) {
    const m = String(g || "").match(/(\d+)/);
    return m ? +m[1] : -1;
  }

  function telLink(no) {
    return no ? `<a href="tel:${esc(no.replace(/[^\d+]/g, ""))}">${esc(no)}</a>` : "";
  }

  // ---------- Muat & papar ----------
  async function muat() {
    try {
      keadaan.data = await Store.senarai();
    } catch (e) {
      keadaan.data = [];
      toast("Gagal memuatkan data: " + e.message, true);
    }
    isiPilihan();
    papar();
  }

  // Kedudukan unit dalam carta = nombor susunan terkecil ahlinya.
  function urutanUnit(unit) {
    const m = keadaan.urutanUnit.get(unit || "");
    return m == null ? Infinity : m;
  }

  function isiPilihan() {
    keadaan.urutanUnit = new Map();
    for (const r of keadaan.data) {
      const k = r.unit || "", v = r.susunan ?? Infinity;
      if (!keadaan.urutanUnit.has(k) || v < keadaan.urutanUnit.get(k)) keadaan.urutanUnit.set(k, v);
    }
    const unik = k => [...new Set(keadaan.data.map(r => r[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ms"));
    const units = unik("unit").sort((a, b) => urutanUnit(a) - urutanUnit(b) || a.localeCompare(b, "ms"));
    const sel = $("#tapisUnit"), pilihan = sel.value;
    sel.innerHTML = '<option value="">Semua Bahagian / Unit</option>' +
      units.map(u => `<option>${esc(u)}</option>`).join("");
    sel.value = units.includes(pilihan) ? pilihan : "";
    $("#senaraiUnit").innerHTML = units.map(u => `<option value="${esc(u)}">`).join("");
    $("#senaraiJawatan").innerHTML = unik("jawatan").map(u => `<option value="${esc(u)}">`).join("");
  }

  function ditapis() {
    const q = $("#carian").value.trim().toLowerCase();
    const unit = $("#tapisUnit").value;
    const susun = $("#susun").value;
    let hasil = keadaan.data.filter(r => {
      if (unit && r.unit !== unit) return false;
      if (!q) return true;
      return ["nama", "jawatan", "gred", "unit", "telefon_pejabat", "telefon_bimbit", "emel"]
        .some(k => String(r[k] || "").toLowerCase().includes(q));
    });
    const ikutNama = (a, b) => (a.nama || "").localeCompare(b.nama || "", "ms");
    const ikutCarta = (a, b) => urutanUnit(a.unit) - urutanUnit(b.unit)
      || (a.susunan ?? Infinity) - (b.susunan ?? Infinity) || ikutNama(a, b);
    hasil.sort(susun === "carta" ? ikutCarta
      : susun === "unit" ? (a, b) => (a.unit || "~").localeCompare(b.unit || "~", "ms") || ikutNama(a, b)
      : susun === "gred" ? (a, b) => nomborGred(b.gred) - nomborGred(a.gred) || ikutNama(a, b)
      : ikutNama);
    return hasil;
  }

  function teksUmur(r) {
    const u = Umur.umurDaripadaTarikh(r.tarikh_lahir);
    return u == null ? "" : `${u} tahun`;
  }

  function papar() {
    const hasil = ditapis();
    const bekas = $("#senarai");
    const jumlah = keadaan.data.length;
    $("#ringkasan").textContent = jumlah
      ? `Memaparkan ${hasil.length} daripada ${jumlah} warga.` : "";

    const kosong = $("#kosong");
    if (!hasil.length) {
      bekas.innerHTML = "";
      kosong.hidden = false;
      kosong.innerHTML = jumlah ? "Tiada padanan untuk carian ini."
        : keadaan.admin ? "Direktori masih kosong. Klik <b>+ Tambah Warga</b> atau <b>Import CSV</b> untuk mula."
        : "Direktori masih kosong. Log masuk sebagai pentadbir untuk menambah warga.";
      return;
    }
    kosong.hidden = true;

    if (keadaan.paparan === "table") {
      bekas.className = "table-wrap";
      bekas.innerHTML = `<table class="jadual"><thead><tr>
        <th></th><th>Nama</th><th>Jawatan / Gred</th><th>Bahagian / Unit</th>
        <th>Tel. Pejabat</th><th>Tel. Bimbit</th><th>E-mel</th><th>Umur</th></tr></thead><tbody>` +
        hasil.map(r => `<tr data-id="${esc(r.id)}">
          <td><img class="avatar sm" src="${esc(r.gambar_url || TANPA_GAMBAR)}" alt=""></td>
          <td class="nama">${esc(r.nama)}</td>
          <td>${esc(r.jawatan)}${r.gred ? ` <span class="gred">${esc(r.gred)}</span>` : ""}</td>
          <td>${esc(r.unit)}</td>
          <td>${telLink(r.telefon_pejabat)}</td>
          <td>${telLink(r.telefon_bimbit)}</td>
          <td>${r.emel ? `<a href="mailto:${esc(r.emel)}">${esc(r.emel)}</a>` : ""}</td>
          <td>${teksUmur(r) || '<span class="muted">—</span>'}</td>
        </tr>`).join("") + "</tbody></table>";
    } else {
      bekas.className = "grid";
      const berkumpulan = ["carta", "unit"].includes($("#susun").value);
      let unitSebelum;
      bekas.innerHTML = hasil.map(r => (berkumpulan && r.unit !== unitSebelum
          ? `<h2 class="kumpulan">${esc((unitSebelum = r.unit) || "Tiada unit")}</h2>` : "") + `
        <article class="kad" data-id="${esc(r.id)}" tabindex="0">
          <img class="avatar" src="${esc(r.gambar_url || TANPA_GAMBAR)}" alt="Gambar ${esc(r.nama)}" loading="lazy">
          <div class="kad-isi">
            <h3>${esc(r.nama)}</h3>
            <p class="jawatan">${esc(r.jawatan || "")}${r.gred ? ` <span class="gred">${esc(r.gred)}</span>` : ""}</p>
            ${r.unit && !berkumpulan ? `<p class="unit">${esc(r.unit)}</p>` : ""}
            <p class="hubungi">
              ${r.telefon_pejabat ? `<span>☎ ${telLink(r.telefon_pejabat)}</span>` : ""}
              ${r.telefon_bimbit ? `<span>📱 ${telLink(r.telefon_bimbit)}</span>` : ""}
            </p>
            ${r.emel ? `<p class="emel"><a href="mailto:${esc(r.emel)}">${esc(r.emel)}</a></p>` : ""}
          </div>
          ${keadaan.admin ? `<button class="btn small edit" data-edit="${esc(r.id)}" title="Kemas kini">✎</button>` : ""}
        </article>`).join("");
    }
  }

  function cari(id) { return keadaan.data.find(r => r.id === id); }

  function bukaButiran(id) {
    const r = cari(id);
    if (!r) return;
    const baris = (label, nilai) => nilai ? `<dt>${label}</dt><dd>${nilai}</dd>` : "";
    $("#butiranIsi").innerHTML = `
      <div class="butiran">
        <img class="avatar xl" src="${esc(r.gambar_url || TANPA_GAMBAR)}" alt="Gambar ${esc(r.nama)}">
        <div>
          <h2>${esc(r.nama)}</h2>
          <p class="jawatan">${esc(r.jawatan || "")}${r.gred ? ` <span class="gred">${esc(r.gred)}</span>` : ""}</p>
          <dl>
            ${baris("Bahagian / Unit", esc(r.unit))}
            ${baris("Tel. Pejabat", telLink(r.telefon_pejabat))}
            ${baris("Tel. Bimbit", telLink(r.telefon_bimbit))}
            ${baris("E-mel", r.emel ? `<a href="mailto:${esc(r.emel)}">${esc(r.emel)}</a>` : "")}
            <dt>Umur</dt><dd>${teksUmur(r) || '<span class="muted">Belum dikemas kini</span>'}</dd>
            ${baris("Tarikh Lapor Diri", formatTarikh(r.tarikh_lapor_diri))}
            ${baris("Catatan", esc(r.catatan))}
          </dl>
          ${r.updated_at ? `<p class="hint">Dikemas kini: ${new Date(r.updated_at).toLocaleString("ms-MY")}</p>` : ""}
        </div>
      </div>`;
    const btn = $("#btnEditDariButiran");
    btn.hidden = !keadaan.admin;
    btn.onclick = () => { $("#dlgButiran").close(); bukaBorang(id); };
    $("#dlgButiran").showModal();
  }

  // ---------- Borang ----------
  function bukaBorang(id) {
    const r = id ? cari(id) : null;
    keadaan.sedangEdit = r;
    keadaan.gambarBaru = undefined;
    const f = $("#borang");
    f.reset();
    for (const k of Store.MEDAN) if (f.elements[k]) f.elements[k].value = r?.[k] ?? "";
    $("#inputIC").value = "";
    $("#icInfo").textContent = r?.tarikh_lahir ? `Umur semasa: ${teksUmur(r)}` : "";
    $("#pratonton").src = r?.gambar_url || TANPA_GAMBAR;
    $("#borangTajuk").textContent = r ? "Kemas Kini Maklumat Warga" : "Tambah Warga";
    $("#btnPadam").hidden = !r;
    $("#borangRalat").hidden = true;
    $("#dlgBorang").showModal();
    f.elements.nama.focus();
  }

  function kemasIC() {
    const ic = $("#inputIC").value;
    const info = $("#icInfo");
    if (!Umur.bersihkanIC(ic)) { info.textContent = ""; return; }
    const lahir = Umur.tarikhLahirDaripadaIC(ic);
    if (!lahir) { info.textContent = "No. KP tidak sah (perlu 12 digit, tarikh lahir betul)."; info.className = "hint error"; return; }
    $("#borang").elements.tarikh_lahir.value = Umur.keISO(lahir);
    info.textContent = `Tarikh lahir ${formatTarikh(Umur.keISO(lahir))} — umur ${Umur.umurDaripadaTarikh(lahir)} tahun`;
    info.className = "hint ok";
  }

  // Kecilkan gambar ke maks 400px (JPEG) sebelum simpan.
  function kecilkanGambar(fail, maks = 400) {
    return new Promise((ok, gagal) => {
      const img = new Image();
      img.onload = () => {
        const skala = Math.min(1, maks / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * skala);
        c.height = Math.round(img.height * skala);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(b => b ? ok(b) : gagal(new Error("Gagal memproses gambar")), "image/jpeg", 0.82);
      };
      img.onerror = () => gagal(new Error("Fail bukan gambar yang sah"));
      img.src = URL.createObjectURL(fail);
    });
  }

  async function simpanBorang(e) {
    e.preventDefault();
    const f = $("#borang");
    const ralat = $("#borangRalat");
    const rekod = {};
    for (const k of Store.MEDAN) if (f.elements[k]) rekod[k] = f.elements[k].value;
    if (!rekod.nama.trim()) { ralat.textContent = "Nama wajib diisi."; ralat.hidden = false; return; }
    if (rekod.emel && !f.elements.emel.checkValidity()) { ralat.textContent = "Format e-mel tidak sah."; ralat.hidden = false; return; }

    const btn = $("#btnSimpan");
    btn.disabled = true; btn.textContent = "Menyimpan…";
    try {
      rekod.gambar_url = keadaan.sedangEdit?.gambar_url || "";
      if (keadaan.gambarBaru === null) rekod.gambar_url = "";
      else if (keadaan.gambarBaru) rekod.gambar_url = await Store.muatNaikGambar(keadaan.gambarBaru);
      if (keadaan.sedangEdit) rekod.id = keadaan.sedangEdit.id;
      await Store.simpan(rekod);
      $("#dlgBorang").close();
      toast("Maklumat disimpan.");
      await muat();
    } catch (err) {
      ralat.textContent = err.message; ralat.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = "Simpan";
    }
  }

  async function padamRekod() {
    const r = keadaan.sedangEdit;
    if (!r || !confirm(`Padam ${r.nama} daripada direktori? Tindakan ini tidak boleh dibatalkan.`)) return;
    try {
      await Store.padam(r.id);
      $("#dlgBorang").close();
      toast("Rekod dipadam.");
      await muat();
    } catch (err) { toast(err.message, true); }
  }

  // ---------- CSV ----------
  const LAJUR_CSV = [
    ["nama", "Nama"], ["jawatan", "Jawatan"], ["gred", "Gred"], ["unit", "Unit"],
    ["telefon_pejabat", "Tel Pejabat"], ["telefon_bimbit", "Tel Bimbit"], ["emel", "Emel"],
    ["tarikh_lahir", "Tarikh Lahir"], ["tarikh_lapor_diri", "Tarikh Lapor Diri"], ["catatan", "Catatan"], ["susunan", "Susunan"],
  ];

  function huraiCSV(teks) {
    const baris = [];
    let medan = "", rekod = [], petik = false;
    teks = teks.replace(/^﻿/, "");
    const pemisah = (teks.split("\n")[0].match(/;/g) || []).length > (teks.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    for (let i = 0; i < teks.length; i++) {
      const c = teks[i];
      if (petik) {
        if (c === '"' && teks[i + 1] === '"') { medan += '"'; i++; }
        else if (c === '"') petik = false;
        else medan += c;
      } else if (c === '"') petik = true;
      else if (c === pemisah) { rekod.push(medan); medan = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && teks[i + 1] === "\n") i++;
        rekod.push(medan); baris.push(rekod); rekod = []; medan = "";
      } else medan += c;
    }
    if (medan || rekod.length) { rekod.push(medan); baris.push(rekod); }
    return baris.filter(r => r.some(x => x.trim()));
  }

  // Terima tarikh "YYYY-MM-DD" atau "DD/MM/YYYY".
  function normalTarikh(s) {
    s = String(s || "").trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return "";
  }

  async function importCSV(fail) {
    const baris = huraiCSV(await fail.text());
    if (baris.length < 2) return toast("Fail CSV kosong atau tiada data.", true);
    const kunci = s => s.toLowerCase().replace(/[^a-z]/g, "");
    const peta = {};
    for (const [k, label] of LAJUR_CSV) { peta[kunci(k)] = k; peta[kunci(label)] = k; }
    Object.assign(peta, { bahagian: "unit", bahagianunit: "unit", email: "emel", telefon: "telefon_pejabat",
      nokp: "_ic", noic: "_ic", ic: "_ic", nokadpengenalan: "_ic" });
    const lajur = baris[0].map(h => peta[kunci(h)] || null);
    if (!lajur.includes("nama")) return toast("Lajur 'Nama' tidak dijumpai dalam baris pertama CSV.", true);

    const rekods = baris.slice(1).map(b => {
      const r = {};
      lajur.forEach((k, i) => { if (k) r[k] = (b[i] || "").trim(); });
      if (r._ic && !r.tarikh_lahir) {
        const lahir = Umur.tarikhLahirDaripadaIC(r._ic);
        if (lahir) r.tarikh_lahir = Umur.keISO(lahir);
      }
      delete r._ic;
      for (const t of ["tarikh_lahir", "tarikh_lapor_diri"]) if (r[t]) r[t] = normalTarikh(r[t]);
      return r;
    }).filter(r => r.nama);

    if (!confirm(`Import ${rekods.length} rekod baharu? (Rekod sedia ada tidak diubah.)`)) return;
    try {
      await Store.simpanBanyak(rekods);
      toast(`${rekods.length} rekod diimport.`);
      await muat();
    } catch (err) { toast("Import gagal: " + err.message, true); }
  }

  function eksportCSV() {
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const kandungan = [LAJUR_CSV.map(([, l]) => q(l)).join(",")]
      .concat(ditapis().map(r => LAJUR_CSV.map(([k]) => q(r[k])).join(","))).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + kandungan], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), {
      href: url, download: `direktori-warga-dosm-kl-${Umur.keISO(new Date())}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Import gambar pukal ----------
  // Nama fail dipadankan dengan gambar_url sedia ada (cth. gambar/nama-warga.jpg) atau slug nama.
  function slug(s) {
    return String(s || "").normalize("NFKD").replace(/[^\x00-\x7f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  async function importGambar(fail) {
    const ikutFail = new Map();
    for (const r of keadaan.data) {
      const f = (r.gambar_url || "").split("/").pop();
      if (f && !/^https?:|^data:/.test(r.gambar_url)) ikutFail.set(f.toLowerCase(), r);
      ikutFail.set(slug(r.nama) + ".jpg", ikutFail.get(slug(r.nama) + ".jpg") || r);
    }
    const padan = [], tiada = [];
    for (const f of fail) {
      const r = ikutFail.get(f.name.toLowerCase());
      r ? padan.push([f, r]) : tiada.push(f.name);
    }
    if (!padan.length) return toast("Tiada nama fail yang sepadan dengan warga.", true);
    if (!confirm(`Muat naik ${padan.length} gambar?` + (tiada.length ? ` (${tiada.length} fail tidak sepadan akan diabaikan)` : ""))) return;
    let siap = 0, gagal = [];
    for (const [f, r] of padan) {
      try {
        const url = await Store.muatNaikGambar(await kecilkanGambar(f));
        await Store.simpan({ ...r, gambar_url: url });
        siap++;
      } catch (err) { gagal.push(`${f.name}: ${err.message}`); }
      toast(`Memuat naik gambar… ${siap + gagal.length}/${padan.length}`);
    }
    await muat();
    toast(`${siap} gambar dimuat naik.` + (gagal.length ? ` ${gagal.length} gagal.` : ""), gagal.length > 0);
    if (gagal.length || tiada.length) console.warn("Import gambar:", { gagal, tiada });
  }

  // ---------- Sesi pentadbir ----------
  async function kemasSesi() {
    keadaan.admin = await Store.sesi();
    $("#btnLogin").hidden = keadaan.admin;
    $("#btnLogout").hidden = !keadaan.admin;
    $("#adminBar").hidden = !keadaan.admin;
    papar();
  }

  // ---------- Pendengar acara ----------
  function pasang() {
    $("#tajuk").textContent = cfg.TAJUK || "Direktori Warga";
    $("#subtajuk").textContent = cfg.SUBTAJUK || "";
    const online = Store.mod === "dalam talian";
    $("#modLabel").textContent = online ? "Dalam talian" : "Mod tempatan";
    $("#modLabel").title = online ? "Data dikongsi melalui pangkalan data"
      : "Data disimpan dalam pelayar ini sahaja. Tetapkan Supabase dalam config.js untuk berkongsi.";

    ["#carian", "#tapisUnit", "#susun"].forEach(s => $(s).addEventListener("input", papar));
    $("#viewGrid").onclick = () => { keadaan.paparan = "grid"; $("#viewGrid").classList.add("active"); $("#viewTable").classList.remove("active"); papar(); };
    $("#viewTable").onclick = () => { keadaan.paparan = "table"; $("#viewTable").classList.add("active"); $("#viewGrid").classList.remove("active"); papar(); };

    $("#senarai").addEventListener("click", e => {
      const edit = e.target.closest("[data-edit]");
      if (edit) { e.stopPropagation(); return bukaBorang(edit.dataset.edit); }
      if (e.target.closest("a")) return;
      const el = e.target.closest("[data-id]");
      if (el) bukaButiran(el.dataset.id);
    });
    $("#senarai").addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.matches(".kad")) bukaButiran(e.target.dataset.id);
    });

    document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());

    $("#btnTambah").onclick = () => bukaBorang(null);
    $("#borang").addEventListener("submit", simpanBorang);
    $("#btnPadam").onclick = padamRekod;
    $("#inputIC").addEventListener("input", kemasIC);
    $("#inputGambar").addEventListener("change", async e => {
      const fail = e.target.files[0];
      e.target.value = "";
      if (!fail) return;
      try {
        keadaan.gambarBaru = await kecilkanGambar(fail);
        $("#pratonton").src = URL.createObjectURL(keadaan.gambarBaru);
      } catch (err) { toast(err.message, true); }
    });
    $("#btnBuangGambar").onclick = () => { keadaan.gambarBaru = null; $("#pratonton").src = TANPA_GAMBAR; };

    $("#btnImport").onclick = () => $("#fileImport").click();
    $("#fileImport").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) importCSV(f); });
    $("#btnExport").onclick = eksportCSV;
    $("#btnImportGambar").onclick = () => $("#fileGambar").click();
    $("#fileGambar").addEventListener("change", e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) importGambar(f); });
    $("#btnCetak").onclick = () => window.print();

    $("#btnLogin").onclick = () => {
      $("#loginOnline").hidden = !online;
      $("#loginLocal").hidden = online;
      $("#loginRalat").hidden = true;
      $("#borangLogin").reset();
      $("#dlgLogin").showModal();
    };
    $("#borangLogin").addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target.elements;
      try {
        await Store.logMasuk({ email: f.email.value, password: f.password.value, pin: f.pin.value });
        $("#dlgLogin").close();
        await kemasSesi();
        await muat();
        toast("Log masuk berjaya.");
      } catch (err) {
        $("#loginRalat").textContent = err.message;
        $("#loginRalat").hidden = false;
      }
    });
    $("#btnLogout").onclick = async () => { await Store.logKeluar(); await kemasSesi(); toast("Telah log keluar."); };
  }

  pasang();
  kemasSesi().then(muat);
})();
