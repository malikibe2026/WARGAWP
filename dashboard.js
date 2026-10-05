// Dashboard kehadiran (pentadbir): KPI, kadar ikut program & seksyen, peta haba, trend bulanan, kaedah rekod.
// Graf dilukis sebagai SVG tanpa pustaka luar; semua nama dimasukkan melalui textContent.
(function () {
  const $ = s => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const sb = Store.sb;
  const tz = { timeZone: "Asia/Kuala_Lumpur" };
  const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
  const hariIni = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  const pc = v => v == null ? "—" : `${(v * 100).toFixed(v >= .995 || v === 0 ? 0 : 1)}%`;
  const nombor = n => Number(n).toLocaleString("ms-MY");
  const tarikhPendek = iso => new Date(iso + "T00:00:00").toLocaleDateString("ms-MY", { day: "numeric", month: "short" });
  const semak = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

  let warga = [], program = [], hadir = [], hasil = null;
  const jadualAktif = new Set();

  // ---------- Utiliti SVG & tooltip ----------
  function el(tag, attrs = {}, induk, teks) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (teks != null) e.textContent = teks;
    if (induk) induk.appendChild(e);
    return e;
  }
  function svgBaru(bekas, w, h) {
    bekas.textContent = "";
    // Saiz ditetapkan inline: peraturan global `svg { width: 18px }` (untuk ikon) tidak boleh mengecilkan graf.
    return el("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "d-svg", role: "img", style: `width:${w}px;height:${h}px` }, bekas);
  }
  // Bar mendatar: hujung data bulat 4px, segi empat di garis dasar.
  const laluanH = (x0, x1, y, h, r = 4) => x1 - x0 <= r ? `M${x0} ${y}H${x1}V${y + h}H${x0}Z`
    : `M${x0} ${y}H${x1 - r}Q${x1} ${y} ${x1} ${y + r}V${y + h - r}Q${x1} ${y + h} ${x1 - r} ${y + h}H${x0}Z`;
  const laluanV = (x, w, yb, yt, r = 4) => yb - yt <= r ? `M${x} ${yb}V${yt}H${x + w}V${yb}Z`
    : `M${x} ${yb}V${yt + r}Q${x} ${yt} ${x + r} ${yt}H${x + w - r}Q${x + w} ${yt} ${x + w} ${yt + r}V${yb}Z`;

  const tip = $("#tip");
  function tunjukTip(e, tajuk, baris) {
    tip.textContent = "";
    const t = document.createElement("div"); t.className = "tt-tajuk"; t.textContent = tajuk; tip.appendChild(t);
    for (const [label, nilai, kelas] of baris) {
      const r = document.createElement("div"); r.className = "tt-baris";
      if (kelas) { const k = document.createElement("i"); k.className = "tt-kunci " + kelas; r.appendChild(k); }
      const v = document.createElement("b"); v.textContent = nilai; r.appendChild(v);
      const l = document.createElement("span"); l.textContent = label; r.appendChild(l);
      tip.appendChild(r);
    }
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const sorokTip = () => (tip.hidden = true);
  function pasangTip(nod, tajuk, baris) {
    nod.setAttribute("tabindex", "0");
    nod.addEventListener("pointermove", e => tunjukTip(e, tajuk, baris));
    nod.addEventListener("pointerleave", sorokTip);
    nod.addEventListener("focus", () => { const b = nod.getBoundingClientRect(); tunjukTip({ clientX: b.right, clientY: b.top }, tajuk, baris); });
    nod.addEventListener("blur", sorokTip);
  }
  // Anggaran lebar teks (untuk memutuskan label muat di dalam bar atau tidak).
  const lebarTeks = (s, saiz = 12) => String(s).length * saiz * .58;
  // Pendekkan label supaya muat dalam ruang (px); nama penuh kekal dalam tooltip & jadual.
  // Ukur lebar sebenar teks yang dilukis dan pendekkan sehingga muat (nama penuh kekal dalam tooltip & jadual).
  function muatkan(nod, penuh, px) {
    if (nod.getComputedTextLength() <= px) return nod;
    let n = penuh.length;
    while (n > 6 && nod.getComputedTextLength() > px) { n--; nod.textContent = penuh.slice(0, n).trimEnd() + "…"; }
    return nod;
  }

  // ---------- Pengiraan ----------
  function kira() {
    const tahun = $("#fTahun").value, kat = $("#fKategori").value, hari = hariIni();
    const wk = kat === "tetap" ? warga.filter(w => w.kategori !== "pms") : kat === "pms" ? warga.filter(w => w.kategori === "pms") : warga;
    const idK = new Set(wk.map(w => w.id));
    const progTahun = program.filter(p => p.tarikh.slice(0, 4) === tahun).sort((a, b) => a.tarikh.localeCompare(b.tarikh) || a.nama.localeCompare(b.nama, "ms"));
    const selesai = progTahun.filter(p => p.tarikh <= hari), akan = progTahun.length - selesai.length;
    const ikutProg = new Map();
    for (const h of hadir) { if (!ikutProg.has(h.program_id)) ikutProg.set(h.program_id, []); ikutProg.get(h.program_id).push(h); }

    // Kumpulan seksyen (nama dipadankan tanpa mengira huruf besar/kecil; ejaan staf tetap diutamakan).
    const seksyen = new Map();
    for (const w of [...wk].sort((a, b) => (a.kategori === "pms") - (b.kategori === "pms") || (a.susunan ?? 1e9) - (b.susunan ?? 1e9))) {
      const k = Sasaran.kunci(w.unit) || "(tiada seksyen)";
      if (!seksyen.has(k)) seksyen.set(k, { nama: w.unit || "Tiada seksyen", urut: w.susunan ?? 1e9 + seksyen.size, n: 0, h: 0, sel: new Map() });
    }

    const baris = [], unik = new Set(), kaedah = { telefon: 0, muka: 0, manual: 0 }, bulan = Array(12).fill(0);
    for (const p of selesai) {
      const ahli = Sasaran.ahli(wk, p.sasaran);
      if (!ahli.length) continue;
      const ids = new Set(ahli.map(w => w.id));
      const rekod = (ikutProg.get(p.id) || []).filter(h => ids.has(h.warga_id));
      const sudah = new Set(rekod.map(h => h.warga_id));
      baris.push({ p, n: ahli.length, h: sudah.size, kadar: sudah.size / ahli.length });
      for (const h of rekod) {
        unik.add(h.warga_id);
        if (h.kaedah === "manual") kaedah.manual++; else if (h.jarak_muka != null) kaedah.muka++; else kaedah.telefon++;
      }
      bulan[+p.tarikh.slice(5, 7) - 1] += sudah.size;
      for (const w of ahli) {
        const s = seksyen.get(Sasaran.kunci(w.unit) || "(tiada seksyen)");
        s.n++; if (sudah.has(w.id)) s.h++;
        const c = s.sel.get(p.id) || { n: 0, h: 0 }; c.n++; if (sudah.has(w.id)) c.h++; s.sel.set(p.id, c);
      }
    }
    const purata = baris.length ? baris.reduce((s, b) => s + b.kadar, 0) / baris.length : null;
    const rekodJum = baris.reduce((s, b) => s + b.h, 0);
    const senaraiSeksyen = [...seksyen.values()].filter(s => s.n > 0).sort((a, b) => a.urut - b.urut);
    return { tahun, kat, wk, idK, baris, akan, purata, rekodJum, unik, kaedah, bulan, seksyen: senaraiSeksyen };
  }

  // ---------- KPI ----------
  function paparKpi(r) {
    const jumK = r.wk.length;
    const tile = (label, nilai, sub, kelas = "") => `<div class="d-tile ${kelas}"><span class="d-label">${label}</span><b>${nilai}</b><small>${sub}</small></div>`;
    $("#dKpi").innerHTML =
      tile("Purata kadar kehadiran", pc(r.purata), r.baris.length ? `purata ${r.baris.length} program` : "tiada program selesai", "hero") +
      tile("Program dijalankan", nombor(r.baris.length), r.akan ? `+${r.akan} akan datang` : `tahun ${r.tahun}`) +
      tile("Rekod kehadiran", nombor(r.rekodJum), "dalam sasaran program") +
      tile("Warga terlibat", nombor(r.unik.size), `${jumK ? pc(r.unik.size / jumK) : "—"} daripada ${nombor(jumK)} hadir ≥1 program`);
    $("#dNota").textContent = r.akan ? `${r.akan} program akan datang tidak dikira dalam kadar.` : "";
  }

  // ---------- Graf bar mendatar (peratus) ----------
  function barMendatar(bekas, item, kosong) {
    if (!item.length) { bekas.innerHTML = `<p class="d-kosong">${kosong}</p>`; return; }
    const W = Math.max(320, bekas.clientWidth), labelW = Math.min(W * .42, 280), kanan = 52, atas = 22, tinggiBaris = 36, tebal = 18;
    const H = atas + item.length * tinggiBaris + 8;
    const svg = svgBaru(bekas, W, H), x0 = labelW + 12, x1 = W - kanan, skala = v => x0 + (x1 - x0) * v;
    for (const t of [0, .25, .5, .75, 1]) {
      el("line", { x1: skala(t), x2: skala(t), y1: atas - 4, y2: H - 8, class: t === 0 ? "d-dasar" : "d-garis" }, svg);
      el("text", { x: skala(t), y: atas - 8, class: "d-tik", "text-anchor": "middle" }, svg, `${t * 100}%`);
    }
    item.forEach((it, i) => {
      const y = atas + i * tinggiBaris + (tinggiBaris - tebal) / 2;
      const g = el("g", { class: "d-mark" }, svg);
      el("rect", { x: 0, y: y - 8, width: W, height: tebal + 16, class: "d-hit" }, g);
      muatkan(el("text", { x: labelW, y: y + tebal / 2 + 4, class: "d-label-y", "text-anchor": "end" }, g, it.label), it.label, labelW - 4);
      if (it.sub) el("text", { x: labelW, y: y + tebal / 2 + 16, class: "d-sub-y", "text-anchor": "end" }, g, it.sub);
      el("path", { d: laluanH(x0, Math.max(x0 + 1, skala(it.v)), y, tebal), class: "d-bar s1" }, g);
      el("text", { x: skala(it.v) + 6, y: y + tebal / 2 + 4, class: "d-nilai" }, g, pc(it.v));
      pasangTip(g, it.label, it.tip);
    });
  }

  // ---------- Graf lajur bulanan ----------
  function lajurBulan(bekas, bulan) {
    const jum = bulan.reduce((a, b) => a + b, 0);
    if (!jum) { bekas.innerHTML = '<p class="d-kosong">Tiada kehadiran direkodkan untuk tahun ini.</p>'; return; }
    const W = Math.max(320, bekas.clientWidth), H = 240, kiri = 40, bawah = 26, atas = 18, kanan = 8;
    const svg = svgBaru(bekas, W, H);
    const maks = Math.max(...bulan), langkah = Math.pow(10, Math.floor(Math.log10(maks || 1)));
    const atasSkala = Math.max(langkah, Math.ceil(maks / langkah) * langkah) || 1;
    const y = v => H - bawah - (H - bawah - atas) * v / atasSkala;
    for (let i = 0; i <= 4; i++) {
      const v = atasSkala * i / 4;
      el("line", { x1: kiri, x2: W - kanan, y1: y(v), y2: y(v), class: i ? "d-garis" : "d-dasar" }, svg);
      el("text", { x: kiri - 6, y: y(v) + 4, class: "d-tik", "text-anchor": "end" }, svg, nombor(Math.round(v)));
    }
    const slot = (W - kiri - kanan) / 12, tebal = Math.min(24, slot * .6), iMaks = bulan.indexOf(maks);
    bulan.forEach((v, i) => {
      const x = kiri + slot * i + (slot - tebal) / 2;
      const g = el("g", { class: "d-mark" }, svg);
      el("rect", { x: kiri + slot * i, y: atas, width: slot, height: H - bawah - atas, class: "d-hit" }, g);
      if (v) el("path", { d: laluanV(x, tebal, y(0), y(v)), class: "d-bar s1" }, g);
      el("text", { x: x + tebal / 2, y: H - 8, class: "d-tik", "text-anchor": "middle" }, g, BULAN[i]);
      if (i === iMaks) el("text", { x: x + tebal / 2, y: y(v) - 6, class: "d-nilai", "text-anchor": "middle" }, g, nombor(v));
      pasangTip(g, `${BULAN[i]} ${$("#fTahun").value}`, [["kehadiran", nombor(v)]]);
    });
  }

  // ---------- Peta haba ----------
  function petaHaba(bekas, r) {
    const prog = r.baris.map(b => b.p);
    if (!prog.length || !r.seksyen.length) { bekas.innerHTML = '<p class="d-kosong">Tiada program selesai untuk dipaparkan.</p>'; return; }
    const W = Math.max(320, bekas.clientWidth), labelW = Math.min(W * .34, 250), atas = 30;
    const sel = Math.max(26, Math.min(56, (W - labelW - 12) / prog.length)), tinggi = 28;
    const Wsebenar = labelW + 12 + sel * prog.length;
    const H = atas + r.seksyen.length * tinggi + 6;
    const svg = svgBaru(bekas, Wsebenar, H);
    prog.forEach((p, j) => el("text", { x: labelW + 12 + sel * j + sel / 2, y: atas - 10, class: "d-tik", "text-anchor": "middle" }, svg, `P${j + 1}`));
    r.seksyen.forEach((s, i) => {
      const y = atas + i * tinggi;
      muatkan(el("text", { x: labelW, y: y + tinggi / 2 + 4, class: "d-label-y", "text-anchor": "end" }, svg, s.nama), s.nama, labelW - 4);
      prog.forEach((p, j) => {
        const c = s.sel.get(p.id), x = labelW + 12 + sel * j;
        const g = el("g", { class: "d-mark" }, svg);
        if (!c) {
          el("rect", { x: x + 1, y: y + 1, width: sel - 2, height: tinggi - 2, rx: 4, class: "h-tiada" }, g);
          el("text", { x: x + sel / 2, y: y + tinggi / 2 + 4, class: "d-sub-y", "text-anchor": "middle" }, g, "—");
          pasangTip(g, s.nama, [[p.nama, "bukan sasaran"]]);
          return;
        }
        const v = c.h / c.n, bin = Math.min(4, Math.floor(v * 5));
        el("rect", { x: x + 1, y: y + 1, width: sel - 2, height: tinggi - 2, rx: 4, class: `h${bin + 1}` }, g);
        if (sel >= 36) el("text", { x: x + sel / 2, y: y + tinggi / 2 + 4, class: `h-teks t${bin + 1}`, "text-anchor": "middle" }, g, Math.round(v * 100));
        pasangTip(g, s.nama, [[`${p.nama} (${tarikhPendek(p.tarikh)})`, pc(v)], ["hadir / sasaran", `${c.h} / ${c.n}`]]);
      });
    });
    const legenda = document.createElement("div");
    legenda.className = "d-legenda";
    legenda.innerHTML = `<span class="d-skala"><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><i class="h5"></i></span>
      <span class="muted">0% → 100% (setiap langkah 20%)</span><span class="d-skala"><i class="h-tiada"></i></span><span class="muted">bukan sasaran</span>`;
    bekas.appendChild(legenda);
    const kunci = document.createElement("ol");
    kunci.className = "d-kunci-prog";
    prog.forEach((p, j) => { const li = document.createElement("li"); const b = document.createElement("b"); b.textContent = `P${j + 1}`; li.appendChild(b); li.appendChild(document.createTextNode(` ${p.nama} · ${tarikhPendek(p.tarikh)}`)); kunci.appendChild(li); });
    bekas.appendChild(kunci);
  }

  // ---------- Bar bertindan kaedah ----------
  function barKaedah(bekas, k) {
    const jum = k.telefon + k.muka + k.manual;
    if (!jum) { bekas.innerHTML = '<p class="d-kosong">Tiada rekod.</p>'; return; }
    const siri = [["Telefon (lokasi)", k.telefon, "s1"], ["Telefon + imbas muka", k.muka, "s2"], ["Manual oleh urus setia", k.manual, "s3"]];
    const W = Math.max(320, bekas.clientWidth), H = 44, tebal = 24, svg = svgBaru(bekas, W, H);
    let x = 0;
    const aktif = siri.filter(s => s[1] > 0);
    aktif.forEach(([label, n, kelas], i) => {
      const w = W * n / jum, akhir = i === aktif.length - 1;
      const lebar = Math.max(1, w - (akhir ? 0 : 2));   // jurang 2px warna permukaan antara segmen
      const g = el("g", { class: "d-mark" }, svg);
      el("rect", { x, y: 10, width: lebar, height: tebal, rx: aktif.length === 1 ? 4 : 0, class: `d-bar ${kelas}` }, g);
      const teks = `${Math.round(n / jum * 100)}%`;
      if (lebarTeks(teks) + 12 < lebar) el("text", { x: x + lebar / 2, y: 10 + tebal / 2 + 4, class: `d-dalam ${kelas}`, "text-anchor": "middle" }, g, teks);
      pasangTip(g, label, [["rekod", `${nombor(n)} (${teks})`]]);
      x += w;
    });
    const leg = document.createElement("div");
    leg.className = "d-legenda";
    for (const [label, n, kelas] of siri) {
      const s = document.createElement("span"); s.className = "d-leg";
      const i = document.createElement("i"); i.className = "d-sw " + kelas; s.appendChild(i);
      s.appendChild(document.createTextNode(`${label} — ${nombor(n)} (${Math.round(n / jum * 100)}%)`));
      leg.appendChild(s);
    }
    bekas.appendChild(leg);
  }

  // ---------- Paparan jadual (akses tanpa graf/tooltip) ----------
  function jadual(id, r) {
    const t = document.createElement("table"); t.className = "d-jadual";
    const tambah = (sel, nilai) => { const tr = document.createElement("tr"); nilai.forEach(v => { const c = document.createElement(sel); c.textContent = v; tr.appendChild(c); }); return tr; };
    const thead = t.createTHead(), tb = t.createTBody();
    if (id === "cProgram") {
      thead.appendChild(tambah("th", ["Program", "Tarikh", "Sasaran", "Hadir", "Kadar"]));
      r.baris.forEach(b => tb.appendChild(tambah("td", [b.p.nama, tarikhPendek(b.p.tarikh), `${Sasaran.label(b.p.sasaran)} (${b.n})`, b.h, pc(b.kadar)])));
    } else if (id === "cSeksyen") {
      thead.appendChild(tambah("th", ["Seksyen / Pejabat", "Jumlah sasaran", "Jumlah hadir", "Kadar"]));
      r.seksyen.forEach(s => tb.appendChild(tambah("td", [s.nama, s.n, s.h, pc(s.h / s.n)])));
    } else if (id === "cBulan") {
      thead.appendChild(tambah("th", ["Bulan", "Kehadiran"]));
      r.bulan.forEach((v, i) => tb.appendChild(tambah("td", [BULAN[i], v])));
    } else if (id === "cHaba") {
      thead.appendChild(tambah("th", ["Seksyen", ...r.baris.map((b, j) => `P${j + 1}`)]));
      r.seksyen.forEach(s => tb.appendChild(tambah("td", [s.nama, ...r.baris.map(b => { const c = s.sel.get(b.p.id); return c ? `${c.h}/${c.n} (${pc(c.h / c.n)})` : "—"; })])));
    } else {
      const k = r.kaedah, j = k.telefon + k.muka + k.manual || 1;
      thead.appendChild(tambah("th", ["Kaedah", "Rekod", "Bahagian"]));
      [["Telefon (lokasi)", k.telefon], ["Telefon + imbas muka", k.muka], ["Manual oleh urus setia", k.manual]].forEach(([l, n]) => tb.appendChild(tambah("td", [l, n, pc(n / j)])));
    }
    const bekas = $("#" + id); bekas.textContent = "";
    const w = document.createElement("div"); w.className = "d-jadual-wrap"; w.appendChild(t); bekas.appendChild(w);
  }

  function lukis() {
    if (!hasil) return;
    const r = hasil;
    const lukisSatu = (id, fn) => jadualAktif.has(id) ? jadual(id, r) : fn();
    lukisSatu("cProgram", () => barMendatar($("#cProgram"), r.baris.map(b => ({
      label: b.p.nama, sub: `${tarikhPendek(b.p.tarikh)} · ${b.h}/${b.n}`, v: b.kadar,
      tip: [["kadar kehadiran", pc(b.kadar)], ["hadir / sasaran", `${b.h} / ${b.n}`], ["sasaran", Sasaran.label(b.p.sasaran)]],
    })), "Tiada program selesai untuk tahun dan kategori ini."));
    lukisSatu("cSeksyen", () => barMendatar($("#cSeksyen"), [...r.seksyen].sort((a, b) => b.h / b.n - a.h / a.n).map(s => ({
      label: s.nama, v: s.h / s.n, tip: [["kadar kehadiran", pc(s.h / s.n)], ["hadir / sasaran (semua program)", `${s.h} / ${s.n}`]],
    })), "Tiada data seksyen."));
    lukisSatu("cBulan", () => lajurBulan($("#cBulan"), r.bulan));
    lukisSatu("cHaba", () => petaHaba($("#cHaba"), r));
    lukisSatu("cKaedah", () => barKaedah($("#cKaedah"), r.kaedah));
  }

  function kemas() { hasil = kira(); paparKpi(hasil); lukis(); }

  async function mula() {
    if (!sb) { $("#dLogin").innerHTML = '<p class="empty">Dashboard memerlukan mod dalam talian.</p>'; $("#dLogin").hidden = false; return; }
    if (!(await Store.sesi())) { $("#dLogin").hidden = false; return; }
    $("#dLogin").hidden = true;
    [warga, program, hadir] = await Promise.all([
      sb.from("warga").select("id,nama,unit,kategori,susunan").then(semak),
      sb.from("program").select("id,nama,tarikh,sasaran,kod").then(semak),
      sb.from("kehadiran").select("program_id,warga_id,masa,kaedah,jarak_muka").then(semak),
    ]);
    const kini = hariIni().slice(0, 4);
    const tahun = [...new Set(program.map(p => p.tarikh.slice(0, 4)).concat(kini))].sort().reverse();
    $("#fTahun").innerHTML = tahun.map(t => `<option${t === kini ? " selected" : ""}>${t}</option>`).join("");
    $("#dUtama").hidden = false;
    kemas();
  }

  $("#fTahun").addEventListener("change", kemas);
  $("#fKategori").addEventListener("change", kemas);
  document.querySelectorAll("[data-jadual]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.jadual;
    jadualAktif.has(id) ? jadualAktif.delete(id) : jadualAktif.add(id);
    b.textContent = jadualAktif.has(id) ? "Graf" : "Jadual";
    lukis();
  }));
  addEventListener("resize", () => { clearTimeout(lukis._t); lukis._t = setTimeout(lukis, 150); });
  $("#borangLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target.elements;
    try { await Store.logMasuk({ email: f.email.value, password: f.password.value }); mula(); }
    catch (err) { $("#loginRalat").textContent = err.message; $("#loginRalat").hidden = false; }
  });
  mula().catch(err => { const t = $("#toast"); t.textContent = err.message; t.className = "toast error"; t.hidden = false; });
})();
