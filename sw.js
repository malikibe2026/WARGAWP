// Service worker minimum: tidak menyimpan versi lama laman (sentiasa ambil dari rangkaian),
// hanya memaparkan halaman luar talian jika tiada sambungan internet.
const CACHE = "dosm-wp-luar-talian-v1";
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
  if (e.request.mode !== "navigate") return;   // data, gambar & skrip: biar pelayar urus seperti biasa
  e.respondWith(fetch(e.request).catch(() => caches.match(LUAR_TALIAN)));
});
