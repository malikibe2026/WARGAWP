// Buku Direktori: halaman khas paparan direktori mengikut seksyen (baca sahaja).
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TANPA_GAMBAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe6ee"/>' +
    '<circle cx="50" cy="38" r="18" fill="#9fb0c3"/><path d="M16 92c4-20 18-30 34-30s30 10 34 30z" fill="#9fb0c3"/></svg>');
  const IKON = {
    telefon: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    bimbit: '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
    emel: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 8.5c0 3.5 2.6 6.4 6 6.6l1.2-1.4-2-1-1 .8a4.6 4.6 0 0 1-2.6-2.6l.8-1-1-2z"/></svg>',
    salin: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    simpan: '<svg viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>',
  };

  document.addEventListener("error", e => {
    if (e.target.tagName === "IMG" && e.target.src !== TANPA_GAMBAR) e.target.src = TANPA_GAMBAR;
  }, true);

  const keadaan = { data: [], kategori: "", kumpulan: [] };
  const adalahPms = r => r && r.kategori === "pms";

  function inisial(nama) {
    const kata = String(nama || "").replace(/\b(BIN|BINTI|BT|B|A\/L|A\/P)\b\.?/gi, " ").split(/\s+/).filter(Boolean);
    const h = ((kata[0] || "?")[0] + (kata[1] ? kata[1][0] : "")).toUpperCase();
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#d6f3ea"/>' +
      `<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#0b5c4a">${h.replace(/[<&]/g, "")}</text></svg>`);
  }
  const gambar = r => r.gambar_url || (adalahPms(r) ? inisial(r.nama) : TANPA_GAMBAR);
  const noTel = no => String(no || "").split("/")[0].replace(/[^\d+]/g, "");
  function noWhatsApp(no) {
    let d = String(no || "").split("/")[0].replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("0")) d = "6" + d;
    return /^601\d{8,9}$/.test(d) ? d : "";
  }
  const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pendek = u => String(u || "").replace(/^Seksyen /, "").replace(/^Pejabat Perangkaan /, "Pejabat ");

  function toast(msg, ralat) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (ralat ? " error" : "");
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 3000);
  }

  // Serlahkan teks carian dalam hasil.
  function serlah(teks, q) {
    const s = esc(teks);
    if (!q) return s;
    const i = String(teks || "").toLowerCase().indexOf(q);
    if (i < 0) return s;
    const t = String(teks);
    return esc(t.slice(0, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length));
  }

  // Kumpulkan ikut seksyen; susunan seksyen = susunan carta (nombor susunan terkecil staf tetap).
  function binaKumpulan() {
    const peta = new Map();
    for (const r of keadaan.data) {
      const k = r.unit || "Tiada seksyen";
      if (!peta.has(k)) peta.set(k, []);
      peta.get(k).push(r);
    }
    const ikutNama = (a, b) => (a.nama || "").localeCompare(b.nama || "", "ms");
    const kumpulan = [...peta].map(([unit, ahli]) => {
      ahli.sort((a, b) => adalahPms(a) - adalahPms(b) || (a.susunan ?? Infinity) - (b.susunan ?? Infinity) || ikutNama(a, b));
      const tetap = ahli.filter(r => !adalahPms(r));
      return { unit, id: "s-" + slug(unit), ahli, ketua: /pengurusan/i.test(unit) ? null : tetap[0] || null,
        urutan: Math.min(...tetap.map(r => r.susunan ?? Infinity), Infinity), tetap: tetap.length, pms: ahli.length - tetap.length };
    });
    kumpulan.sort((a, b) => (a.tetap ? 0 : 1) - (b.tetap ? 0 : 1) || a.urutan - b.urutan || a.unit.localeCompare(b.unit, "ms"));
    keadaan.kumpulan = kumpulan;
  }

  function padan(r, q) {
    if (keadaan.kategori && (keadaan.kategori === "pms") !== adalahPms(r)) return false;
    if (!q) return true;
    return ["nama", "jawatan", "gred", "unit", "telefon_pejabat", "telefon_bimbit", "emel"]
      .some(k => String(r[k] || "").toLowerCase().includes(q)) || (q === "pms" && adalahPms(r));
  }

  function baris(r, q, ketua) {
    const pms = adalahPms(r);
    const tel = r.telefon_bimbit || r.telefon_pejabat;
    const wa = noWhatsApp(r.telefon_bimbit);
    return `<li class="bd-baris${ketua ? " ketua" : ""}" data-id="${esc(r.id)}" tabindex="0" role="button" aria-label="Buka profil ${esc(r.nama)}">
      <img class="bd-foto" src="${esc(gambar(r))}" alt="" loading="lazy">
      <div class="bd-teks">
        <b class="bd-nama">${serlah(r.nama, q)}</b>
        <span class="bd-jaw">${serlah(r.jawatan || (pms ? "Personel MySTEPS" : ""), q)}${r.gred ? ` <i class="bd-gred">${serlah(r.gred, q)}</i>` : ""}${pms ? ' <i class="pms-tag kecil">PMS</i>' : ""}${ketua ? ' <i class="bd-ketua">Ketua</i>' : ""}</span>
        <span class="bd-kontak-cetak">${[r.telefon_pejabat, r.telefon_bimbit, r.emel].filter(Boolean).map(esc).join(" · ")}</span>
      </div>
      <div class="bd-aksi">
        ${tel ? `<a href="tel:${esc(noTel(tel))}" title="Telefon ${esc(tel)}" aria-label="Telefon">${IKON.telefon}</a>` : ""}
        ${wa ? `<a class="wa" href="https://wa.me/${wa}" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">${IKON.wa}</a>` : ""}
        ${r.emel ? `<a href="mailto:${esc(r.emel)}" title="${esc(r.emel)}" aria-label="E-mel">${IKON.emel}</a>` : ""}
      </div>
    </li>`;
  }

  function papar() {
    const q = $("#bdCarian").value.trim().toLowerCase();
    const utama = $("#bdUtama");
    let jumlah = 0;
    const html = [], senaraiAda = [];
    for (const g of keadaan.kumpulan) {
      const ahli = g.ahli.filter(r => padan(r, q));
      if (!ahli.length) continue;
      jumlah += ahli.length;
      senaraiAda.push({ ...g, n: ahli.length });
      const k = g.ketua;
      html.push(`<section class="bd-seksyen" id="${g.id}" data-id="${g.id}">
        <header class="bd-kepala">
          <div>
            <h2>${esc(g.unit)}</h2>
            <p>${g.tetap ? `${g.tetap} staf tetap` : ""}${g.tetap && g.pms ? " · " : ""}${g.pms ? `${g.pms} PMS` : ""}${q || keadaan.kategori ? ` — <b>${ahli.length} dipaparkan</b>` : ""}</p>
          </div>
          <button class="bd-pautan" data-pautan="${g.id}" title="Salin pautan terus ke seksyen ini" aria-label="Salin pautan seksyen">
            <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>
          </button>
        </header>
        <ol class="bd-senarai">${ahli.map(r => baris(r, q, !q && k && r.id === k.id && g.tetap > 1)).join("")}</ol>
      </section>`);
    }
    utama.innerHTML = html.length ? html.join("")
      : `<p class="empty">${keadaan.data.length ? "Tiada padanan untuk carian ini." : "Direktori masih kosong."}</p>`;

    const indeks = senaraiAda.map(g => `<li><a href="#${g.id}" data-ke="${g.id}"><span>${esc(pendek(g.unit))}</span><b>${g.n}</b></a></li>`).join("");
    $("#bdIndeks").innerHTML = indeks;
    $("#bdLompat").innerHTML = senaraiAda.map(g => `<a href="#${g.id}" data-ke="${g.id}">${esc(pendek(g.unit))}<b>${g.n}</b></a>`).join("");
    const pms = keadaan.data.filter(adalahPms).length;
    $("#bdRingkas").innerHTML = keadaan.data.length ? `
      <span><b>${keadaan.data.length}</b> warga</span><span><b>${keadaan.data.length - pms}</b> staf tetap</span>
      <span><b>${pms}</b> PMS</span><span><b>${keadaan.kumpulan.length}</b> seksyen &amp; pejabat</span>
      ${q || keadaan.kategori ? `<span class="bd-tapis"><b>${jumlah}</b> padanan</span>` : ""}` : "";
    pantauSeksyen();
    kemasUrl(q);
  }

  // Serlahkan seksyen semasa dalam indeks sisi & cip lompat ketika menatal.
  let pemerhati;
  function pantauSeksyen() {
    pemerhati?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    pemerhati = new IntersectionObserver(entri => {
      const nampak = entri.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!nampak) return;
      const id = nampak.target.dataset.id;
      document.querySelectorAll("[data-ke]").forEach(a => a.classList.toggle("aktif", a.dataset.ke === id));
      const cip = $(`#bdLompat [data-ke="${id}"]`);
      if (cip) $("#bdLompat").scrollTo({ left: cip.offsetLeft - 16, behavior: "smooth" });
    }, { rootMargin: "-160px 0px -60% 0px" });
    document.querySelectorAll(".bd-seksyen").forEach(s => pemerhati.observe(s));
  }

  function kemasUrl(q) {
    const u = new URL(location.href);
    q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
    keadaan.kategori ? u.searchParams.set("k", keadaan.kategori) : u.searchParams.delete("k");
    if (q) u.hash = "";
    history.replaceState(null, "", u);
  }

  function simpanKenalan(r) {
    const v = s => String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, " ");
    const kad = ["BEGIN:VCARD", "VERSION:3.0", `FN:${v(r.nama)}`, `N:${v(r.nama)};;;;`,
      `ORG:Jabatan Perangkaan Malaysia;${v(r.unit)}`, r.jawatan ? `TITLE:${v(r.jawatan)}` : "",
      r.telefon_bimbit ? `TEL;TYPE=CELL:${v(String(r.telefon_bimbit).split("/")[0])}` : "",
      r.telefon_pejabat ? `TEL;TYPE=WORK:${v(String(r.telefon_pejabat).split("/")[0])}` : "",
      r.emel ? `EMAIL;TYPE=WORK:${v(r.emel)}` : "", "END:VCARD"].filter(Boolean).join("\r\n");
    const url = URL.createObjectURL(new Blob([kad], { type: "text/vcard;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: `${slug(r.nama) || "kenalan"}.vcf` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function bukaProfil(id) {
    const r = keadaan.data.find(x => x.id === id);
    if (!r) return;
    const kontak = (ikon, label, nilai, href) => nilai ? `
      <div class="kontak-item">
        <span class="kontak-ikon">${ikon}</span>
        <span class="kontak-teks"><small>${label}</small><a href="${href}">${esc(nilai)}</a></span>
        <button class="salin" data-salin="${esc(nilai)}" title="Salin" aria-label="Salin ${label}">${IKON.salin}</button>
      </div>` : "";
    const umur = window.Umur ? Umur.umurDaripadaTarikh(r.tarikh_lahir) : null;
    const tel = r.telefon_bimbit || r.telefon_pejabat, wa = noWhatsApp(r.telefon_bimbit);
    $("#butiranIsi").innerHTML = `
      <div class="profil">
        <div class="profil-foto"><img src="${esc(gambar(r))}" alt="Gambar ${esc(r.nama)}"></div>
        <div class="profil-isi">
          ${r.unit ? `<span class="unit-tag">${esc(r.unit)}</span>` : ""}
          <h2>${esc(r.nama)}</h2>
          ${adalahPms(r) ? '<span class="pms-tag">Personel MySTEPS (PMS)</span>' : ""}
          <p class="jawatan">${esc(r.jawatan || "")}${r.gred ? ` <span class="gred">${esc(r.gred)}</span>` : ""}</p>
          <div class="aksi-pantas">
            ${tel ? `<a class="ap" href="tel:${esc(noTel(tel))}">${IKON.telefon}<span>Telefon</span></a>` : ""}
            ${wa ? `<a class="ap wa" href="https://wa.me/${wa}" target="_blank" rel="noopener">${IKON.wa}<span>WhatsApp</span></a>` : ""}
            ${r.emel ? `<a class="ap" href="mailto:${esc(r.emel)}">${IKON.emel}<span>E-mel</span></a>` : ""}
            <button class="ap" type="button" data-vcard>${IKON.simpan}<span>Simpan</span></button>
          </div>
          <div class="kontak">
            ${kontak(IKON.telefon, "Tel. Pejabat", r.telefon_pejabat, `tel:${esc(noTel(r.telefon_pejabat))}`)}
            ${kontak(IKON.bimbit, "Tel. Bimbit", r.telefon_bimbit, `tel:${esc(noTel(r.telefon_bimbit))}`)}
            ${kontak(IKON.emel, "E-mel", r.emel, `mailto:${esc(r.emel)}`)}
          </div>
          ${umur != null ? `<dl class="meta"><dt>Umur</dt><dd>${umur} tahun</dd></dl>` : ""}
        </div>
      </div>`;
    $("#butiranIsi [data-vcard]").onclick = () => simpanKenalan(r);
    $("#dlgProfil").showModal();
  }

  async function salin(teks, mesej) {
    try { await navigator.clipboard.writeText(teks); toast(mesej); }
    catch { toast("Tidak dapat menyalin. Salin secara manual: " + teks, true); }
  }

  async function muat() {
    try {
      keadaan.data = await Store.senarai();
    } catch (e) {
      keadaan.data = [];
      toast("Gagal memuatkan data: " + e.message, true);
    }
    binaKumpulan();
    papar();
    const akhir = keadaan.data.map(r => r.updated_at).filter(Boolean).sort().pop();
    $("#bdKemas").textContent = akhir ? "Data dikemas kini " +
      new Date(akhir).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : "";
    // Pautan terus ke seksyen (#s-...) selepas data dimuat.
    if (location.hash && !muat.sudahLompat) {
      muat.sudahLompat = true;
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    }
  }

  function pasang() {
    const p = new URLSearchParams(location.search);
    $("#bdCarian").value = p.get("q") || "";
    keadaan.kategori = ["tetap", "pms"].includes(p.get("k")) ? p.get("k") : "";
    document.querySelectorAll("#bdKategori button").forEach(b => b.classList.toggle("active", b.dataset.kategori === keadaan.kategori));

    let tunda;
    $("#bdCarian").addEventListener("input", () => { clearTimeout(tunda); tunda = setTimeout(papar, 120); });
    $("#bdKategori").addEventListener("click", e => {
      const b = e.target.closest("button[data-kategori]");
      if (!b) return;
      keadaan.kategori = b.dataset.kategori;
      document.querySelectorAll("#bdKategori button").forEach(x => x.classList.toggle("active", x === b));
      papar();
    });
    $("#bdUtama").addEventListener("click", e => {
      const p = e.target.closest("[data-pautan]");
      if (p) {
        const u = new URL(location.href); u.search = ""; u.hash = p.dataset.pautan;
        return salin(u.toString(), "Pautan seksyen disalin.");
      }
      if (e.target.closest("a")) return;
      const b = e.target.closest(".bd-baris");
      if (b) bukaProfil(b.dataset.id);
    });
    $("#bdUtama").addEventListener("keydown", e => {
      const b = e.target.closest(".bd-baris");
      if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); bukaProfil(b.dataset.id); }
    });
    document.addEventListener("click", async e => {
      const s = e.target.closest("[data-salin]");
      if (s) salin(s.dataset.salin, "Disalin: " + s.dataset.salin);
      const k = e.target.closest("[data-ke]");
      if (k) {
        e.preventDefault();
        document.getElementById(k.dataset.ke)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + k.dataset.ke);
      }
    });
    document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());
    $("#dlgProfil").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    $("#btnCetak").onclick = () => window.print();
    $("#btnKongsi").onclick = async () => {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: "Direktori Warga DOSM WP", url }); return; } catch (err) { if (err.name === "AbortError") return; } }
      salin(url, "Pautan direktori disalin.");
    };
    document.addEventListener("keydown", e => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $("#bdCarian").focus(); }
      if (e.key === "Escape" && document.activeElement === $("#bdCarian")) { $("#bdCarian").value = ""; papar(); }
    });
    // Kemas kini data apabila aplikasi dibuka semula selepas lama.
    let terakhir = Date.now();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && Date.now() - terakhir > 60000) muat();
      terakhir = Date.now();
    });
  }

  pasang();
  muat();
})();
