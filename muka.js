// Pengecaman muka (face-api). Hanya "cap muka" (128 nombor) dihantar ke pelayan — gambar tidak disimpan.
(function (root) {
  const MODEL = "vendor/face-api/model";
  let sedia = null;

  function muatModel() {
    if (!sedia) sedia = (async () => {
      if (!root.faceapi) throw new Error("Pustaka pengecaman muka tidak dimuatkan.");
      const tf = faceapi.tf;
      for (const b of ["webgl", "cpu"]) {
        try { if (await tf.setBackend(b)) break; } catch { /* cuba enjin seterusnya */ }
      }
      await tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL),
      ]);
    })();
    return sedia;
  }

  // Besarkan gambar kecil supaya pengesan muka lebih stabil.
  function kanvas(sumber, min = 480) {
    const w = sumber.videoWidth || sumber.naturalWidth || sumber.width;
    const h = sumber.videoHeight || sumber.naturalHeight || sumber.height;
    const s = Math.max(1, min / Math.min(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext("2d").drawImage(sumber, 0, 0, c.width, c.height);
    return c;
  }

  // Pulangkan { deskriptor: number[128], skor } atau null jika tiada muka dikesan.
  async function capMuka(sumber) {
    await muatModel();
    const c = kanvas(sumber);
    for (const inputSize of [416, 320, 512]) {
      const d = await faceapi
        .detectSingleFace(c, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.35 }))
        .withFaceLandmarks().withFaceDescriptor();
      if (d) return { deskriptor: Array.from(d.descriptor, v => Math.round(v * 1e6) / 1e6), skor: d.detection.score };
    }
    return null;
  }

  function muatGambar(url) {
    return new Promise((ok, gagal) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => ok(img);
      img.onerror = () => gagal(new Error("Gambar tidak dapat dimuat"));
      img.src = url;
    });
  }

  root.Muka = { muatModel, capMuka, muatGambar };
})(window);
