// Kira tarikh lahir & umur daripada No. Kad Pengenalan Malaysia (YYMMDD-PB-###G).
(function (global) {
  function bersihkanIC(ic) {
    return String(ic || "").replace(/\D/g, "");
  }

  function tarikhLahirDaripadaIC(ic, hariIni) {
    const d = bersihkanIC(ic);
    if (d.length !== 12) return null;
    const yy = +d.slice(0, 2), mm = +d.slice(2, 4), dd = +d.slice(4, 6);
    const now = hariIni || new Date();
    // YY lebih besar daripada tahun semasa (2 digit) → 1900-an.
    const abad = yy > now.getFullYear() % 100 ? 1900 : 2000;
    const lahir = new Date(abad + yy, mm - 1, dd);
    if (lahir.getMonth() !== mm - 1 || lahir.getDate() !== dd) return null;
    return lahir;
  }

  // Terima tarikh lahir (Date atau "YYYY-MM-DD").
  function umurDaripadaTarikh(tarikh, hariIni) {
    const now = hariIni || new Date();
    let lahir = tarikh;
    if (typeof tarikh === "string") {
      const m = tarikh.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return null;
      lahir = new Date(+m[1], +m[2] - 1, +m[3]);
    }
    if (!(lahir instanceof Date) || isNaN(lahir)) return null;
    let umur = now.getFullYear() - lahir.getFullYear();
    if (now.getMonth() < lahir.getMonth() ||
        (now.getMonth() === lahir.getMonth() && now.getDate() < lahir.getDate())) umur--;
    return umur;
  }

  function kiraUmur(ic, hariIni) {
    const lahir = tarikhLahirDaripadaIC(ic, hariIni);
    return lahir ? umurDaripadaTarikh(lahir, hariIni) : null;
  }

  function keISO(d) {
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function formatIC(ic) {
    const d = bersihkanIC(ic);
    return d.length === 12 ? `${d.slice(0, 6)}-${d.slice(6, 8)}-${d.slice(8)}` : String(ic || "").trim();
  }

  const api = { bersihkanIC, tarikhLahirDaripadaIC, umurDaripadaTarikh, kiraUmur, formatIC, keISO };
  if (typeof module !== "undefined") module.exports = api;
  global.Umur = api;
})(typeof window !== "undefined" ? window : globalThis);
