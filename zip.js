// Penulis ZIP ringkas (tanpa mampatan) untuk Sandaran Penuh — tiada pustaka luar diperlukan.
(function (global) {
  const JADUAL = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  function crc32(b) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < b.length; i++) c = JADUAL[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  const enk = new TextEncoder();

  // fail: [{ nama: "folder/fail.txt", data: Uint8Array | string }]
  function buatZip(fail) {
    const bahagian = [], pusat = [];
    let ofset = 0;
    const d = new Date();
    const masa = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const tarikh = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of fail) {
      const nama = enk.encode(f.nama), data = typeof f.data === "string" ? enk.encode(f.data) : f.data;
      const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, masa, true); lh.setUint16(12, tarikh, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nama.length, true); lh.setUint16(28, 0, true);
      bahagian.push(lh, nama, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, masa, true); ch.setUint16(14, tarikh, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nama.length, true); ch.setUint32(42, ofset, true);
      pusat.push(ch, nama);
      ofset += 30 + nama.length + data.length;
    }
    const saizPusat = pusat.reduce((s, x) => s + x.byteLength, 0);
    const akhir = new DataView(new ArrayBuffer(22));
    akhir.setUint32(0, 0x06054b50, true); akhir.setUint16(8, fail.length, true); akhir.setUint16(10, fail.length, true);
    akhir.setUint32(12, saizPusat, true); akhir.setUint32(16, ofset, true);
    return new Blob([...bahagian, ...pusat, akhir], { type: "application/zip" });
  }
  global.Zip = { buatZip };
})(window);
