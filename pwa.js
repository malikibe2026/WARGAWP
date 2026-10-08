// Aplikasi (PWA): daftar service worker, kesan versi baharu, dan ajak pasang aplikasi.
(function () {
  const sudahPasang = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const simpan = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const baca = k => { try { return localStorage.getItem(k); } catch { return null; } };
  if (sudahPasang()) document.documentElement.classList.add("mod-apl");

  // ---------- Service worker ----------
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").then(r => {
      // Semak SW baharu setiap kali aplikasi kembali ke hadapan.
      document.addEventListener("visibilitychange", () => { if (!document.hidden) r.update().catch(() => {}); });
    }).catch(() => {}));
  }

  // ---------- Kesan versi baharu (versi.json dijana semasa penerbitan) ----------
  let versiAsal = null;
  async function semakVersi() {
    try {
      const r = await fetch("versi.json?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      const { versi } = await r.json();
      if (!versi) return;
      if (!versiAsal) { versiAsal = versi; return; }
      if (versi !== versiAsal) tunjukKemasKini();
    } catch {}
  }
  function tunjukKemasKini() {
    if (document.getElementById("bannerKemasKini")) return;
    // Jika pengguna tidak sedang menaip / mengisi borang, muat semula terus secara senyap.
    const sibuk = document.querySelector("dialog[open]") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
    if (!sibuk && document.hidden === false && sudahPasang()) { location.reload(); return; }
    const b = document.createElement("div");
    b.id = "bannerKemasKini"; b.className = "banner-apl kemas-kini"; b.setAttribute("role", "status");
    b.innerHTML = '<span><b>Versi baharu tersedia.</b> Muat semula untuk kemas kini terkini.</span><button class="btn btn-primary btn-sm">Muat semula</button>';
    b.querySelector("button").onclick = () => location.reload();
    document.body.appendChild(b);
  }
  semakVersi();
  setInterval(semakVersi, 5 * 60e3);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) semakVersi(); });

  // ---------- Pasang aplikasi ----------
  let tangguh = null;
  const btn = document.getElementById("btnPasang");
  const panduanIOS = () => alert("Untuk pasang di iPhone/iPad:\n\n1. Buka laman ini dalam Safari.\n2. Tekan butang Kongsi (petak dengan anak panah ke atas).\n3. Pilih \"Tambah ke Skrin Utama\" (Add to Home Screen), kemudian \"Tambah\".");
  async function pasang() {
    if (tangguh) { tangguh.prompt(); await tangguh.userChoice.catch(() => {}); tangguh = null; sorok(); return; }
    if (ios) panduanIOS();
  }
  function sorok() { if (btn) btn.hidden = true; document.getElementById("bannerPasang")?.remove(); }
  function bannerPasang() {
    // Ajakan sekali di telefon; boleh ditutup dan tidak dipaparkan semula selama 14 hari.
    if (sudahPasang() || innerWidth > 760 || document.getElementById("bannerPasang")) return;
    const tutup = +baca("dosm_tutup_pasang") || 0;
    if (Date.now() - tutup < 14 * 864e5) return;
    if (!tangguh && !ios) return;
    const b = document.createElement("div");
    b.id = "bannerPasang"; b.className = "banner-apl pasang";
    b.innerHTML = `<img src="ikon/ikon-192.png" alt=""><span><b>Pasang aplikasi DOSM WP</b><small>Buka terus dari skrin utama, sentiasa versi terkini.</small></span>
      <button class="btn btn-primary btn-sm" data-pasang>Pasang</button><button class="icon-btn" data-tutup aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
    b.querySelector("[data-pasang]").onclick = pasang;
    b.querySelector("[data-tutup]").onclick = () => { simpan("dosm_tutup_pasang", String(Date.now())); b.remove(); };
    document.body.appendChild(b);
  }
  if (!sudahPasang()) {
    addEventListener("beforeinstallprompt", e => { e.preventDefault(); tangguh = e; if (btn) btn.hidden = false; setTimeout(bannerPasang, 3000); });
    addEventListener("appinstalled", sorok);
    if (ios) { if (btn) btn.hidden = false; setTimeout(bannerPasang, 3000); }
    btn?.addEventListener("click", pasang);
  }
})();
