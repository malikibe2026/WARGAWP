// Skrin paparan kehadiran langsung untuk projektor / TV (pentadbir sahaja).
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TANPA_GAMBAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1d3354"/>' +
    '<circle cx="50" cy="38" r="18" fill="#5d7aa3"/><path d="M16 92c4-20 18-30 34-30s30 10 34 30z" fill="#5d7aa3"/></svg>');
  document.addEventListener("error", e => {
    if (e.target.tagName === "IMG" && e.target.src !== TANPA_GAMBAR) e.target.src = TANPA_GAMBAR;
  }, true);

  const sb = Store.sb;
  const id = new URLSearchParams(location.search).get("id");
  const tz = { timeZone: "Asia/Kuala_Lumpur" };
  let program = null, warga = new Map(), dilihat = new Set(), pertama = true, bilPapar = 0;

  function toast(msg, ralat) {
    const t = $("#toast");
    t.textContent = msg; t.className = "toast" + (ralat ? " error" : ""); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 4000);
  }
  const semak = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

  function jam() {
    const d = new Date();
    $("#ppJam").textContent = d.toLocaleTimeString("ms-MY", { ...tz, hour: "2-digit", minute: "2-digit" });
    $("#ppTarikh").textContent = d.toLocaleDateString("ms-MY", { ...tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  // Animasi angka naik dengan lancar.
  function kiraNaik(el, ke) {
    const dari = bilPapar, mula = performance.now(), tempoh = 900;
    bilPapar = ke;
    (function langkah(t) {
      const k = Math.min(1, (t - mula) / tempoh), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(dari + (ke - dari) * e);
      if (k < 1) requestAnimationFrame(langkah);
    })(mula);
  }

  function paparProgram() {
    const j = t => t ? t.slice(0, 5) : "";
    $("#ppNama").textContent = program.nama;
    document.title = `${program.nama} — Skrin Paparan`;
    const tarikh = new Date(program.tarikh + "T00:00:00").toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("#ppMeta").innerHTML = [
      `<span>📅 ${esc(tarikh)}</span>`,
      program.masa_mula ? `<span>🕘 ${esc(j(program.masa_mula))}${program.masa_tamat ? "–" + esc(j(program.masa_tamat)) : ""}</span>` : "",
      program.lokasi_nama ? `<span>📍 ${esc(program.lokasi_nama)}</span>` : "",
    ].join("");
    const url = new URL(`hadir.html?p=${encodeURIComponent(program.kod)}`, location.href).href;
    const qr = qrcode(0, "M"); qr.addData(url); qr.make();
    $("#ppQR").innerHTML = qr.createSvgTag({ cellSize: 8, margin: 1, scalable: true });
    const mp = iso => new Date(iso).toLocaleString("ms-MY", { ...tz, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    $("#ppTempoh").textContent = !program.aktif ? "Pendaftaran ditutup"
      : program.daftar_tamat ? `Pendaftaran ditutup ${mp(program.daftar_tamat)}`
      : program.masa_tamat ? `Pendaftaran ditutup ${j(program.masa_tamat)}` : "";
  }

  async function muatHadir() {
    let rekod;
    try { rekod = semak(await sb.from("kehadiran").select("id,warga_id,masa").eq("program_id", program.id).order("masa", { ascending: false })); }
    catch (err) { return toast("Gagal mengemas kini: " + err.message, true); }
    const sasaran = warga.size, bil = rekod.length, peratus = sasaran ? Math.round(bil / sasaran * 100) : 0;
    $("#ppSasaran").textContent = sasaran;
    if (bil !== bilPapar) kiraNaik($("#ppBil"), bil);
    $("#ppPeratus").textContent = peratus + "%";
    $("#ppCincin").style.setProperty("--p", peratus);

    // Pecahan ikut kategori
    let tetap = 0, pms = 0;
    for (const r of rekod) (warga.get(r.warga_id)?.kategori === "pms" ? pms++ : tetap++);
    $("#ppPecah").innerHTML = `<span><b>${tetap}</b> Staf Tetap</span>${pms ? `<span><b>${pms}</b> PMS</span>` : ""}`;

    const terkini = rekod.slice(0, 6);
    $("#ppTerkini").innerHTML = terkini.length ? terkini.map(r => {
      const w = warga.get(r.warga_id) || {};
      const baru = !pertama && !dilihat.has(r.id);
      return `<li class="${baru ? "baru" : ""}">
        <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="">
        <div><b>${esc(w.nama || "—")}</b><small>${esc(w.unit || "")}</small></div>
        <time>${new Date(r.masa).toLocaleTimeString("ms-MY", { ...tz, hour: "2-digit", minute: "2-digit" })}</time>
      </li>`;
    }).join("") : '<li class="kosong">Menunggu peserta pertama…</li>';
    rekod.forEach(r => dilihat.add(r.id));
    pertama = false;
  }

  async function mula() {
    if (!sb) { document.body.innerHTML = '<p class="empty">Skrin paparan memerlukan mod dalam talian.</p>'; return; }
    if (!id) { document.body.innerHTML = '<p class="empty">Pautan tidak lengkap. Buka skrin paparan dari halaman Program &amp; Kehadiran.</p>'; return; }
    if (!(await Store.sesi())) { $("#pLogin").hidden = false; return; }
    $("#pLogin").hidden = true;
    program = semak(await sb.from("program").select("*").eq("id", id).maybeSingle());
    if (!program) { document.body.innerHTML = '<p class="empty">Program tidak dijumpai.</p>'; return; }
    for (const w of semak(await sb.from("warga").select("id,nama,unit,gambar_url,kategori"))) warga.set(w.id, w);
    $("#pUtama").hidden = false;
    paparProgram(); jam(); await muatHadir();
    setInterval(jam, 10000);
    setInterval(muatHadir, 5000);
  }

  $("#borangLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target.elements;
    try { await Store.logMasuk({ email: f.email.value, password: f.password.value }); mula(); }
    catch (err) { $("#loginRalat").textContent = err.message; $("#loginRalat").hidden = false; }
  });
  const skrinPenuh = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  $("#btnSkrinPenuh").onclick = skrinPenuh;
  document.addEventListener("keydown", e => { if (e.key === "f" || e.key === "F") skrinPenuh(); });

  mula().catch(err => toast(err.message, true));
})();
