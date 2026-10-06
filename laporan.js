// Laporan kehadiran program dalam format rasmi A4 (cetak / simpan sebagai PDF melalui pelayar).
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sb = Store.sb;
  const id = new URLSearchParams(location.search).get("id");
  const tz = { timeZone: "Asia/Kuala_Lumpur" };
  const semak = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  const jam = t => t ? t.slice(0, 5) : "";
  const masaPenuh = iso => new Date(iso).toLocaleString("ms-MY", { ...tz, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const masaJam = iso => new Date(iso).toLocaleTimeString("ms-MY", { ...tz, hour: "2-digit", minute: "2-digit" });
  const KAEDAH = { nama: "Carian nama", nama_muka: "Nama + imbas muka", muka: "Imbas muka" };
  let program, warga = [], hadir = [];

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.className = "toast error"; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 5000);
  }

  function sasaranDipilih() {
    const v = $("#lpSasaran").value;
    return { label: Sasaran.label(v), senarai: Sasaran.ahli(warga, v) };
  }

  function jana() {
    const p = program, { label, senarai } = sasaranDipilih();
    const dalam = new Set(senarai.map(w => w.id));
    const ikutWarga = new Map(hadir.map(h => [h.warga_id, h]));
    const hadirS = hadir.filter(h => dalam.has(h.warga_id));
    const luar = hadir.length - hadirS.length;
    const bil = hadirS.length, sasaran = senarai.length, kadar = sasaran ? (bil / sasaran * 100) : 0;
    const ikutId = new Map(warga.map(w => [w.id, w]));

    // Pecahan kaedah rekod
    const kaedah = { gps: 0, manual: 0, muka: 0 };
    for (const h of hadirS) { if (h.kaedah === "manual") kaedah.manual++; else kaedah.gps++; if (h.jarak_muka != null) kaedah.muka++; }
    const masaUrut = hadirS.map(h => h.masa).sort();

    // Ikut seksyen (susunan carta)
    const urutan = new Map();
    for (const w of senarai) { const k = w.unit || "Tiada seksyen", v = w.susunan ?? 1e9; if (!urutan.has(k) || v < urutan.get(k)) urutan.set(k, v); }
    const seksyen = [...urutan.keys()].sort((a, b) => urutan.get(a) - urutan.get(b)).map(u => {
      const ahli = senarai.filter(w => (w.unit || "Tiada seksyen") === u);
      const h = ahli.filter(w => ikutWarga.has(w.id)).length;
      return { u, n: ahli.length, h, pc: ahli.length ? h / ahli.length * 100 : 0 };
    });

    const urutCarta = (a, b) => (urutan.get(a.unit || "Tiada seksyen") - urutan.get(b.unit || "Tiada seksyen")) || ((a.susunan ?? 1e9) - (b.susunan ?? 1e9)) || a.nama.localeCompare(b.nama, "ms");
    const senaraiHadir = hadirS.map(h => ({ h, w: ikutId.get(h.warga_id) })).filter(x => x.w).sort((a, b) => a.h.masa.localeCompare(b.h.masa));
    const tidakHadir = senarai.filter(w => !ikutWarga.has(w.id)).sort(urutCarta);
    const tarikh = new Date(p.tarikh + "T00:00:00").toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const tempoh = p.daftar_mula || p.daftar_tamat
      ? `${p.daftar_mula ? masaPenuh(p.daftar_mula) : "—"} hingga ${p.daftar_tamat ? masaPenuh(p.daftar_tamat) : "—"}`
      : "Ikut masa program";

    $("#kertas").innerHTML = `
      <header class="lp-kepala">
        <img class="lp-jata" src="ikon/jata-dosm.png" alt="Jata Negara">
        <div class="lp-jabatan"><b>JABATAN PERANGKAAN MALAYSIA</b><span>Wilayah Persekutuan</span></div>
        <div class="lp-ruj">Kod program: <b>${esc(p.kod)}</b><br>Dijana: ${esc(masaPenuh(new Date().toISOString()))}</div>
      </header>
      <h2 class="lp-tajuk">LAPORAN KEHADIRAN PROGRAM</h2>
      <p class="lp-subtajuk">${esc(p.nama)}</p>

      <h3 class="lp-h">A. Butiran Program</h3>
      <table class="lp butiran"><tbody>
        <tr><td>Nama program</td><td>${esc(p.nama)}</td></tr>
        <tr><td>Tarikh</td><td>${esc(tarikh)}</td></tr>
        <tr><td>Masa</td><td>${p.masa_mula ? esc(jam(p.masa_mula)) + (p.masa_tamat ? " – " + esc(jam(p.masa_tamat)) : "") : "—"}</td></tr>
        <tr><td>Lokasi</td><td>${esc(p.lokasi_nama || "—")}${p.lat != null ? ` (semakan lokasi dalam radius ${p.radius_m} m)` : ""}</td></tr>
        <tr><td>Kaedah pengesahan</td><td>${esc(KAEDAH[p.kaedah_sah] || p.kaedah_sah)}</td></tr>
        <tr><td>Tempoh pendaftaran</td><td>${esc(tempoh)}</td></tr>
        <tr><td>Sasaran peserta</td><td>${esc(label)}</td></tr>
      </tbody></table>

      <h3 class="lp-h">B. Ringkasan Kehadiran</h3>
      <div class="lp-kpi">
        <div><b>${sasaran}</b><span>Sasaran</span></div>
        <div><b>${bil}</b><span>Hadir</span></div>
        <div><b>${sasaran - bil}</b><span>Tidak hadir</span></div>
        <div class="utama"><b>${kadar.toFixed(1)}%</b><span>Kadar kehadiran</span></div>
      </div>
      <p class="lp-nota">Rekod kendiri melalui telefon: <b>${kaedah.gps}</b> · Ditanda manual oleh urus setia: <b>${kaedah.manual}</b>${kaedah.muka ? ` · Disahkan imbasan muka: <b>${kaedah.muka}</b>` : ""}${masaUrut.length ? ` · Rekod pertama ${esc(masaJam(masaUrut[0]))}, terakhir ${esc(masaJam(masaUrut[masaUrut.length - 1]))}` : ""}${luar ? ` · ${luar} kehadiran di luar sasaran tidak dikira` : ""}.</p>

      <h3 class="lp-h">C. Kehadiran Mengikut Seksyen / Pejabat</h3>
      <table class="lp"><thead><tr><th class="n">Bil</th><th>Seksyen / Pejabat</th><th class="r">Sasaran</th><th class="r">Hadir</th><th class="r">%</th><th style="width:22%"></th></tr></thead><tbody>
        ${seksyen.map((s, i) => `<tr><td class="n">${i + 1}</td><td>${esc(s.u)}</td><td class="r">${s.n}</td><td class="r">${s.h}</td><td class="r">${s.pc.toFixed(0)}</td><td><div class="bar"><i style="width:${s.pc.toFixed(1)}%"></i></div></td></tr>`).join("")}
        <tr><td></td><td><b>Jumlah</b></td><td class="r"><b>${sasaran}</b></td><td class="r"><b>${bil}</b></td><td class="r"><b>${kadar.toFixed(0)}</b></td><td></td></tr>
      </tbody></table>

      <h3 class="lp-h">D. Senarai Kehadiran (${senaraiHadir.length})</h3>
      ${senaraiHadir.length ? `<table class="lp"><thead><tr><th class="n">Bil</th><th>Nama</th><th>Seksyen / Pejabat</th><th>Masa</th><th>Kaedah</th></tr></thead><tbody>
        ${senaraiHadir.map(({ h, w }, i) => `<tr><td class="n">${i + 1}</td><td>${esc(w.nama)}${w.kategori === "pms" ? " <small>(PMS)</small>" : ""}</td><td>${esc(w.unit || "")}</td><td class="t">${esc(masaJam(h.masa))}</td><td>${h.kaedah === "manual" ? "Manual" : h.jarak_muka != null ? "Telefon + muka" : "Telefon"}</td></tr>`).join("")}
      </tbody></table>` : '<p class="lp-nota">Tiada kehadiran direkodkan.</p>'}

      ${$("#lpTidakHadir").checked ? `<h3 class="lp-h">E. Senarai Tidak Hadir (${tidakHadir.length})</h3>
      ${tidakHadir.length ? `<table class="lp"><thead><tr><th class="n">Bil</th><th>Nama</th><th>Seksyen / Pejabat</th><th style="width:26%">Catatan</th></tr></thead><tbody>
        ${tidakHadir.map((w, i) => `<tr><td class="n">${i + 1}</td><td>${esc(w.nama)}${w.kategori === "pms" ? " <small>(PMS)</small>" : ""}</td><td>${esc(w.unit || "")}</td><td></td></tr>`).join("")}
      </tbody></table>` : '<p class="lp-nota">Semua sasaran telah hadir.</p>'}` : ""}

      <div class="lp-tandatangan">
        <div><p>Disediakan oleh:</p><div class="garis"></div><p>Nama:</p><p>Jawatan:</p><p>Tarikh:</p></div>
        <div><p>Disahkan oleh:</p><div class="garis"></div><p>Nama:</p><p>Jawatan:</p><p>Tarikh:</p></div>
      </div>
      <footer class="lp-kaki"><span>Dijana oleh Sistem Kehadiran DOSM WP</span><span>${esc(p.kod)} · ${esc(masaPenuh(new Date().toISOString()))}</span></footer>`;
    document.title = `Laporan Kehadiran — ${p.nama}`;
  }

  async function mula() {
    if (!sb) { document.body.innerHTML = '<p class="empty">Laporan memerlukan mod dalam talian.</p>'; return; }
    if (!id) { document.body.innerHTML = '<p class="empty">Pautan tidak lengkap. Buka laporan dari halaman Program &amp; Kehadiran.</p>'; return; }
    if (!(await Store.sesi())) { $("#lpLogin").hidden = false; return; }
    $("#lpLogin").hidden = true;
    program = semak(await sb.from("program").select("*").eq("id", id).maybeSingle());
    if (!program) { document.body.innerHTML = '<p class="empty">Program tidak dijumpai.</p>'; return; }
    [warga, hadir] = await Promise.all([
      sb.from("warga").select("id,nama,unit,kategori,susunan").then(semak),
      sb.from("kehadiran").select("warga_id,masa,kaedah,jarak_muka").eq("program_id", id).then(semak),
    ]);
    $("#lpSasaran").innerHTML = Sasaran.pilihan(warga, program.sasaran);
    $("#lpUtama").hidden = false;
    jana();
  }

  $("#lpSasaran").addEventListener("change", jana);
  $("#lpTidakHadir").addEventListener("change", jana);
  $("#btnCetak").onclick = () => window.print();
  $("#borangLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target.elements;
    try { await Store.logMasuk({ email: f.email.value, password: f.password.value }); mula(); }
    catch (err) { $("#loginRalat").textContent = err.message; $("#loginRalat").hidden = false; }
  });
  mula().catch(err => toast(err.message));
})();
