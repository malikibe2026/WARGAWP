// Service worker: sentiasa ambil versi terkini dari pelayan (tiada salinan lama),
// fail laman disahkan semula setiap kali (cache: "no-cache" → 304 jika tidak berubah, jadi tetap pantas).
// Hanya halaman luar talian disimpan, untuk dipaparkan apabila tiada internet.
const CACHE = "dosm-wp-luar-talian-v2";
const LUAR_TALIAN = "luar-talian.html";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([LUAR_TALIAN, "ikon/ikon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;   // data Supabase & gambar: biar pelayar urus
  if (req.mode === "navigate") {
    e.respondWith(fetch(req, { cache: "no-cache" }).catch(() => caches.match(LUAR_TALIAN)));
    return;
  }
  // Skrip, gaya & fail laman: sahkan semula dengan pelayan supaya perubahan terbaru terus digunakan.
  e.respondWith(fetch(req, { cache: "no-cache" }).catch(() => caches.match(req)));
});
