// Penjana sijil: letak teks (cth. nama) di atas templat A4 (PNG/JPG/PDF).
// Digunakan oleh pelayar (pratonton pentadbir) dan fungsi pelayan hantar-pengesahan.
(function (root, kilang) {
  if (typeof module === "object" && module.exports) module.exports = kilang();
  else root.Sijil = kilang();
})(typeof self !== "undefined" ? self : this, function () {
  const A4 = [595.28, 841.89];

  // Gantikan {nama}, {program}, dsb. dengan nilai sebenar.
  function isiRuang(teks, data) {
    return String(teks || "").replace(/\{(\w+)\}/g, (_, k) => (data && data[k] != null ? String(data[k]) : ""));
  }

  // Fon standard PDF hanya menyokong aksara Latin asas.
  function bersih(s) {
    return String(s).replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-").normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  }

  function warna(PDFLib, hex) {
    const m = String(hex || "#000000").replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    const [r, g, b] = m ? m.slice(1).map(x => parseInt(x, 16) / 255) : [0, 0, 0];
    return PDFLib.rgb(r, g, b);
  }

  function namaFon(PDFLib, fon, tebal) {
    const F = PDFLib.StandardFonts;
    if (fon === "sans") return tebal ? F.HelveticaBold : F.Helvetica;
    if (fon === "serif-italik") return tebal ? F.TimesRomanBoldItalic : F.TimesRomanItalic;
    return tebal ? F.TimesRomanBold : F.TimesRoman;
  }

  function jenisFail(bait, jenis) {
    if (jenis) return jenis;
    if (bait[0] === 0x25 && bait[1] === 0x50) return "application/pdf";
    if (bait[0] === 0x89 && bait[1] === 0x50) return "image/png";
    return "image/jpeg";
  }

  // pilihan: { templat: Uint8Array|null, jenis, teks: [{teks,x,y,saiz,tebal,warna,fon}], data: {} }
  async function jana(PDFLib, pilihan) {
    const doc = await PDFLib.PDFDocument.create();
    doc.setTitle("Sijil");
    let halaman, w, h;
    const bait = pilihan.templat;
    if (bait && bait.length) {
      const jenis = jenisFail(bait, pilihan.jenis);
      if (jenis === "application/pdf") {
        const sumber = await PDFLib.PDFDocument.load(bait);
        [halaman] = await doc.copyPages(sumber, [0]);
        doc.addPage(halaman);
        ({ width: w, height: h } = halaman.getSize());
      } else {
        const img = jenis === "image/png" ? await doc.embedPng(bait) : await doc.embedJpg(bait);
        [w, h] = img.width > img.height ? [A4[1], A4[0]] : A4;
        halaman = doc.addPage([w, h]);
        halaman.drawImage(img, { x: 0, y: 0, width: w, height: h });
      }
    } else {
      [w, h] = [A4[1], A4[0]];
      halaman = doc.addPage([w, h]);
      halaman.drawRectangle({ x: 24, y: 24, width: w - 48, height: h - 48, borderWidth: 2, borderColor: warna(PDFLib, "#c9a227") });
    }

    const cache = {};
    for (const t of pilihan.teks || []) {
      const str = bersih(isiRuang(t.teks, pilihan.data)).trim();
      if (!str) continue;
      const kunci = namaFon(PDFLib, t.fon, t.tebal);
      const fon = cache[kunci] || (cache[kunci] = await doc.embedFont(kunci));
      let saiz = Math.max(6, Number(t.saiz) || 24);
      const maks = w * 0.9;
      let lebar = fon.widthOfTextAtSize(str, saiz);
      if (lebar > maks) { saiz = saiz * maks / lebar; lebar = maks; }
      const x = w * (Number(t.x ?? 50) / 100) - lebar / 2;
      const y = h - h * (Number(t.y ?? 50) / 100) - saiz * 0.35;
      halaman.drawText(str, { x, y, size: saiz, font: fon, color: warna(PDFLib, t.warna) });
    }
    return await doc.save();
  }

  return { jana, isiRuang, bersih };
});
