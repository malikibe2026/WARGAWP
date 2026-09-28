// Halaman kehadiran awam: cari nama → sahkan → rakam lokasi → daftar melalui fungsi daftar_hadir.
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

  const kod = new URLSearchParams(location.search).get("p");
  let program = null, warga = [], dipilih = null, mukaSemasa = null, strim = null, penyelesai = null;

  function tunjuk(id) {
    for (const s of ["#langkahCari", "#langkahSahkan", "#langkahMuka", "#langkahHasil", "#ralatProgram"]) $(s).hidden = s !== id;
    if (id !== "#langkahMuka") hentiKamera();
  }

  function ralatBesar(tajuk, mesej) {
    $("#ralatProgram").innerHTML = `<div class="ikon-hasil gagal">!</div><h2>${esc(tajuk)}</h2><p>${esc(mesej)}</p>`;
    tunjuk("#ralatProgram");
  }

  // ID peranti rawak (bukan maklumat peribadi) untuk mengehadkan satu telefon = satu kehadiran bagi setiap program.
  function idPeranti() {
    try {
      let id = localStorage.getItem("dosm_peranti");
      if (!id) { id = crypto.randomUUID(); localStorage.setItem("dosm_peranti", id); }
      return id;
    } catch { return null; }
  }

  function formatTarikh(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  const jam = t => t ? t.slice(0, 5) : "";

  function paparProgram(bil) {
    $("#progNama").textContent = program.nama;
    document.title = `${program.nama} — Kehadiran`;
    const masa = program.masa_mula ? `${jam(program.masa_mula)}${program.masa_tamat ? " – " + jam(program.masa_tamat) : ""}` : "";
    $("#progMeta").innerHTML = [
      `<span>📅 ${esc(formatTarikh(program.tarikh))}</span>`,
      masa ? `<span>🕘 ${esc(masa)}</span>` : "",
      program.lokasi_nama ? `<span>📍 ${esc(program.lokasi_nama)}</span>` : "",
      bil != null ? `<span>👥 ${bil} telah hadir</span>` : "",
    ].join("");
  }

  function normal(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }

  function cadang() {
    const q = normal($("#cariNama").value);
    const ul = $("#cadangan");
    if (q.length < 3) { ul.innerHTML = q ? '<li class="kosong-cadang">Taip sekurang-kurangnya 3 huruf…</li>' : ""; return; }
    const kata = q.split(" ");
    const hasil = warga.filter(w => { const n = normal(w.nama); return kata.every(k => n.includes(k)); }).slice(0, 8);
    ul.innerHTML = hasil.length ? hasil.map(w => `
      <li><button class="cadang" data-id="${esc(w.id)}" role="option">
        <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="" loading="lazy">
        <span><b>${esc(w.nama)}</b><small>${esc([w.kategori === "pms" ? "PMS" : w.jawatan, w.unit].filter(Boolean).join(" · "))}</small></span>
        <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
      </button></li>`).join("")
      : '<li class="kosong-cadang">Tiada nama sepadan. Semak ejaan atau hubungi urus setia.</li>';
  }

  function pilih(id) {
    dipilih = warga.find(w => w.id === id);
    if (!dipilih) return;
    paksaMuka = false;
    $("#profilPilih").innerHTML = `
      <img src="${esc(dipilih.gambar_url || TANPA_GAMBAR)}" alt="Gambar ${esc(dipilih.nama)}">
      <div>
        <h3>${esc(dipilih.nama)}</h3>
        <p>${esc(dipilih.jawatan || "")}${dipilih.gred ? ` <span class="gred">${esc(dipilih.gred)}</span>` : ""}</p>
        ${dipilih.unit ? `<span class="unit-tag">${esc(dipilih.unit)}</span>` : ""}
      </div>`;
    $("#notaLokasi").textContent = program.lat != null
      ? `Lokasi telefon akan disemak. Anda perlu berada dalam lingkungan ${program.radius_m} m dari lokasi program.`
      : "";
    $("#btnHadir span").textContent = labelHadir();
    tunjuk("#langkahSahkan");
    window.scrollTo({ top: $("#langkahSahkan").offsetTop - 16, behavior: "smooth" });
  }

  let paksaMuka = false;
  // PMS tanpa gambar rujukan hadir melalui nama + lokasi; pelayan akan minta imbasan jika rujukan wujud.
  const perluMuka = () => program && program.kaedah_sah !== "nama" && (paksaMuka || !(dipilih && dipilih.kategori === "pms" && !dipilih.gambar_url));
  const labelHadir = () => perluMuka() && !mukaSemasa ? "Imbas Muka & Hadir" : "Sahkan Lokasi & Hadir";

  // ---------- Kamera & imbasan muka ----------
  function muatSkrip(src) {
    return new Promise((ok, gagal) => {
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s = document.createElement("script"); s.src = src; s.onload = ok;
      s.onerror = () => gagal(new Error("Gagal memuatkan " + src)); document.head.appendChild(s);
    });
  }
  let modelSedia = null;
  function sediaModel() {
    if (!modelSedia) modelSedia = (async () => {
      await muatSkrip("vendor/face-api/face-api.js");
      await muatSkrip("muka.js");
      await Muka.muatModel();
    })();
    return modelSedia;
  }

  function hentiKamera() {
    if (strim) { strim.getTracks().forEach(t => t.stop()); strim = null; }
  }

  async function bukaKamera(tajuk, modCari) {
    $("#tajukMuka").textContent = tajuk;
    $("#calonMuka").innerHTML = "";
    $("#btnCariManual").hidden = !modCari;
    $("#btnImbas").disabled = true;
    $("#kameraMuat").hidden = false;
    $("#kameraMuat").textContent = "Memuatkan kamera…";
    $("#statusMuka").textContent = "Letakkan muka di dalam bingkai, pastikan cahaya mencukupi.";
    $("#statusMuka").className = "status-muka";
    tunjuk("#langkahMuka");
    window.scrollTo({ top: $("#langkahMuka").offsetTop - 16, behavior: "smooth" });
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Pelayar ini tidak menyokong kamera. Cuba Chrome atau Safari terkini.");
      strim = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      $("#video").srcObject = strim;
      await $("#video").play();
      $("#kameraMuat").textContent = "Memuatkan pengecaman muka… (kali pertama mungkin mengambil masa)";
      await sediaModel();
      $("#kameraMuat").hidden = true;
      $("#btnImbas").disabled = false;
    } catch (err) {
      $("#kameraMuat").hidden = true;
      $("#statusMuka").textContent = err.name === "NotAllowedError"
        ? "Akses kamera ditolak. Benarkan kamera untuk laman ini dalam tetapan pelayar, kemudian muat semula."
        : (err.message || "Kamera tidak dapat dibuka.");
      $("#statusMuka").className = "status-muka ralat";
    }
  }

  // Ambil cap muka daripada video; pulangkan array 128 nombor atau null.
  async function ambilCapMuka() {
    const btn = $("#btnImbas"), label = btn.querySelector("span");
    btn.disabled = true; label.textContent = "Mengimbas…";
    try {
      for (let cubaan = 0; cubaan < 3; cubaan++) {
        const r = await Muka.capMuka($("#video"));
        if (r) return r.deskriptor;
        await new Promise(ok => setTimeout(ok, 300));
      }
      $("#statusMuka").textContent = "Muka tidak dikesan. Dekatkan telefon, hadap kamera dan pastikan tiada cahaya dari belakang.";
      $("#statusMuka").className = "status-muka ralat";
      return null;
    } finally { btn.disabled = false; label.textContent = "Imbas Muka"; }
  }

  // Mod "nama + muka": imbas untuk mengesahkan nama yang telah dipilih.
  function imbasUntukSahkan() {
    return new Promise((ok, gagal) => {
      penyelesai = { ok, gagal, mod: "sahkan" };
      bukaKamera("Imbas muka untuk pengesahan", false);
    });
  }

  // Mod "imbas muka sahaja": cari calon paling sepadan.
  async function cariDenganMuka() {
    penyelesai = { mod: "cari" };
    bukaKamera("Imbas muka anda", true);
  }

  async function klikImbas() {
    const d = await ambilCapMuka();
    if (!d) return;
    mukaSemasa = d;
    if (penyelesai?.mod === "sahkan") {
      const p = penyelesai; penyelesai = null; hentiKamera(); p.ok(d); return;
    }
    // Mod cari
    $("#statusMuka").textContent = "Mencari padanan…"; $("#statusMuka").className = "status-muka";
    const { data, error } = await Store.sb.rpc("cari_muka", { p_kod: kod, p_muka: d });
    if (error) { $("#statusMuka").textContent = error.message; $("#statusMuka").className = "status-muka ralat"; return; }
    hentiKamera();
    if (!data?.length) {
      $("#statusMuka").textContent = "Tiada padanan ditemui. Cuba imbas semula dengan cahaya lebih terang, atau cari nama secara manual.";
      $("#statusMuka").className = "status-muka ralat";
      $("#btnImbas").querySelector("span").textContent = "Imbas Semula";
      $("#btnImbas").onclick = () => { $("#btnImbas").onclick = null; $("#btnImbas").querySelector("span").textContent = "Imbas Muka"; cariDenganMuka(); };
      return;
    }
    $("#statusMuka").textContent = data.length > 1 ? "Pilih nama anda:" : "Adakah ini anda? Tekan nama untuk teruskan.";
    $("#btnImbas").querySelector("span").textContent = "Imbas Semula";
    $("#btnImbas").onclick = () => { $("#btnImbas").onclick = null; $("#btnImbas").querySelector("span").textContent = "Imbas Muka"; cariDenganMuka(); };
    $("#calonMuka").innerHTML = data.map(w => `
      <li><button class="cadang" data-id="${esc(w.id)}">
        <img src="${esc(w.gambar_url || TANPA_GAMBAR)}" alt="">
        <span><b>${esc(w.nama)}</b><small>${esc([w.jawatan, w.unit].filter(Boolean).join(" · "))}</small></span>
        <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
      </button></li>`).join("");
  }

  function dapatLokasi() {
    return new Promise((ok, gagal) => {
      if (!navigator.geolocation) return gagal(new Error("Pelayar ini tidak menyokong lokasi."));
      navigator.geolocation.getCurrentPosition(p => ok(p.coords), e => gagal(new Error(
        e.code === 1 ? "Akses lokasi ditolak. Benarkan lokasi untuk laman ini dalam tetapan pelayar, kemudian cuba semula."
        : e.code === 3 ? "Lokasi mengambil masa terlalu lama. Pastikan GPS dihidupkan dan cuba semula."
        : "Lokasi tidak dapat dikesan. Pastikan GPS dihidupkan.")),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    });
  }

  function hasil(ok, tajuk, mesej, butiran = "") {
    $("#langkahHasil").innerHTML = `
      <div class="ikon-hasil ${ok ? "berjaya" : "gagal"}">${ok ? "✓" : "!"}</div>
      <h2>${esc(tajuk)}</h2>
      <p>${esc(mesej)}</p>
      ${butiran}
      ${ok ? "" : '<button class="btn btn-primary" id="btnCubaLagi">Cuba Semula</button>'}`;
    tunjuk("#langkahHasil");
    $("#btnCubaLagi")?.addEventListener("click", () => tunjuk("#langkahSahkan"));
  }

  async function hadir() {
    const btn = $("#btnHadir");
    btn.disabled = true;
    const teks = btn.querySelector("span");
    try {
      if (perluMuka() && !mukaSemasa) {
        try { await imbasUntukSahkan(); } catch { return; }
        tunjuk("#langkahSahkan");
      }
      let c = null;
      if (program.lat != null) {
        teks.textContent = "Mendapatkan lokasi…";
        c = await dapatLokasi();
      }
      teks.textContent = "Menghantar…";
      const { data, error } = await Store.sb.rpc("daftar_hadir", {
        p_kod: kod, p_warga: dipilih.id,
        p_lat: c ? c.latitude : null, p_lng: c ? c.longitude : null,
        p_ketepatan: c ? Math.round(c.accuracy) : null, p_peranti: idPeranti(),
        p_muka: perluMuka() ? mukaSemasa : null,
      });
      if (error) throw new Error(error.message);
      if (data.ok) {
        const masa = new Date(data.masa).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
        hasil(true, "Kehadiran direkodkan", `Terima kasih, ${dipilih.nama}.`, `
          <dl class="meta meta-hasil">
            <dt>Program</dt><dd>${esc(program.nama)}</dd>
            <dt>Masa</dt><dd>${esc(masa)}</dd>
            ${data.jarak != null ? `<dt>Jarak dari lokasi</dt><dd>${data.jarak} m</dd>` : ""}
          </dl>`);
        muatKiraan();
        if (program.emel_aktif) hantarPengesahan();
      } else if (data.sudah) {
        hasil(true, "Sudah direkodkan", data.sebab);
      } else if (data.perlu_muka && !paksaMuka) {
        paksaMuka = true; btn.disabled = false; return hadir();
      } else {
        if (data.muka === false) mukaSemasa = null;   // imbas semula pada cubaan seterusnya
        hasil(false, "Kehadiran tidak direkodkan", data.sebab);
      }
    } catch (err) {
      hasil(false, "Kehadiran tidak direkodkan", err.message);
    } finally {
      btn.disabled = false;
      teks.textContent = labelHadir();
    }
  }

  async function hantarPengesahan() {
    const nota = document.createElement("p");
    nota.className = "nota-emel";
    nota.textContent = program.sijil_aktif ? "Menghantar e-mel pengesahan dan sijil…" : "Menghantar e-mel pengesahan…";
    $("#langkahHasil").appendChild(nota);
    try {
      const { data, error } = await Store.sb.functions.invoke("hantar-pengesahan", { body: { kod, warga_id: dipilih.id } });
      if (error) throw error;
      if (data?.ok) { nota.textContent = `✉ ${program.sijil_aktif ? "E-mel pengesahan dan sijil" : "E-mel pengesahan"} telah dihantar ke ${data.emel}.`; nota.classList.add("ok"); }
      else if (data?.sebab === "tiada_emel") nota.textContent = "E-mel tidak dihantar kerana alamat e-mel anda tiada dalam direktori. Sila maklumkan urus setia.";
      else nota.textContent = "E-mel pengesahan tidak dapat dihantar sekarang. Urus setia akan menghantarnya kemudian.";
    } catch { nota.textContent = "E-mel pengesahan tidak dapat dihantar sekarang. Urus setia akan menghantarnya kemudian."; }
  }

  async function muatKiraan() {
    const { data } = await Store.sb.rpc("kiraan_hadir", { p_kod: kod });
    paparProgram(typeof data === "number" ? data : null);
  }

  async function mula() {
    if (!kod) return ralatBesar("Pautan tidak lengkap", "Sila imbas kod QR program atau gunakan pautan yang diberikan urus setia.");
    if (!Store.sb) return ralatBesar("Tidak tersedia", "Kehadiran memerlukan sambungan pangkalan data (mod dalam talian).");
    const [p, w] = await Promise.all([
      Store.sb.from("program").select("*").eq("kod", kod).maybeSingle(),
      Store.sb.from("warga").select("id,nama,jawatan,gred,unit,gambar_url,kategori").order("nama"),
    ]);
    if (p.error || !p.data) { $("#progNama").textContent = "Program tidak dijumpai"; return ralatBesar("Program tidak dijumpai", "Pautan mungkin salah atau program telah dipadam."); }
    program = p.data;
    warga = w.data || [];
    paparProgram(null);
    muatKiraan();
    if (!program.aktif) return ralatBesar("Pendaftaran ditutup", "Pendaftaran kehadiran untuk program ini telah ditutup oleh urus setia.");
    if (perluMuka()) sediaModel().catch(() => {});   // pramuat model di latar belakang
    if (program.kaedah_sah === "muka") return cariDenganMuka();
    tunjuk("#langkahCari");
    $("#cariNama").focus();
  }

  $("#cariNama").addEventListener("input", cadang);
  $("#cadangan").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) pilih(b.dataset.id); });
  $("#btnBukan").addEventListener("click", () => {
    dipilih = null;
    if (program.kaedah_sah === "muka") { mukaSemasa = null; return cariDenganMuka(); }
    tunjuk("#langkahCari"); $("#cariNama").select();
  });
  $("#btnHadir").addEventListener("click", hadir);
  $("#btnImbas").addEventListener("click", () => { if (!$("#btnImbas").onclick) klikImbas(); });
  $("#calonMuka").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) pilih(b.dataset.id); });
  $("#btnCariManual").addEventListener("click", () => { tunjuk("#langkahCari"); $("#cariNama").focus(); });
  $("#btnMukaBatal").addEventListener("click", () => {
    const p = penyelesai; penyelesai = null; hentiKamera();
    if (p?.gagal) { p.gagal(new Error("batal")); tunjuk("#langkahSahkan"); return; }
    tunjuk(dipilih ? "#langkahSahkan" : "#langkahCari");
  });
  mula().catch(err => ralatBesar("Ralat", err.message));
})();
