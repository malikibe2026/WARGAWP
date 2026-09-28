// Halaman pentadbir: urus program, kod QR dan senarai kehadiran.
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

  const sb = Store.sb;
  const st = { teksSijil: [], templatBaru: null, program: [], kiraan: new Map(), warga: [], semasa: null, hadir: [], tab: "hadir", sedangEdit: null, manual: null, pemasa: null };

  function toast(msg, ralat) {
    const t = $("#toast");
    t.textContent = msg; t.className = "toast" + (ralat ? " error" : ""); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3500);
  }
  const semak = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  const jam = t => t ? t.slice(0, 5) : "";
  const tarikhPanjang = iso => new Date(iso + "T00:00:00").toLocaleDateString("ms-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const pautanHadir = p => new URL(`hadir.html?p=${encodeURIComponent(p.kod)}`, location.href).href;
  const hariIni = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

  function papar(id) {
    for (const s of ["#paparLogin", "#paparSenarai", "#paparHadir"]) $(s).hidden = s !== id;
    clearInterval(st.pemasa);
  }

  // ---------- Log masuk ----------
  async function mula() {
    if (!sb) { $("#paparLogin").innerHTML = '<p class="empty">Modul kehadiran memerlukan mod dalam talian (Supabase).</p>'; return papar("#paparLogin"); }
    if (!(await Store.sesi())) { $("#btnLogout").hidden = true; return papar("#paparLogin"); }
    $("#btnLogout").hidden = false;
    st.warga = semak(await sb.from("warga").select("id,nama,jawatan,gred,unit,gambar_url,susunan").order("susunan", { nullsFirst: false }));
    await muatProgram();
  }

  $("#borangLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target.elements;
    try { await Store.logMasuk({ email: f.email.value, password: f.password.value }); $("#loginRalat").hidden = true; mula(); }
    catch (err) { $("#loginRalat").textContent = err.message; $("#loginRalat").hidden = false; }
  });
  $("#btnLogout").onclick = async () => { await Store.logKeluar(); location.reload(); };

  // ---------- Senarai program ----------
  async function muatProgram() {
    st.program = semak(await sb.from("program").select("*").order("tarikh", { ascending: false }).order("masa_mula", { ascending: false }));
    const k = semak(await sb.from("kehadiran").select("program_id"));
    st.kiraan = new Map();
    for (const r of k) st.kiraan.set(r.program_id, (st.kiraan.get(r.program_id) || 0) + 1);
    paparProgram();
    papar("#paparSenarai");
  }

  function lencana(p) {
    const hari = hariIni();
    if (!p.aktif) return '<span class="lencana ditutup">Ditutup</span>';
    if (p.tarikh === hari) return '<span class="lencana langsung"><i class="dot"></i>Hari ini</span>';
    if (p.tarikh > hari) return '<span class="lencana akan">Akan datang</span>';
    return '<span class="lencana lepas">Selesai</span>';
  }

  function paparProgram() {
    const el = $("#senaraiProgram");
    if (!st.program.length) {
      el.innerHTML = '<div class="empty">Belum ada program. Klik <b>Program Baharu</b> untuk mula.</div>';
      return;
    }
    el.innerHTML = st.program.map(p => {
      const bil = st.kiraan.get(p.id) || 0;
      const masa = p.masa_mula ? `${jam(p.masa_mula)}${p.masa_tamat ? "–" + jam(p.masa_tamat) : ""}` : "Sepanjang hari";
      return `<article class="kad-program">
        <div class="kp-atas">${lencana(p)}<span class="kp-kod">${esc(p.kod)}</span></div>
        <h3>${esc(p.nama)}</h3>
        <ul class="kp-meta">
          <li>📅 ${esc(tarikhPanjang(p.tarikh))}</li>
          <li>🕘 ${esc(masa)}</li>
          <li>📍 ${esc(p.lokasi_nama || "—")}${p.lat != null ? ` <span class="muted">(${p.radius_m} m)</span>` : ' <span class="muted">(tiada semakan lokasi)</span>'}</li>
        </ul>
        <div class="kp-bawah">
          <div class="kp-bil"><b>${bil}</b><span>/ ${st.warga.length} hadir</span></div>
          <div class="kp-aksi">
            <button class="btn btn-soft btn-sm" data-qr="${p.id}">Kod QR</button>
            <button class="btn btn-soft btn-sm" data-edit="${p.id}">Ubah</button>
            <button class="btn btn-primary btn-sm" data-lihat="${p.id}">Kehadiran</button>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  $("#senaraiProgram").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const p = st.program.find(x => x.id === (b.dataset.qr || b.dataset.edit || b.dataset.lihat));
    if (b.dataset.qr) bukaQR(p);
    else if (b.dataset.edit) bukaBorang(p);
    else if (b.dataset.lihat) bukaHadir(p);
  });

  // ---------- Tetapan e-mel & sijil ----------
  const RUANG = ["nama", "jawatan", "gred", "unit", "program", "tarikh", "masa", "lokasi", "masa_hadir"];
  const ISI_LALAI = `Assalamualaikum dan salam sejahtera {nama},

Terima kasih atas kehadiran tuan/puan ke {program} pada {tarikh} di {lokasi}.

Kehadiran tuan/puan telah direkodkan pada {masa_hadir}.

Sekian, terima kasih.

Urus Setia
Jabatan Perangkaan Malaysia, Wilayah Persekutuan`;
  const TEKS_LALAI = [{ teks: "{nama}", x: 50, y: 50, saiz: 28, tebal: true, warna: "#0e1b2e", fon: "serif" }];

  function paparBarisTeks() {
    $("#barisTeks").innerHTML = st.teksSijil.map((t, i) => `
      <div class="baris-t" data-i="${i}">
        <input data-k="teks" value="${esc(t.teks)}" placeholder="cth. {nama}" aria-label="Teks">
        <label>X<input data-k="x" type="number" min="0" max="100" step="0.5" value="${t.x ?? 50}"></label>
        <label>Y<input data-k="y" type="number" min="0" max="100" step="0.5" value="${t.y ?? 50}"></label>
        <label>Saiz<input data-k="saiz" type="number" min="6" max="120" value="${t.saiz ?? 24}"></label>
        <select data-k="fon" aria-label="Fon">
          <option value="serif"${t.fon === "serif" ? " selected" : ""}>Serif</option>
          <option value="serif-italik"${t.fon === "serif-italik" ? " selected" : ""}>Serif italik</option>
          <option value="sans"${t.fon === "sans" ? " selected" : ""}>Sans</option>
        </select>
        <label class="kecil"><input data-k="tebal" type="checkbox"${t.tebal ? " checked" : ""}>Tebal</label>
        <input data-k="warna" type="color" value="${esc(t.warna || "#000000")}" aria-label="Warna">
        <button type="button" class="icon-btn" data-buang-teks="${i}" aria-label="Buang baris"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>`).join("");
  }
  $("#barisTeks").addEventListener("input", e => {
    const row = e.target.closest("[data-i]"), k = e.target.dataset.k; if (!row || !k) return;
    const t = st.teksSijil[+row.dataset.i];
    t[k] = e.target.type === "checkbox" ? e.target.checked : ["x", "y", "saiz"].includes(k) ? +e.target.value : e.target.value;
  });
  $("#barisTeks").addEventListener("click", e => {
    const b = e.target.closest("[data-buang-teks]"); if (!b) return;
    st.teksSijil.splice(+b.dataset.buangTeks, 1); paparBarisTeks();
  });
  $("#btnTambahTeks").onclick = () => {
    st.teksSijil.push({ teks: "", x: 50, y: 65, saiz: 16, tebal: false, warna: "#333333", fon: "sans" }); paparBarisTeks();
  };
  $("#cipRuang").innerHTML = RUANG.map(r => `<button type="button" class="cip" data-ruang="{${r}}">{${r}}</button>`).join(" ");
  $("#cipRuang").addEventListener("click", e => {
    const b = e.target.closest("[data-ruang]"); if (!b) return;
    const ta = $("#borangProgram").elements.emel_isi, i = ta.selectionStart ?? ta.value.length;
    ta.value = ta.value.slice(0, i) + b.dataset.ruang + ta.value.slice(ta.selectionEnd ?? i);
    ta.focus(); ta.selectionStart = ta.selectionEnd = i + b.dataset.ruang.length;
  });
  function kemasLipat() {
    const f = $("#borangProgram").elements;
    $("#kotakEmel").hidden = !f.emel_aktif.checked;
    $("#kotakSijil").hidden = !f.sijil_aktif.checked;
    if (f.sijil_aktif.checked && !f.emel_aktif.checked) { f.emel_aktif.checked = true; $("#kotakEmel").hidden = false; }
  }
  $("#borangProgram").elements.emel_aktif.addEventListener("change", () => {
    const f = $("#borangProgram").elements;
    if (!f.emel_aktif.checked) f.sijil_aktif.checked = false;
    kemasLipat();
  });
  $("#borangProgram").elements.sijil_aktif.addEventListener("change", kemasLipat);
  $("#failTemplat").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { e.target.value = ""; return toast("Templat melebihi 10 MB.", true); }
    st.templatBaru = f; $("#namaTemplat").textContent = f.name + " (belum disimpan)";
  });

  async function baitTemplat() {
    if (st.templatBaru) return { bait: new Uint8Array(await st.templatBaru.arrayBuffer()), jenis: st.templatBaru.type };
    const laluan = st.sedangEdit?.sijil_templat;
    if (!laluan) return { bait: null };
    const { data, error } = await sb.storage.from("templat-sijil").download(laluan);
    if (error) throw new Error("Templat tidak dapat dimuat: " + error.message);
    return { bait: new Uint8Array(await data.arrayBuffer()), jenis: data.type };
  }

  $("#btnPratonton").onclick = async () => {
    const f = $("#borangProgram").elements, b = $("#btnPratonton");
    b.disabled = true; b.textContent = "Menjana…";
    try {
      const { bait, jenis } = await baitTemplat();
      const pdf = await Sijil.jana(PDFLib, { templat: bait, jenis, teks: st.teksSijil, data: {
        nama: "NUR ALIA BINTI MOHD RAZALI ABDULLAH", jawatan: "Pembantu Perangkaan", gred: "E2", unit: "Seksyen Contoh",
        program: f.nama.value || "Nama Program", lokasi: f.lokasi_nama.value || "Lokasi Program",
        tarikh: f.tarikh.value ? new Date(f.tarikh.value + "T00:00:00").toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : "",
        masa: f.masa_mula.value, masa_hadir: "09:05 PG" } });
      const ifr = $("#pratontonSijil");
      if (st.urlPratonton) URL.revokeObjectURL(st.urlPratonton);
      st.urlPratonton = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      ifr.src = st.urlPratonton + "#toolbar=0&view=Fit"; ifr.hidden = false;
      $("#pautanPratonton").href = st.urlPratonton; $("#pautanPratonton").hidden = false;
    } catch (err) { toast(err.message, true); }
    finally { b.disabled = false; b.textContent = "Pratonton sijil"; }
  };

  // ---------- Borang program ----------
  function bukaBorang(p) {
    st.sedangEdit = p || null;
    const f = $("#borangProgram");
    f.reset();
    $("#tajukBorangProgram").textContent = p ? "Ubah Program" : "Program Baharu";
    f.elements.nama.value = p?.nama || "";
    f.elements.tarikh.value = p?.tarikh || hariIni();
    f.elements.masa_mula.value = jam(p?.masa_mula);
    f.elements.masa_tamat.value = jam(p?.masa_tamat);
    f.elements.lokasi_nama.value = p?.lokasi_nama || "";
    f.elements.koordinat.value = p?.lat != null ? `${p.lat}, ${p.lng}` : "";
    f.elements.radius_m.value = String(p?.radius_m || 200);
    f.elements.aktif.checked = p ? p.aktif : true;
    f.elements.emel_aktif.checked = !!p?.emel_aktif;
    f.elements.emel_subjek.value = p?.emel_subjek || "Pengesahan Kehadiran: {program}";
    f.elements.emel_isi.value = p?.emel_isi || ISI_LALAI;
    f.elements.sijil_aktif.checked = !!p?.sijil_aktif;
    st.templatBaru = null; $("#failTemplat").value = "";
    $("#namaTemplat").textContent = p?.sijil_templat ? "Templat telah dimuat naik" : "Tiada templat (reka bentuk ringkas digunakan)";
    st.teksSijil = JSON.parse(JSON.stringify(p?.sijil_teks?.length ? p.sijil_teks : TEKS_LALAI));
    paparBarisTeks();
    $("#pratontonSijil").hidden = true; $("#pautanPratonton").hidden = true;
    kemasLipat();
    $("#btnPadamProgram").hidden = !p;
    $("#programRalat").hidden = true;
    $("#dlgProgram").showModal();
  }

  function huraiKoordinat(s) {
    s = s.trim(); if (!s) return { lat: null, lng: null };
    const m = s.match(/(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)/);
    if (!m) throw new Error("Format koordinat tidak sah. Contoh: 3.16690, 101.69600");
    const lat = +m[1], lng = +m[2];
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error("Koordinat di luar julat.");
    return { lat, lng };
  }

  $("#btnLokasiSaya").onclick = () => {
    const b = $("#btnLokasiSaya span"); b.textContent = "Mendapatkan lokasi…";
    navigator.geolocation.getCurrentPosition(p => {
      $("#borangProgram").elements.koordinat.value = `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;
      b.textContent = `Lokasi diambil (±${Math.round(p.coords.accuracy)} m)`;
    }, () => { b.textContent = "Guna lokasi semasa saya"; toast("Lokasi tidak dapat dikesan.", true); },
    { enableHighAccuracy: true, timeout: 20000 });
  };

  $("#borangProgram").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target.elements, ralat = $("#programRalat");
    try {
      if (!f.nama.value.trim()) throw new Error("Nama program wajib diisi.");
      if (!f.tarikh.value) throw new Error("Tarikh wajib diisi.");
      if (f.masa_mula.value && f.masa_tamat.value && f.masa_tamat.value <= f.masa_mula.value) throw new Error("Masa tamat mesti selepas masa mula.");
      const { lat, lng } = huraiKoordinat(f.koordinat.value);
      const rekod = {
        nama: f.nama.value.trim(), tarikh: f.tarikh.value,
        masa_mula: f.masa_mula.value || null, masa_tamat: f.masa_tamat.value || null,
        lokasi_nama: f.lokasi_nama.value.trim() || null, lat, lng,
        radius_m: +f.radius_m.value, aktif: f.aktif.checked,
        emel_aktif: f.emel_aktif.checked, emel_subjek: f.emel_subjek.value.trim() || null,
        emel_isi: f.emel_isi.value.trim() || null, sijil_aktif: f.sijil_aktif.checked,
        sijil_teks: st.teksSijil.filter(t => String(t.teks || "").trim()),
      };
      if (rekod.sijil_aktif && !rekod.sijil_teks.length) throw new Error("Sijil perlu sekurang-kurangnya satu baris teks, cth. {nama}.");
      if (st.templatBaru) {
        const ext = (st.templatBaru.name.split(".").pop() || "bin").toLowerCase();
        const laluan = `${crypto.randomUUID()}.${ext}`;
        semak(await sb.storage.from("templat-sijil").upload(laluan, st.templatBaru, { contentType: st.templatBaru.type }));
        rekod.sijil_templat = laluan;
      }
      $("#btnSimpanProgram").disabled = true;
      if (st.sedangEdit) semak(await sb.from("program").update(rekod).eq("id", st.sedangEdit.id));
      else semak(await sb.from("program").insert(rekod));
      $("#dlgProgram").close();
      toast("Program disimpan.");
      await muatProgram();
    } catch (err) { ralat.textContent = err.message; ralat.hidden = false; }
    finally { $("#btnSimpanProgram").disabled = false; }
  });

  $("#btnPadamProgram").onclick = async () => {
    const p = st.sedangEdit;
    if (!p || !confirm(`Padam program "${p.nama}" berserta semua rekod kehadirannya? Tindakan ini tidak boleh dibatalkan.`)) return;
    try { semak(await sb.from("program").delete().eq("id", p.id)); $("#dlgProgram").close(); toast("Program dipadam."); await muatProgram(); }
    catch (err) { toast(err.message, true); }
  };

  // ---------- QR ----------
  function svgQR(teks) {
    const qr = qrcode(0, "M"); qr.addData(teks); qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }

  function bukaQR(p) {
    const url = pautanHadir(p);
    $("#qrNama").textContent = p.nama;
    $("#qrMeta").textContent = [tarikhPanjang(p.tarikh), p.lokasi_nama].filter(Boolean).join(" · ");
    $("#qrKod").innerHTML = svgQR(url);
    $("#qrPautan").value = url;
    st.qrProgram = p;
    $("#dlgQR").showModal();
  }
  $("#btnSalinPautan").onclick = async () => {
    try { await navigator.clipboard.writeText($("#qrPautan").value); toast("Pautan disalin."); }
    catch { $("#qrPautan").select(); }
  };
  $("#btnCetakQR").onclick = () => {
    const p = st.qrProgram, url = pautanHadir(p);
    const w = window.open("", "_blank");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR ${esc(p.nama)}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#0e1b2e}
      h1{font-size:30px;margin:8px 0}p{color:#555;font-size:16px;margin:4px 0}.qr{width:340px;margin:28px auto}
      .k{letter-spacing:.2em;text-transform:uppercase;color:#b08a10;font-weight:700;font-size:13px}.u{font-size:12px;color:#888;word-break:break-all}</style>
      </head><body><p class="k">Imbas untuk rekod kehadiran</p><h1>${esc(p.nama)}</h1>
      <p>${esc(tarikhPanjang(p.tarikh))}${p.masa_mula ? " · " + jam(p.masa_mula) + (p.masa_tamat ? "–" + jam(p.masa_tamat) : "") : ""}</p>
      <p>${esc(p.lokasi_nama || "")}</p><div class="qr">${svgQR(url)}</div>
      <p>Buka kamera telefon → imbas kod → cari nama anda → Sahkan Lokasi &amp; Hadir</p>
      <p class="u">${esc(url)}</p><p style="margin-top:24px;font-size:12px">Jabatan Perangkaan Malaysia, Wilayah Persekutuan</p>
      <script>onload=()=>print()<\/script></body></html>`);
    w.document.close();
  };

  // ---------- Kehadiran ----------
  async function bukaHadir(p) {
    st.semasa = p; st.tab = "hadir";
    $("#tabHadir").classList.add("active"); $("#tabBelum").classList.remove("active");
    $("#cariHadir").value = "";
    const units = [...new Set(st.warga.map(w => w.unit).filter(Boolean))];
    $("#unitHadir").innerHTML = '<option value="">Semua unit</option>' + units.map(u => `<option>${esc(u)}</option>`).join("");
    papar("#paparHadir");
    await muatHadir();
    st.pemasa = setInterval(muatHadir, 15000);
  }

  async function muatHadir() {
    let p = st.semasa; if (!p) return;
    const baru = semak(await sb.from("program").select("*").eq("id", p.id).maybeSingle());
    if (baru) p = st.semasa = baru;
    try { st.hadir = semak(await sb.from("kehadiran").select("*").eq("program_id", p.id).order("masa", { ascending: false })); }
    catch (err) { return toast(err.message, true); }
    const masa = p.masa_mula ? `${jam(p.masa_mula)}${p.masa_tamat ? "–" + jam(p.masa_tamat) : ""}` : "Sepanjang hari";
    const peratus = st.warga.length ? Math.round(st.hadir.length / st.warga.length * 100) : 0;
    $("#kepalaHadir").innerHTML = `
      <div>
        <div class="kp-atas">${lencana(p)}</div>
        <h2>${esc(p.nama)}</h2>
        <p class="muted">${esc(tarikhPanjang(p.tarikh))} · ${esc(masa)}${p.lokasi_nama ? " · " + esc(p.lokasi_nama) : ""}</p>
      </div>
      <div class="kh-stat">
        <div class="cincin" style="--p:${peratus}"><b>${peratus}%</b></div>
        <div><b class="besar">${st.hadir.length}</b><span> / ${st.warga.length} hadir</span>
          <div class="muted" style="font-size:12px">Dikemas kini ${new Date().toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kuala_Lumpur" })}</div></div>
        <button class="btn btn-soft btn-sm" id="btnQRDariHadir">Kod QR</button>
      </div>`;
    $("#btnQRDariHadir").onclick = () => bukaQR(p);
    paparHadir();
  }

  function lencanaEmel(h) {
    const m = { dihantar: ["ok", "✉ Dihantar"], gagal: ["ditutup", "✉ Gagal"], tiada_emel: ["lepas", "Tiada e-mel"], menghantar: ["akan", "✉ Menghantar"] }[h.emel_status];
    return m ? `<span class="lencana ${m[0]}" title="${esc(h.emel_ralat || "")}">${m[1]}</span>` : "";
  }

  async function hantarEmel(wargaIds) {
    const b = $("#btnHantarSemua span"); let siap = 0, gagal = 0;
    for (let i = 0; i < wargaIds.length; i += 10) {
      b.textContent = `Menghantar ${Math.min(i + 10, wargaIds.length)}/${wargaIds.length}…`;
      const { data, error } = await sb.functions.invoke("hantar-pengesahan", { body: { program_id: st.semasa.id, warga_ids: wargaIds.slice(i, i + 10) } });
      if (error || !data?.ok) { b.textContent = "Hantar e-mel"; return toast("Gagal: " + (data?.sebab || error?.message), true); }
      for (const r of Object.values(data.hasil)) r.ok ? siap++ : gagal++;
    }
    b.textContent = "Hantar e-mel";
    toast(`${siap} e-mel dihantar${gagal ? `, ${gagal} gagal / tiada e-mel` : ""}.`, gagal > 0 && !siap);
    muatHadir();
  }

  $("#btnHantarSemua").onclick = () => {
    const belum = st.hadir.filter(h => h.emel_status !== "dihantar").map(h => h.warga_id);
    if (!belum.length) return toast("Semua warga hadir telah menerima e-mel.");
    const sijil = st.semasa.sijil_aktif ? " berserta sijil" : "";
    if (confirm(`Hantar e-mel pengesahan${sijil} kepada ${belum.length} warga hadir yang belum menerimanya?`)) hantarEmel(belum);
  };

  function paparHadir() {
    const q = $("#cariHadir").value.trim().toLowerCase(), unit = $("#unitHadir").value;
    const ikutId = new Map(st.warga.map(w => [w.id, w]));
    const padan = w => w && (!unit || w.unit === unit) && (!q || `${w.nama} ${w.unit} ${w.jawatan}`.toLowerCase().includes(q));
    const el = $("#senaraiHadir");
    if (st.tab === "hadir") {
      const baris = st.hadir.map(h => ({ h, w: ikutId.get(h.warga_id) })).filter(x => padan(x.w));
      el.innerHTML = baris.length ? baris.map(({ h, w }) => `
        <div class="baris-hadir">
          <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="">
          <div class="bh-nama"><b>${esc(w.nama)}</b><small>${esc([w.jawatan, w.unit].filter(Boolean).join(" · "))}</small></div>
          <div class="bh-emel">${lencanaEmel(h)}</div>
          <div class="bh-masa">${new Date(h.masa).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })}</div>
          <div class="bh-lokasi">${h.kaedah === "manual" ? '<span class="lencana lepas">Manual</span>'
            : h.jarak_m != null ? `<span class="lencana ok">✓ ${Math.round(h.jarak_m)} m</span>` : '<span class="lencana lepas">Tiada lokasi</span>'}</div>
          <button class="icon-btn" data-emel="${h.warga_id}" title="Hantar e-mel pengesahan" aria-label="Hantar e-mel kepada ${esc(w.nama)}"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/></svg></button>
          <button class="icon-btn" data-buang="${h.id}" title="Buang rekod" aria-label="Buang rekod ${esc(w.nama)}"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
        </div>`).join("") : '<div class="empty">Belum ada kehadiran direkodkan.</div>';
    } else {
      const sudah = new Set(st.hadir.map(h => h.warga_id));
      const belum = st.warga.filter(w => !sudah.has(w.id) && padan(w));
      el.innerHTML = belum.length ? belum.map(w => `
        <div class="baris-hadir">
          <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="">
          <div class="bh-nama"><b>${esc(w.nama)}</b><small>${esc([w.jawatan, w.unit].filter(Boolean).join(" · "))}</small></div>
          <button class="btn btn-soft btn-sm" data-manual="${w.id}">Tanda hadir</button>
        </div>`).join("") : '<div class="empty">Semua warga dalam tapisan ini telah hadir.</div>';
    }
  }

  $("#tabHadir").onclick = () => { st.tab = "hadir"; $("#tabHadir").classList.add("active"); $("#tabBelum").classList.remove("active"); paparHadir(); };
  $("#tabBelum").onclick = () => { st.tab = "belum"; $("#tabBelum").classList.add("active"); $("#tabHadir").classList.remove("active"); paparHadir(); };
  $("#cariHadir").addEventListener("input", paparHadir);
  $("#unitHadir").addEventListener("input", paparHadir);
  $("#btnKembali").onclick = () => muatProgram();

  $("#senaraiHadir").addEventListener("click", async e => {
    const buang = e.target.closest("[data-buang]"), manual = e.target.closest("[data-manual]"), emel = e.target.closest("[data-emel]");
    if (emel) {
      const w = st.warga.find(x => x.id === emel.dataset.emel);
      if (confirm(`Hantar e-mel pengesahan${st.semasa.sijil_aktif ? " dan sijil" : ""} kepada ${w?.nama}?`)) hantarEmel([emel.dataset.emel]);
    } else if (buang) {
      if (!confirm("Buang rekod kehadiran ini?")) return;
      try { semak(await sb.from("kehadiran").delete().eq("id", buang.dataset.buang)); toast("Rekod dibuang."); muatHadir(); }
      catch (err) { toast(err.message, true); }
    } else if (manual) {
      st.manual = st.warga.find(w => w.id === manual.dataset.manual);
      $("#manualNama").textContent = st.manual.nama;
      $("#dlgManual").showModal();
    }
  });
  $("#btnSahManual").onclick = async () => {
    try {
      semak(await sb.from("kehadiran").insert({ program_id: st.semasa.id, warga_id: st.manual.id, kaedah: "manual" }));
      $("#dlgManual").close(); toast(`${st.manual.nama} ditanda hadir.`); muatHadir();
    } catch (err) { toast(err.message, true); }
  };

  $("#btnEksportHadir").onclick = () => {
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const ikutHadir = new Map(st.hadir.map(h => [h.warga_id, h]));
    const baris = [["Bil", "Nama", "Jawatan", "Gred", "Unit", "Status", "Masa", "Kaedah", "Jarak (m)"].map(q).join(",")];
    st.warga.forEach((w, i) => {
      const h = ikutHadir.get(w.id);
      baris.push([i + 1, w.nama, w.jawatan, w.gred, w.unit, h ? "Hadir" : "Tidak hadir",
        h ? new Date(h.masa).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" }) : "", h ? h.kaedah : "", h?.jarak_m != null ? Math.round(h.jarak_m) : ""].map(q).join(","));
    });
    const url = URL.createObjectURL(new Blob(["﻿" + baris.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: `kehadiran-${st.semasa.kod}-${st.semasa.tarikh}.csv` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  $("#btnProgramBaru").onclick = () => bukaBorang(null);
  document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());

  mula().catch(err => toast(err.message, true));
})();
