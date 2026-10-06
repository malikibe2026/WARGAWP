// Sasaran peserta program — disimpan sebagai teks dalam program.sasaran:
//   "semua" | "tetap" | "pms"                       → ikut kategori sahaja
//   "unit:<seksyen>|<seksyen>[;k:tetap|pms]"        → satu atau lebih seksyen (pilihan: hadkan kategori)
// Dikongsi oleh halaman program, laporan, skrin paparan dan dashboard supaya kadar kehadiran dikira sama.
(function (global) {
  const kunci = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function hurai(sasaran) {
    const s = String(sasaran || "semua");
    if (s === "tetap" || s === "pms") return { k: s, u: [] };
    if (s.startsWith("unit:")) {
      const [bahagianU, bahagianK] = s.slice(5).split(";k:");
      return { k: bahagianK === "tetap" || bahagianK === "pms" ? bahagianK : "semua", u: bahagianU.split("|").map(x => x.trim()).filter(Boolean) };
    }
    return { k: "semua", u: [] };
  }

  function bina({ k = "semua", u = [] } = {}) {
    const unit = [...new Set(u.map(x => String(x).trim()).filter(Boolean))];
    if (!unit.length) return k === "tetap" || k === "pms" ? k : "semua";
    return "unit:" + unit.join("|") + (k === "tetap" || k === "pms" ? ";k:" + k : "");
  }

  function ahli(warga, sasaran) {
    const { k, u } = hurai(sasaran);
    const units = new Set(u.map(kunci));
    return warga.filter(w =>
      (k === "semua" || (k === "pms") === (w.kategori === "pms")) &&
      (!units.size || units.has(kunci(w.unit))));
  }

  function label(sasaran) {
    const { k, u } = hurai(sasaran);
    const lk = k === "tetap" ? "Staf Tetap" : k === "pms" ? "PMS" : "";
    if (!u.length) return k === "tetap" ? "Staf Tetap" : k === "pms" ? "Personel MySTEPS (PMS)" : "Semua warga";
    const lu = u.length <= 2 ? u.join(" & ") : `${u.length} seksyen / bahagian`;
    return lk ? `${lu} (${lk} sahaja)` : lu;
  }

  // Senarai seksyen disusun ikut carta organisasi.
  function senaraiUnit(warga) {
    const urutan = new Map();
    for (const w of warga) {
      if (!w.unit) continue;
      const v = w.susunan ?? 1e9;
      if (!urutan.has(w.unit) || v < urutan.get(w.unit)) urutan.set(w.unit, v);
    }
    return [...urutan.keys()].sort((a, b) => urutan.get(a) - urutan.get(b) || a.localeCompare(b, "ms"));
  }

  // Pilihan <option> (untuk laporan): pilihan biasa + sasaran asal program jika ia gabungan.
  function pilihan(warga, dipilih) {
    const opt = (v, t) => `<option value="${esc(v)}"${v === (dipilih || "semua") ? " selected" : ""}>${esc(t)}</option>`;
    const bil = s => ahli(warga, s).length;
    const units = senaraiUnit(warga);
    const biasa = ["semua", "tetap", "pms", ...units.map(x => "unit:" + x)];
    const asal = dipilih && !biasa.includes(dipilih) ? opt(dipilih, `Sasaran program: ${label(dipilih)} (${bil(dipilih)})`) : "";
    return asal + opt("semua", `Semua warga (${bil("semua")})`) + opt("tetap", `Staf Tetap (${bil("tetap")})`) + opt("pms", `PMS (${bil("pms")})`) +
      `<optgroup label="Seksyen / Pejabat">${units.map(u => opt("unit:" + u, `${u} (${bil("unit:" + u)})`)).join("")}</optgroup>`;
  }

  global.Sasaran = { ahli, label, pilihan, kunci, hurai, bina, senaraiUnit };
})(window);
