// Sasaran peserta program: "semua" | "tetap" | "pms" | "unit:<nama seksyen>".
// Dikongsi oleh halaman program, laporan, skrin paparan dan dashboard supaya kadar kehadiran dikira sama.
(function (global) {
  const kunci = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function ahli(warga, sasaran) {
    const s = sasaran || "semua";
    if (s === "tetap") return warga.filter(w => w.kategori !== "pms");
    if (s === "pms") return warga.filter(w => w.kategori === "pms");
    if (s.startsWith("unit:")) { const u = kunci(s.slice(5)); return warga.filter(w => kunci(w.unit) === u); }
    return warga;
  }

  function label(sasaran) {
    const s = sasaran || "semua";
    if (s === "tetap") return "Staf Tetap";
    if (s === "pms") return "Personel MySTEPS (PMS)";
    if (s.startsWith("unit:")) return s.slice(5);
    return "Semua warga";
  }

  // Pilihan <option> untuk select sasaran (seksyen disusun ikut carta organisasi).
  function pilihan(warga, dipilih) {
    const urutan = new Map();
    for (const w of warga) {
      if (!w.unit) continue;
      const v = w.susunan ?? 1e9;
      if (!urutan.has(w.unit) || v < urutan.get(w.unit)) urutan.set(w.unit, v);
    }
    const units = [...urutan.keys()].sort((a, b) => urutan.get(a) - urutan.get(b) || a.localeCompare(b, "ms"));
    const opt = (v, t) => `<option value="${esc(v)}"${v === (dipilih || "semua") ? " selected" : ""}>${esc(t)}</option>`;
    const bil = s => ahli(warga, s).length;
    return opt("semua", `Semua warga (${bil("semua")})`) + opt("tetap", `Staf Tetap (${bil("tetap")})`) + opt("pms", `PMS (${bil("pms")})`) +
      `<optgroup label="Seksyen / Pejabat">${units.map(u => opt("unit:" + u, `${u} (${bil("unit:" + u)})`)).join("")}</optgroup>`;
  }

  global.Sasaran = { ahli, label, pilihan, kunci };
})(window);
