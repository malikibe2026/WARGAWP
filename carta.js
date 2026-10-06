// Carta organisasi visual: Pengarah → Timbalan → seksyen/pejabat (ikut susunan direktori).
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TANPA_GAMBAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe6ee"/>' +
    '<circle cx="50" cy="38" r="18" fill="#9fb0c3"/><path d="M16 92c4-20 18-30 34-30s30 10 34 30z" fill="#9fb0c3"/></svg>');
  document.addEventListener("error", e => {
    if (e.target.tagName === "IMG" && e.target.src !== TANPA_GAMBAR) e.target.src = TANPA_GAMBAR;
  }, true);

  function inisial(nama) {
    const kata = String(nama || "").replace(/\b(BIN|BINTI|BT|B|A\/L|A\/P)\b\.?/gi, " ").split(/\s+/).filter(Boolean);
    const h = ((kata[0] || "?")[0] + (kata[1] ? kata[1][0] : "")).toUpperCase().replace(/[<&]/g, "");
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#d6f3ea"/>' +
      `<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#0b5c4a">${h}</text></svg>`);
  }
  const gambar = w => w.gambar_url || (w.kategori === "pms" ? inisial(w.nama) : TANPA_GAMBAR);
  const urut = (a, b) => (a.susunan ?? 1e9) - (b.susunan ?? 1e9) || String(a.nama).localeCompare(b.nama, "ms");

  let data = [], struktur = null;

  function bina() {
    const tetap = data.filter(w => w.kategori !== "pms").sort(urut);
    const pms = data.filter(w => w.kategori === "pms");
    if (!tetap.length) return null;
    const unitAtas = tetap[0].unit;
    const atas = tetap.filter(w => w.unit === unitAtas);
    const pengarah = atas[0];
    const timbalan = atas.find(w => /timbalan/i.test(w.jawatan || "")) || null;
    // Setiausaha Pejabat = PA kepada Pengarah: dipaparkan sebaris dengan Pengarah.
    const pa = atas.find(w => w !== pengarah && w !== timbalan && /setiausaha/i.test(w.jawatan || "")) || null;
    const pejabat = atas.filter(w => w !== pengarah && w !== timbalan && w !== pa);
    // Seksyen: ikut susunan ahli tetap pertama; PMS dipadankan ikut nama seksyen (abaikan huruf besar/kecil).
    const units = new Map();
    for (const w of tetap) {
      if (w.unit === unitAtas) continue;
      const k = Sasaran.kunci(w.unit) || "(tiada seksyen)";
      if (!units.has(k)) units.set(k, { nama: w.unit || "Tiada seksyen", tetap: [], pms: [] });
      units.get(k).tetap.push(w);
    }
    const lain = new Map();
    for (const w of pms) {
      const k = Sasaran.kunci(w.unit) || "(tiada seksyen)";
      if (units.has(k)) units.get(k).pms.push(w);
      else {
        if (!lain.has(k)) lain.set(k, { nama: w.unit || "Tiada seksyen", tetap: [], pms: [] });
        lain.get(k).pms.push(w);
      }
    }
    for (const u of [...units.values(), ...lain.values()]) u.pms.sort((a, b) => a.nama.localeCompare(b.nama, "ms"));
    return { pengarah, timbalan, pa, pejabat, unitAtas, units: [...units.values()], lain: [...lain.values()].sort((a, b) => b.pms.length - a.pms.length) };
  }

  const kadOrang = (w, kelas, tag) => `
    <article class="nod-orang ${kelas}" data-cari="${esc(w.nama.toLowerCase())}">
      <img src="${esc(gambar(w))}" alt="" loading="lazy">
      ${tag ? `<span class="nod-tag">${esc(tag)}</span>` : ""}
      <h3>${esc(w.nama)}</h3>
      <p>${esc(w.jawatan || "")}${w.gred ? ` <span class="gred">${esc(w.gred)}</span>` : ""}</p>
    </article>`;

  function kadUnit(u, i, tunjukPms) {
    const ketua = u.tetap[0];
    const ahli = u.tetap.concat(tunjukPms ? u.pms : []);
    const tindan = ahli.slice(ketua ? 1 : 0, 8);
    const baki = ahli.length - (ketua ? 1 : 0) - tindan.length;
    const semuaNama = ahli.map(w => w.nama.toLowerCase()).join("|");
    return `<li class="cabang ${i % 2 ? "kanan" : "kiri"}">
      <article class="nod-unit" tabindex="0" role="button" data-unit="${i}" data-cari="${esc(semuaNama)}" aria-label="Lihat ahli ${esc(u.nama)}">
        <header>
          <span class="nu-no">${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(u.nama)}</h3>
        </header>
        ${ketua ? `<div class="nu-ketua">
          <img src="${esc(gambar(ketua))}" alt="" loading="lazy">
          <div><span class="nod-tag kecil">Ketua</span><b>${esc(ketua.nama)}</b><small>${esc(ketua.jawatan || "")}${ketua.gred ? " · " + esc(ketua.gred) : ""}</small></div>
        </div>` : '<p class="nu-tiada">Tiada staf tetap direkodkan</p>'}
        <footer>
          <div class="tindan">${tindan.map(w => `<img src="${esc(gambar(w))}" alt="" loading="lazy" title="${esc(w.nama)}">`).join("")}${baki > 0 ? `<span>+${baki}</span>` : ""}</div>
          <div class="nu-bil"><b>${u.tetap.length}</b> tetap${tunjukPms && u.pms.length ? ` · <b>${u.pms.length}</b> PMS` : ""}</div>
        </footer>
      </article>
    </li>`;
  }

  function papar() {
    const s = struktur, el = $("#carta");
    if (!s) { el.innerHTML = '<p class="empty">Tiada data warga untuk dipaparkan.</p>'; return; }
    const tunjukPms = $("#tunjukPms").checked;
    const jumTetap = data.filter(w => w.kategori !== "pms").length, jumPms = data.length - jumTetap;
    $("#ringkasCarta").textContent = `${s.units.length + 1} seksyen & pejabat · ${jumTetap} staf tetap${tunjukPms && jumPms ? ` · ${jumPms} PMS` : ""}`;
    el.innerHTML = `
      <section class="aras aras-0${s.pa ? " ada-pa" : ""}">
        ${kadOrang(s.pengarah, "utama", s.pengarah.jawatan || "Pengarah")}
        ${s.pa ? `<div class="pa-sisi">${kadOrang(s.pa, "pa", "PA kepada Pengarah")}</div>` : ""}
      </section>
      ${s.timbalan || s.pejabat.length ? `<section class="aras aras-1">
        ${s.timbalan ? kadOrang(s.timbalan, "kedua", s.timbalan.jawatan || "Timbalan Pengarah") : ""}
        ${s.pejabat.length ? `<div class="pejabat-pengarah"><p class="pp-label">${esc(s.unitAtas)}</p>${s.pejabat.map(w => kadOrang(w, "kecil", "")).join("")}</div>` : ""}
      </section>` : ""}
      <ol class="batang">${s.units.map((u, i) => kadUnit(u, i, tunjukPms)).join("")}</ol>
      ${tunjukPms && s.lain.length ? `<section class="unit-lain">
        <h2>Seksyen lain (Personel MySTEPS sahaja)</h2>
        <p class="muted">Nama seksyen berikut tidak sepadan dengan mana-mana seksyen staf tetap dalam direktori. Jika ia seksyen yang sama, betulkan ejaan seksyen ahli berkenaan.</p>
        <ul>${s.lain.map((u, i) => `<li><button class="cip-unit" data-lain="${i}"><b>${esc(u.nama)}</b><span>${u.pms.length} PMS</span></button></li>`).join("")}</ul>
      </section>` : ""}`;
    Sinema.pantauKad(el, ".nod-orang, .nod-unit");
    tapis();
  }

  function tapis() {
    const q = $("#cariCarta").value.trim().toLowerCase();
    const el = $("#carta");
    el.classList.toggle("sedang-cari", !!q);
    for (const n of el.querySelectorAll("[data-cari]")) n.classList.toggle("padan", !!q && n.dataset.cari.includes(q));
    if (q) el.querySelector(".padan")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function bukaUnit(u, label) {
    const tunjukPms = $("#tunjukPms").checked;
    const q = $("#cariCarta").value.trim().toLowerCase();
    const senarai = (ahli, tajuk) => ahli.length ? `<h3 class="ahli-tajuk">${tajuk} <span>${ahli.length}</span></h3>
      <div class="ahli-grid">${ahli.map((w, i) => `<div class="ahli${q && w.nama.toLowerCase().includes(q) ? " padan" : ""}">
        <img src="${esc(gambar(w))}" alt="" loading="lazy">
        <div><b>${esc(w.nama)}</b><small>${esc(w.kategori === "pms" ? "Personel MySTEPS" : w.jawatan || "")}${w.gred ? " · " + esc(w.gred) : ""}</small>
        ${i === 0 && w.kategori !== "pms" && label !== "lain" ? '<span class="nod-tag kecil">Ketua</span>' : ""}</div>
      </div>`).join("")}</div>` : "";
    $("#unitEyebrow").textContent = /^pejabat/i.test(u.nama) ? "Pejabat" : "Seksyen";
    $("#unitTajuk").textContent = u.nama;
    $("#unitIsi").innerHTML = senarai(u.tetap, "Staf Tetap") + (tunjukPms ? senarai(u.pms, "Personel MySTEPS (PMS)") : "");
    $("#dlgUnit").showModal();
  }

  $("#carta").addEventListener("click", e => {
    const n = e.target.closest("[data-unit]"), l = e.target.closest("[data-lain]");
    if (n) bukaUnit(struktur.units[+n.dataset.unit]);
    else if (l) bukaUnit(struktur.lain[+l.dataset.lain], "lain");
  });
  $("#carta").addEventListener("keydown", e => {
    const n = e.target.closest("[data-unit]");
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); bukaUnit(struktur.units[+n.dataset.unit]); }
  });
  $("#cariCarta").addEventListener("input", tapis);
  $("#tunjukPms").addEventListener("change", papar);
  document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());
  $("#btnCetakCarta").onclick = () => window.print();
  $("#btnPembentangan").onclick = () => {
    document.body.classList.add("pembentangan");
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("pembentangan"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.body.classList.remove("pembentangan"); });

  (async () => {
    try { data = await Store.senarai(); }
    catch (err) { $("#carta").innerHTML = `<p class="empty">Gagal memuatkan data: ${esc(err.message)}</p>`; return; }
    struktur = bina();
    papar();
  })();
})();
