// Daftar service worker dan sediakan butang "Pasang aplikasi" (Android/Chrome) atau panduan iPhone.
(function () {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  const btn = document.getElementById("btnPasang");
  if (!btn) return;
  const sudahPasang = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (sudahPasang) return;
  let tangguh = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); tangguh = e; btn.hidden = false; });
  addEventListener("appinstalled", () => { btn.hidden = true; tangguh = null; });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (ios) btn.hidden = false;
  btn.addEventListener("click", async () => {
    if (tangguh) { tangguh.prompt(); await tangguh.userChoice; tangguh = null; btn.hidden = true; return; }
    if (ios) alert("Untuk pasang di iPhone/iPad:\n\n1. Tekan butang Kongsi (petak dengan anak panah ke atas) di Safari.\n2. Pilih \"Tambah ke Skrin Utama\" (Add to Home Screen).\n3. Tekan \"Tambah\".");
  });
})();
