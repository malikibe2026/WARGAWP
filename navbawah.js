// Navigasi bawah gaya aplikasi untuk telefon (Utama, Direktori, Carta, Program, Dashboard).
(function () {
  const IKON = {
    utama: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    buku: '<svg viewBox="0 0 24 24"><path d="M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 7h7M9 11h5"/></svg>',
    carta: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/></svg>',
    program: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  };
  const item = [
    ["utama", "Utama", "./", false],
    ["buku", "Direktori", "direktori.html", false],
    ["carta", "Carta", "carta.html", false],
    ["program", "Program", "program.html", true],
    ["dashboard", "Dashboard", "dashboard.html", true],
  ];
  const fail = location.pathname.split("/").pop() || "index.html";
  const aktif = fail.startsWith("direktori") ? "buku" : fail.startsWith("carta") ? "carta" : fail.startsWith("program") ? "program" : fail.startsWith("dashboard") ? "dashboard" : "utama";
  const nav = document.createElement("nav");
  nav.className = "nav-bawah"; nav.setAttribute("aria-label", "Navigasi utama");
  nav.innerHTML = item.map(([k, label, href, admin]) =>
    `<a href="${href}" class="${k === aktif ? "aktif" : ""}" data-admin="${admin}"${k === aktif ? ' aria-current="page"' : ""}${admin ? " hidden" : ""}>${IKON[k]}<span>${label}</span></a>`).join("");
  document.body.appendChild(nav);
  document.body.classList.add("ada-nav-bawah");
  // Menu pentadbir hanya dipaparkan apabila log masuk (atau jika sedang berada di halaman itu).
  const tunjukAdmin = ok => nav.querySelectorAll('[data-admin="true"]').forEach(a => (a.hidden = !ok && !a.classList.contains("aktif")));
  tunjukAdmin(false);
  if (window.Store?.sesi) Store.sesi().then(tunjukAdmin).catch(() => {});
})();
