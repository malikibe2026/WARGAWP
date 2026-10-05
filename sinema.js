// Grafik sinematik hero direktori: dinding potret bergerak, buruj data (kanvas) dan sorotan kursor.
// Semua animasi dimatikan jika pengguna memilih "kurangkan gerakan" pada peranti.
(function (global) {
  const kurangGerak = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Buruj data (kanvas) ----------
  function buruj(kanvas) {
    const ctx = kanvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, titik = [], denyut = [], jalan = true, tetikus = null;
    const WARNA = ["rgba(140,190,255,", "rgba(201,162,39,"];

    function saiz() {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = kanvas.clientWidth; h = kanvas.clientHeight;
      kanvas.width = w * dpr; kanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(28, w * h / 16000)));
      titik = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: Math.random() * 1.6 + .6, emas: Math.random() < .14,
      }));
    }

    function lukis() {
      ctx.clearRect(0, 0, w, h);
      const had = 130;
      for (let i = 0; i < titik.length; i++) {
        const a = titik[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; if (a.y > h + 20) a.y = -20;
        if (tetikus) {   // titik tertarik perlahan ke arah kursor
          const dx = tetikus.x - a.x, dy = tetikus.y - a.y, d = Math.hypot(dx, dy);
          if (d < 180) { a.x += dx * .004; a.y += dy * .004; }
        }
        for (let j = i + 1; j < titik.length; j++) {
          const b = titik[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < had) {
            ctx.strokeStyle = `rgba(140,190,255,${(1 - d / had) * .22})`;
            ctx.lineWidth = .7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (Math.random() < .0006 && denyut.length < 14) denyut.push({ a, b, t: 0 });
          }
        }
      }
      for (const a of titik) {
        ctx.fillStyle = (a.emas ? WARNA[1] : WARNA[0]) + (a.emas ? ".9)" : ".75)");
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      // Denyut data bergerak sepanjang garisan
      denyut = denyut.filter(p => (p.t += .018) < 1);
      for (const p of denyut) {
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
        g.addColorStop(0, "rgba(255,226,140,.95)"); g.addColorStop(1, "rgba(255,226,140,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      }
      if (jalan) requestAnimationFrame(lukis);
    }

    saiz();
    addEventListener("resize", () => { clearTimeout(saiz._t); saiz._t = setTimeout(saiz, 200); });
    const hero = kanvas.closest(".hero");
    hero.addEventListener("pointermove", e => { const r = kanvas.getBoundingClientRect(); tetikus = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    hero.addEventListener("pointerleave", () => (tetikus = null));
    // Hentikan apabila hero tidak kelihatan atau tab disembunyikan (jimat bateri).
    const kawal = nampak => { if (nampak && !jalan) { jalan = true; requestAnimationFrame(lukis); } else if (!nampak) jalan = false; };
    new IntersectionObserver(([e]) => kawal(e.isIntersecting && !document.hidden)).observe(hero);
    document.addEventListener("visibilitychange", () => kawal(!document.hidden));
    if (kurangGerak) { jalan = false; lukis(); } else requestAnimationFrame(lukis);
  }

  // ---------- Dinding potret bergerak ----------
  function isiDinding(el, urls) {
    if (!el || el.dataset.siap || !urls.length) return;
    el.dataset.siap = "1";
    const campur = urls.slice().sort(() => Math.random() - .5).slice(0, 45);
    const lajur = 5, setiap = Math.max(5, Math.ceil(campur.length / lajur));
    let html = "";
    for (let c = 0; c < lajur; c++) {
      const set = Array.from({ length: setiap }, (_, i) => campur[(c * setiap + i) % campur.length]);
      const isi = set.concat(set).map(u => `<img src="${u}" alt="" loading="lazy" decoding="async">`).join("");
      html += `<div class="lajur" style="--tempoh:${70 + c * 9}s;--arah:${c % 2 ? "reverse" : "normal"}">${isi}</div>`;
    }
    el.innerHTML = html;
    requestAnimationFrame(() => el.classList.add("muncul"));
  }

  // ---------- Sorotan kursor ----------
  function sorotan(hero) {
    if (kurangGerak) return;
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--sx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--sy", `${e.clientY - r.top}px`);
    });
  }

  // ---------- Angka naik ----------
  function kiraNaik(el, ke) {
    if (!el) return;
    const sasar = Number(ke);
    if (kurangGerak || !Number.isFinite(sasar)) { el.textContent = ke; return; }
    const mula = performance.now(), tempoh = 1400;
    (function langkah(t) {
      const k = Math.min(1, (t - mula) / tempoh), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(sasar * e);
      if (k < 1) requestAnimationFrame(langkah);
    })(mula);
  }

  // ---------- Kad muncul berperingkat semasa skrol ----------
  let pemerhati = null;
  function pantauKad(bekas, pemilih = ".kad, .kumpulan") {
    if (kurangGerak || !("IntersectionObserver" in global)) return;
    pemerhati?.disconnect();
    pemerhati = new IntersectionObserver(entri => {
      for (const e of entri) if (e.isIntersecting) { e.target.classList.add("muncul"); pemerhati.unobserve(e.target); }
    }, { rootMargin: "0px 0px -6% 0px" });
    let i = 0;
    for (const k of bekas.querySelectorAll(pemilih)) {
      k.classList.add("sedia-muncul");
      k.style.setProperty("--tunda", `${(i++ % 6) * 55}ms`);
      pemerhati.observe(k);
    }
  }

  global.Sinema = { buruj, isiDinding, sorotan, kiraNaik, pantauKad, kurangGerak };
})(window);
