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
  // timestamptz ⇄ nilai <input type="datetime-local"> (waktu Malaysia, UTC+8)
  const keInputMasa = iso => iso ? new Date(Date.parse(iso) + 8 * 3600e3).toISOString().slice(0, 16) : "";
  const dariInputMasa = v => v ? new Date(v + ":00+08:00").toISOString() : null;
  const masaPendek = iso => new Date(iso).toLocaleString("ms-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
  const pautanAlat = (fail, p) => new URL(`${fail}?id=${encodeURIComponent(p.id)}`, location.href).href;

  // Status pendaftaran: ikut tempoh khas jika ditetapkan, jika tidak ikut tarikh program.
  function statusDaftar(p) {
    if (!p.aktif) return "ditutup";
    if (p.daftar_mula || p.daftar_tamat) {
      const kini = Date.now();
      if (p.daftar_mula && kini < Date.parse(p.daftar_mula)) return "belum";
      if (p.daftar_tamat && kini > Date.parse(p.daftar_tamat)) return "tamat";
      return "buka";
    }
    const hari = hariIni();
    return p.tarikh === hari ? "buka" : p.tarikh > hari ? "belum" : "tamat";
  }
  function teksTempoh(p) {
    if (!p.daftar_mula && !p.daftar_tamat) return "Ikut masa program";
    return `${p.daftar_mula ? masaPendek(p.daftar_mula) : "Sekarang"} → ${p.daftar_tamat ? masaPendek(p.daftar_tamat) : "tiada had"}`;
  }

  function papar(id) {
    for (const s of ["#paparLogin", "#paparSenarai", "#paparHadir"]) $(s).hidden = s !== id;
    clearInterval(st.pemasa);
  }

  // ---------- Log masuk ----------
  async function mula() {
    if (!sb) { $("#paparLogin").innerHTML = '<p class="empty">Modul kehadiran memerlukan mod dalam talian (Supabase).</p>'; return papar("#paparLogin"); }
    if (!(await Store.sesi())) { $("#btnLogout").hidden = true; return papar("#paparLogin"); }
    $("#btnLogout").hidden = false;
    st.warga = semak(await sb.from("warga").select("id,nama,jawatan,gred,unit,gambar_url,susunan,kategori").order("susunan", { nullsFirst: false }));
    semakCapMuka();
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
    const s = statusDaftar(p);
    if (s === "ditutup") return '<span class="lencana ditutup">Ditutup</span>';
    if (s === "buka") return '<span class="lencana langsung"><i class="dot"></i>Pendaftaran dibuka</span>';
    if (s === "belum") return `<span class="lencana akan">${p.daftar_mula ? "Dibuka " + esc(masaPendek(p.daftar_mula)) : "Akan datang"}</span>`;
    return '<span class="lencana lepas">Selesai</span>';
  }

  const IKON_P = {
    salin: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    skrin: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    laporan: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  };

  function paparProgram() {
    const el = $("#senaraiProgram");
    if (!st.program.length) {
      el.innerHTML = '<div class="empty">Belum ada program. Klik <b>Program Baharu</b> untuk mula.</div>';
      return;
    }
    el.innerHTML = st.program.map(p => {
      const bil = st.kiraan.get(p.id) || 0, sasaran = Sasaran.ahli(st.warga, p.sasaran).length;
      const masa = p.masa_mula ? `${jam(p.masa_mula)}${p.masa_tamat ? "–" + jam(p.masa_tamat) : ""}` : "Sepanjang hari";
      return `<article class="kad-program">
        <div class="kp-atas">${lencana(p)}<span class="kp-kod">${esc(p.kod)}</span></div>
        <h3>${esc(p.nama)}</h3>
        <ul class="kp-meta">
          <li>📅 ${esc(tarikhPanjang(p.tarikh))}</li>
          <li>🕘 ${esc(masa)}</li>
          ${p.daftar_mula || p.daftar_tamat ? `<li>📝 Daftar: ${esc(teksTempoh(p))}</li>` : ""}
          <li>${p.kaedah_sah === "nama" ? "🔎 Carian nama" : p.kaedah_sah === "nama_muka" ? "🙂 Nama + imbas muka" : "🙂 Imbas muka"}${p.emel_aktif ? " · ✉ E-mel" : ""}${p.sijil_aktif ? ` · 📜 Sijil (${[p.sijil_emel !== false && "e-mel", p.sijil_muat_turun && "muat turun"].filter(Boolean).join(" + ") || "tiada cara"})` : ""}</li>
          ${p.sasaran && p.sasaran !== "semua" ? `<li>🎯 Sasaran: ${esc(Sasaran.label(p.sasaran))}</li>` : ""}
          <li>📍 ${esc(p.lokasi_nama || "—")}${p.lat != null ? ` <span class="muted">(${p.radius_m} m)</span>` : ' <span class="muted">(tiada semakan lokasi)</span>'}</li>
        </ul>
        <div class="kp-bawah">
          <div class="kp-bil"><b>${bil}</b><span>/ ${sasaran} hadir</span></div>
          <div class="kp-aksi">
            <button class="icon-btn" data-salin="${p.id}" title="Salin program (untuk program berulang)" aria-label="Salin program">${IKON_P.salin}</button>
            <a class="icon-btn" href="${esc(pautanAlat("paparan.html", p))}" target="_blank" rel="noopener" title="Skrin paparan langsung (projektor)" aria-label="Skrin paparan">${IKON_P.skrin}</a>
            <a class="icon-btn" href="${esc(pautanAlat("laporan.html", p))}" target="_blank" rel="noopener" title="Laporan kehadiran rasmi (cetak / PDF)" aria-label="Laporan">${IKON_P.laporan}</a>
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
    const p = st.program.find(x => x.id === (b.dataset.qr || b.dataset.edit || b.dataset.lihat || b.dataset.salin));
    if (b.dataset.salin) bukaBorang(p, true);
    else if (b.dataset.qr) bukaQR(p);
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
    // Sijil melalui e-mel memerlukan e-mel pengesahan diaktifkan.
    if (f.sijil_aktif.checked && f.sijil_emel.checked && !f.emel_aktif.checked) { f.emel_aktif.checked = true; $("#kotakEmel").hidden = false; }
  }
  $("#borangProgram").elements.emel_aktif.addEventListener("change", () => {
    const f = $("#borangProgram").elements;
    if (!f.emel_aktif.checked) f.sijil_emel.checked = false;
    kemasLipat();
  });
  $("#borangProgram").elements.sijil_aktif.addEventListener("change", kemasLipat);
  $("#borangProgram").elements.sijil_emel.addEventListener("change", kemasLipat);
  // Gambar templat ditukar ke JPEG ≤2339px: pelayan (had CPU ~2 s) tidak mampu nyahkod PNG besar.
  function keJpeg(blob) {
    return new Promise((ok, gagal) => {
      const img = new Image();
      img.onload = () => {
        const skala = Math.min(1, 2339 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * skala); c.height = Math.round(img.height * skala);
        const x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(b => b ? ok(new File([b], "templat.jpg", { type: "image/jpeg" })) : gagal(new Error("Gagal menukar templat")), "image/jpeg", 0.9);
      };
      img.onerror = () => gagal(new Error("Fail templat bukan gambar yang sah"));
      img.src = URL.createObjectURL(blob);
    });
  }

  $("#failTemplat").addEventListener("change", async e => {
    let f = e.target.files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { e.target.value = ""; return toast("Templat melebihi 10 MB.", true); }
    const nama = f.name;
    if (f.type !== "application/pdf" && f.type !== "image/jpeg") {
      try { f = await keJpeg(f); } catch (err) { e.target.value = ""; return toast(err.message, true); }
    }
    st.templatBaru = f; $("#namaTemplat").textContent = nama + " (belum disimpan)";
  });

  async function baitTemplat() {
    if (st.templatBaru) return { bait: new Uint8Array(await st.templatBaru.arrayBuffer()), jenis: st.templatBaru.type };
    const laluan = st.templatAsal;
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

  // ---------- Kaedah pengesahan & cap muka ----------
  function kemasKaedah() {
    const f = $("#borangProgram").elements, muka = f.kaedah_sah.value !== "nama";
    $("#kotakAmbang").hidden = !muka;
    const tanpa = st.warga.length - (st.bilMuka || 0);
    $("#notaMuka").innerHTML = !muka ? "" : (st.bilMuka ? `${st.bilMuka} warga mempunyai cap muka.` : "Belum ada cap muka — klik <b>Jana cap muka</b> di halaman senarai program dahulu.")
      + (muka && tanpa > 0 && st.bilMuka ? ` ${tanpa} warga tanpa cap muka tidak dapat daftar sendiri (tanda manual).` : "")
      + (muka ? " Warga perlu membenarkan kamera pada telefon." : "");
  }
  document.querySelectorAll('[name="kaedah_sah"]').forEach(r => r.addEventListener("change", kemasKaedah));

  async function semakCapMuka() {
    const { count, error } = await sb.from("warga_muka").select("warga_id", { count: "exact", head: true });
    st.bilMuka = error ? 0 : count || 0;
    $("#statusCapMuka").textContent = error ? "Tidak dapat disemak" : `${st.bilMuka} / ${st.warga.length} warga`;
  }

  $("#btnJanaMuka").onclick = async () => {
    if (!confirm(`Jana cap muka daripada gambar direktori untuk ${st.warga.length} warga?\n\nIni mengambil masa beberapa minit. Jangan tutup halaman ini.`)) return;
    const b = $("#btnJanaMuka"); b.disabled = true;
    let siap = 0, gagal = [];
    try {
      b.textContent = "Memuatkan model…";
      await Muka.muatModel();
      for (const [i, w] of st.warga.entries()) {
        b.textContent = `Memproses ${i + 1}/${st.warga.length}…`;
        if (!w.gambar_url || !/^https?:/.test(w.gambar_url)) { gagal.push(w.nama + " (tiada gambar)"); continue; }
        try {
          const img = await Muka.muatGambar(w.gambar_url);
          const r = await Muka.capMuka(img);
          if (!r) { gagal.push(w.nama + " (muka tidak dikesan)"); continue; }
          semak(await sb.from("warga_muka").upsert({ warga_id: w.id, deskriptor: JSON.stringify(r.deskriptor), gambar_url: w.gambar_url, dikemas: new Date().toISOString() }));
          siap++;
        } catch (err) { gagal.push(`${w.nama} (${err.message})`); }
      }
      toast(`${siap} cap muka dijana${gagal.length ? `, ${gagal.length} gagal` : ""}.`, gagal.length > 0 && !siap);
      if (gagal.length) console.warn("Cap muka gagal:", gagal);
      if (gagal.length) alert("Tidak berjaya:\n" + gagal.slice(0, 30).join("\n") + (gagal.length > 30 ? `\n…dan ${gagal.length - 30} lagi` : ""));
    } catch (err) { toast(err.message, true); }
    finally { b.disabled = false; b.textContent = "Jana cap muka"; semakCapMuka(); }
  };

  // ---------- Borang program ----------
  function bukaBorang(p, salin) {
    st.sedangEdit = salin ? null : (p || null);
    st.templatAsal = p?.sijil_templat || null;
    const f = $("#borangProgram");
    f.reset();
    $("#tajukBorangProgram").textContent = salin ? "Salin Program" : p ? "Ubah Program" : "Program Baharu";
    f.elements.nama.value = p ? p.nama + (salin ? " (salinan)" : "") : "";
    f.elements.tarikh.value = salin ? hariIni() : p?.tarikh || hariIni();
    const khas = !salin && !!(p?.daftar_mula || p?.daftar_tamat);
    f.elements.mod_daftar.value = khas ? "khas" : "program";
    f.elements.daftar_mula.value = khas ? keInputMasa(p.daftar_mula) : "";
    f.elements.daftar_tamat.value = khas ? keInputMasa(p.daftar_tamat) : "";
    kemasTempoh();
    f.elements.masa_mula.value = jam(p?.masa_mula);
    f.elements.masa_tamat.value = jam(p?.masa_tamat);
    f.elements.sasaran.innerHTML = Sasaran.pilihan(st.warga, p?.sasaran);
    f.elements.lokasi_nama.value = p?.lokasi_nama || "";
    f.elements.koordinat.value = p?.lat != null ? `${p.lat}, ${p.lng}` : "";
    f.elements.radius_m.value = String(p?.radius_m || 200);
    f.elements.aktif.checked = p ? p.aktif : true;
    f.elements.kaedah_sah.value = p?.kaedah_sah || "nama";
    f.elements.ambang_muka.value = String(p?.ambang_muka ?? 0.5);
    kemasKaedah();
    f.elements.emel_aktif.checked = !!p?.emel_aktif;
    f.elements.emel_subjek.value = p?.emel_subjek || "Pengesahan Kehadiran: {program}";
    f.elements.emel_isi.value = p?.emel_isi || ISI_LALAI;
    f.elements.sijil_aktif.checked = !!p?.sijil_aktif;
    f.elements.sijil_emel.checked = p ? p.sijil_emel !== false && !!p.emel_aktif : true;
    f.elements.sijil_muat_turun.checked = !!p?.sijil_muat_turun;
    st.templatBaru = null; $("#failTemplat").value = "";
    $("#namaTemplat").textContent = p?.sijil_templat ? (salin ? "Templat disalin daripada program asal" : "Templat telah dimuat naik") : "Tiada templat (reka bentuk ringkas digunakan)";
    // Templat PNG lama: tukar automatik ke JPEG; pentadbir hanya perlu klik Simpan.
    if (p?.sijil_templat && /\.png$/i.test(p.sijil_templat)) {
      (async () => {
        try {
          const { data, error } = await sb.storage.from("templat-sijil").download(p.sijil_templat);
          if (error) throw error;
          if (st.templatAsal !== p.sijil_templat) return;
          st.templatBaru = await keJpeg(data);
          $("#namaTemplat").textContent = "Templat PNG ditukar ke JPEG supaya sijil boleh dihantar — klik Simpan";
        } catch { $("#namaTemplat").textContent = "Templat PNG terlalu berat untuk pelayan — sila muat naik semula"; }
      })();
    }
    st.teksSijil = JSON.parse(JSON.stringify(p?.sijil_teks?.length ? p.sijil_teks : TEKS_LALAI));
    paparBarisTeks();
    $("#pratontonSijil").hidden = true; $("#pautanPratonton").hidden = true;
    kemasLipat();
    $("#btnPadamProgram").hidden = !st.sedangEdit;
    $("#programRalat").hidden = true;
    kemasTempoh();
    $("#dlgProgram").showModal();
  }

  // ---------- Tempoh pendaftaran ----------
  function kemasTempoh() {
    const f = $("#borangProgram").elements, khas = f.mod_daftar.value === "khas";
    $("#kotakTempoh").hidden = !khas;
    if (khas && !f.daftar_mula.value && !f.daftar_tamat.value && f.tarikh.value) {
      // Cadangan awal: ikut masa program, pentadbir boleh ubah.
      const mula = f.masa_mula.value || "00:00", tamat = f.masa_tamat.value || "23:59";
      f.daftar_mula.value = keInputMasa(new Date(Date.parse(`${f.tarikh.value}T${mula}:00+08:00`) - (f.masa_mula.value ? 30 * 60e3 : 0)).toISOString());
      f.daftar_tamat.value = `${f.tarikh.value}T${tamat}`;
    }
    const m = f.daftar_mula.value, t = f.daftar_tamat.value;
    $("#ringkasTempoh").textContent = !khas
      ? (f.tarikh.value ? `Peserta boleh daftar pada ${new Date(f.tarikh.value + "T00:00:00").toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })}${f.masa_mula.value ? `, mulai ${new Date(Date.parse(`${f.tarikh.value}T${f.masa_mula.value}:00`) - 30 * 60e3).toTimeString().slice(0, 5)}` : ""}${f.masa_tamat.value ? ` hingga ${f.masa_tamat.value}` : ""}.` : "")
      : m || t ? `Peserta boleh daftar dari ${m ? masaPendek(dariInputMasa(m)) : "sekarang"} hingga ${t ? masaPendek(dariInputMasa(t)) : "pendaftaran ditutup secara manual"}.` : "";
  }
  document.querySelectorAll('[name="mod_daftar"]').forEach(r => r.addEventListener("change", kemasTempoh));
  ["daftar_mula", "daftar_tamat", "tarikh", "masa_mula", "masa_tamat"].forEach(n => $("#borangProgram").elements[n].addEventListener("input", kemasTempoh));

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
      const khas = f.mod_daftar.value === "khas";
      const daftar_mula = khas ? dariInputMasa(f.daftar_mula.value) : null;
      const daftar_tamat = khas ? dariInputMasa(f.daftar_tamat.value) : null;
      if (khas && !daftar_mula && !daftar_tamat) throw new Error("Tetapkan sekurang-kurangnya masa dibuka atau ditutup untuk tempoh pendaftaran.");
      if (daftar_mula && daftar_tamat && daftar_tamat <= daftar_mula) throw new Error("Masa pendaftaran ditutup mesti selepas masa dibuka.");
      const rekod = {
        nama: f.nama.value.trim(), tarikh: f.tarikh.value,
        masa_mula: f.masa_mula.value || null, masa_tamat: f.masa_tamat.value || null,
        lokasi_nama: f.lokasi_nama.value.trim() || null, lat, lng,
        radius_m: +f.radius_m.value, aktif: f.aktif.checked,
        kaedah_sah: f.kaedah_sah.value, ambang_muka: +f.ambang_muka.value,
        emel_aktif: f.emel_aktif.checked, emel_subjek: f.emel_subjek.value.trim() || null,
        emel_isi: f.emel_isi.value.trim() || null, sijil_aktif: f.sijil_aktif.checked,
        sijil_emel: f.sijil_emel.checked, sijil_muat_turun: f.sijil_muat_turun.checked,
        sijil_teks: st.teksSijil.filter(t => String(t.teks || "").trim()),
        daftar_mula, daftar_tamat, sasaran: f.sasaran.value || "semua",
      };
      if (!st.sedangEdit && st.templatAsal && !st.templatBaru) rekod.sijil_templat = st.templatAsal;   // salinan program
      if (rekod.sijil_aktif && !rekod.sijil_teks.length) throw new Error("Sijil perlu sekurang-kurangnya satu baris teks, cth. {nama}.");
      if (rekod.sijil_aktif && !rekod.sijil_emel && !rekod.sijil_muat_turun) throw new Error("Pilih sekurang-kurangnya satu cara sijil diberikan: melalui e-mel atau muat turun di telefon.");
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
    $("#unitHadir").innerHTML = '<option value="">Semua unit</option><option value="__tetap">Staf Tetap sahaja</option><option value="__pms">PMS sahaja</option>' + units.map(u => `<option>${esc(u)}</option>`).join("");
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
    try { st.log = semak(await sb.from("warga_log").select("*").eq("program_id", p.id).order("masa")); } catch { st.log = []; }
    const masa = p.masa_mula ? `${jam(p.masa_mula)}${p.masa_tamat ? "–" + jam(p.masa_tamat) : ""}` : "Sepanjang hari";
    st.sasaran = Sasaran.ahli(st.warga, p.sasaran);
    const dalam = new Set(st.sasaran.map(w => w.id));
    const hadirDalam = st.hadir.filter(h => dalam.has(h.warga_id)).length, luar = st.hadir.length - hadirDalam;
    const peratus = st.sasaran.length ? Math.round(hadirDalam / st.sasaran.length * 100) : 0;
    $("#kepalaHadir").innerHTML = `
      <div>
        <div class="kp-atas">${lencana(p)}</div>
        <h2>${esc(p.nama)}</h2>
        <p class="muted">${esc(tarikhPanjang(p.tarikh))} · ${esc(masa)}${p.lokasi_nama ? " · " + esc(p.lokasi_nama) : ""}</p>
        ${p.daftar_mula || p.daftar_tamat ? `<p class="muted" style="margin-top:2px">📝 Tempoh daftar: ${esc(teksTempoh(p))}</p>` : ""}
      </div>
      <div class="kh-stat">
        <div class="cincin" style="--p:${peratus}"><b>${peratus}%</b></div>
        <div><b class="besar">${hadirDalam}</b><span> / ${st.sasaran.length} hadir</span>
          <div class="muted" style="font-size:12px">Sasaran: ${esc(Sasaran.label(p.sasaran))}${luar ? ` · +${luar} luar sasaran` : ""}</div>
          <div class="muted" style="font-size:12px">Dikemas kini ${new Date().toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kuala_Lumpur" })}</div></div>
        <div class="kh-alat">
          <button class="btn btn-soft btn-sm" id="btnQRDariHadir">Kod QR</button>
          <a class="btn btn-soft btn-sm" href="${esc(pautanAlat("paparan.html", p))}" target="_blank" rel="noopener">${IKON_P.skrin}<span>Skrin Paparan</span></a>
          <a class="btn btn-soft btn-sm" href="${esc(pautanAlat("laporan.html", p))}" target="_blank" rel="noopener">${IKON_P.laporan}<span>Laporan</span></a>
        </div>
      </div>`;
    $("#btnQRDariHadir").onclick = () => bukaQR(p);
    paparHadir();
  }

  // Pembetulan maklumat oleh peserta semasa daftar hadir (boleh dipulihkan oleh pentadbir).
  function lencanaUbah(wargaId) {
    const log = (st.log || []).filter(l => l.warga_id === wargaId);
    if (!log.length) return "";
    const label = { emel: "E-mel", telefon_bimbit: "Tel. bimbit" };
    const tajuk = log.map(l => `${label[l.medan] || l.medan}: ${l.lama || "(kosong)"} → ${l.baru}`).join("\n");
    return `<button class="lencana akan lencana-ubah" data-ubah="${esc(wargaId)}" title="${esc(tajuk + "\n\nKlik untuk pulihkan nilai asal")}">✎ Dikemas</button>`;
  }

  function lencanaEmel(h) {
    const m = { dihantar: ["ok", "✉ Dihantar"], gagal: ["ditutup", "✉ Gagal"], tiada_emel: ["lepas", "Tiada e-mel"], menghantar: ["akan", "✉ Menghantar"] }[h.emel_status];
    return m ? `<span class="lencana ${m[0]}" title="${esc(h.emel_ralat || "")}">${m[1]}</span>` : "";
  }

  async function hantarEmel(wargaIds) {
    const b = $("#btnHantarSemua span"); let siap = 0, gagal = 0;
    for (let i = 0; i < wargaIds.length; i += 5) {
      b.textContent = `Menghantar ${Math.min(i + 5, wargaIds.length)}/${wargaIds.length}…`;
      const { data, error } = await sb.functions.invoke("hantar-pengesahan", { body: { program_id: st.semasa.id, warga_ids: wargaIds.slice(i, i + 5) } });
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
    const sijil = st.semasa.sijil_aktif && st.semasa.sijil_emel !== false ? " berserta sijil" : "";
    if (confirm(`Hantar e-mel pengesahan${sijil} kepada ${belum.length} warga hadir yang belum menerimanya?`)) hantarEmel(belum);
  };

  function paparHadir() {
    const q = $("#cariHadir").value.trim().toLowerCase(), unit = $("#unitHadir").value;
    const ikutId = new Map(st.warga.map(w => [w.id, w]));
    const ikutUnit = w => !unit || (unit === "__pms" ? w.kategori === "pms" : unit === "__tetap" ? w.kategori !== "pms" : w.unit === unit);
    const padan = w => w && ikutUnit(w) && (!q || `${w.nama} ${w.unit} ${w.jawatan}`.toLowerCase().includes(q));
    const el = $("#senaraiHadir");
    if (st.tab === "hadir") {
      const baris = st.hadir.map(h => ({ h, w: ikutId.get(h.warga_id) })).filter(x => padan(x.w));
      el.innerHTML = baris.length ? baris.map(({ h, w }) => `
        <div class="baris-hadir">
          <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="">
          <div class="bh-nama"><b>${esc(w.nama)}</b><small>${esc([w.kategori === "pms" ? "PMS" : w.jawatan, w.unit].filter(Boolean).join(" · "))}</small></div>
          <div class="bh-emel">${lencanaUbah(h.warga_id)}${h.jarak_muka != null ? `<span class="lencana ok" title="Jarak cap muka ${h.jarak_muka.toFixed(2)} (lebih kecil = lebih sepadan)">🙂 ${Math.round((1 - h.jarak_muka) * 100)}%</span>` : ""}${lencanaEmel(h)}</div>
          <div class="bh-masa">${new Date(h.masa).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })}</div>
          <div class="bh-lokasi">${h.kaedah === "manual" ? '<span class="lencana lepas">Manual</span>'
            : h.jarak_m != null ? `<span class="lencana ok">✓ ${Math.round(h.jarak_m)} m</span>` : '<span class="lencana lepas">Tiada lokasi</span>'}</div>
          <button class="icon-btn" data-emel="${h.warga_id}" title="Hantar e-mel pengesahan" aria-label="Hantar e-mel kepada ${esc(w.nama)}"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/></svg></button>
          <button class="icon-btn" data-buang="${h.id}" title="Buang rekod" aria-label="Buang rekod ${esc(w.nama)}"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
        </div>`).join("") : '<div class="empty">Belum ada kehadiran direkodkan.</div>';
    } else {
      const sudah = new Set(st.hadir.map(h => h.warga_id));
      const belum = (st.sasaran || st.warga).filter(w => !sudah.has(w.id) && padan(w));
      el.innerHTML = belum.length ? belum.map(w => `
        <div class="baris-hadir">
          <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="">
          <div class="bh-nama"><b>${esc(w.nama)}</b><small>${esc([w.kategori === "pms" ? "PMS" : w.jawatan, w.unit].filter(Boolean).join(" · "))}</small></div>
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
    const ubah = e.target.closest("[data-ubah]");
    if (ubah) {
      const w = st.warga.find(x => x.id === ubah.dataset.ubah);
      const log = st.log.filter(l => l.warga_id === ubah.dataset.ubah);
      const label = { emel: "E-mel", telefon_bimbit: "Tel. bimbit" };
      const senarai = log.map(l => `• ${label[l.medan]}: ${l.lama || "(kosong)"} → ${l.baru}`).join("\n");
      if (!confirm(`${w?.nama} telah mengemas kini:\n${senarai}\n\nPulihkan kepada nilai asal?`)) return;
      try {
        const asal = {};
        for (const l of log) if (!(l.medan in asal)) asal[l.medan] = l.lama;   // nilai paling awal
        semak(await sb.from("warga").update(asal).eq("id", ubah.dataset.ubah));
        semak(await sb.from("warga_log").delete().in("id", log.map(l => l.id)));
        toast("Maklumat asal dipulihkan."); muatHadir();
      } catch (err) { toast(err.message, true); }
      return;
    }
    if (emel) {
      const w = st.warga.find(x => x.id === emel.dataset.emel);
      if (confirm(`Hantar e-mel pengesahan${st.semasa.sijil_aktif && st.semasa.sijil_emel !== false ? " dan sijil" : ""} kepada ${w?.nama}?`)) hantarEmel([emel.dataset.emel]);
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
    const baris = [["Bil", "Nama", "Kategori", "Jawatan", "Gred", "Unit", "Status", "Masa", "Kaedah", "Jarak (m)"].map(q).join(",")];
    const dalamS = new Set((st.sasaran || st.warga).map(w => w.id));
    st.warga.filter(w => dalamS.has(w.id) || ikutHadir.has(w.id)).forEach((w, i) => {
      const h = ikutHadir.get(w.id);
      baris.push([i + 1, w.nama, w.kategori === "pms" ? "PMS" : "Tetap", w.jawatan, w.gred, w.unit, h ? "Hadir" : "Tidak hadir",
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
