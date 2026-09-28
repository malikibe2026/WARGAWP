// Lapisan simpanan data: Supabase (dalam talian) atau localStorage (tempatan).
(function (global) {
  const cfg = global.WARGA_CONFIG || {};
  const MEDAN = ["nama", "jawatan", "gred", "unit", "telefon_pejabat", "telefon_bimbit",
    "emel", "tarikh_lahir", "tarikh_lapor_diri", "catatan", "gambar_url", "susunan"];

  function bersihRekod(r) {
    const o = {};
    for (const k of MEDAN) {
      const v = r[k] == null ? "" : String(r[k]).trim();
      o[k] = v === "" ? null : v;
    }
    o.susunan = o.susunan == null || isNaN(+o.susunan) ? null : Math.round(+o.susunan);
    return o;
  }

  function uuid() {
    return (global.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ---------- Mod tempatan ----------
  const KUNCI = "warga_dosm_kl_v1";
  const KUNCI_SESI = "warga_dosm_kl_admin";

  const LocalStore = {
    mod: "tempatan",
    _baca() {
      try { return JSON.parse(localStorage.getItem(KUNCI)) || []; } catch { return []; }
    },
    _tulis(senarai) {
      try { localStorage.setItem(KUNCI, JSON.stringify(senarai)); }
      catch (e) { throw new Error("Ruang simpanan pelayar penuh. Kurangkan gambar atau guna mod dalam talian."); }
    },
    async senarai() { return this._baca(); },
    async simpan(rekod) {
      const senarai = this._baca();
      const data = { ...bersihRekod(rekod), updated_at: new Date().toISOString() };
      if (rekod.id) {
        const i = senarai.findIndex(x => x.id === rekod.id);
        if (i >= 0) senarai[i] = { ...senarai[i], ...data };
        else senarai.push({ id: rekod.id, ...data });
      } else {
        senarai.push({ id: uuid(), ...data });
      }
      this._tulis(senarai);
    },
    async simpanBanyak(rekods) {
      const senarai = this._baca();
      const now = new Date().toISOString();
      for (const r of rekods) senarai.push({ id: uuid(), ...bersihRekod(r), updated_at: now });
      this._tulis(senarai);
    },
    async padam(id) { this._tulis(this._baca().filter(x => x.id !== id)); },
    async muatNaikGambar(blob) {
      return await new Promise((ok, gagal) => {
        const fr = new FileReader();
        fr.onload = () => ok(fr.result);
        fr.onerror = gagal;
        fr.readAsDataURL(blob);
      });
    },
    async sesi() { return sessionStorage.getItem(KUNCI_SESI) === "1"; },
    async logMasuk({ pin }) {
      if (pin !== cfg.ADMIN_PIN) throw new Error("PIN tidak sah.");
      sessionStorage.setItem(KUNCI_SESI, "1");
    },
    async logKeluar() { sessionStorage.removeItem(KUNCI_SESI); },
  };

  // ---------- Mod dalam talian (Supabase) ----------
  function buatSupaStore() {
    const sb = global.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const JADUAL = "warga";
    const semak = ({ data, error }) => {
      if (!error) return data;
      if (/row-level security|403|Unauthorized/i.test(error.message))
        throw new Error("Akaun ini tiada kebenaran pentadbir. Hubungi pengurus sistem.");
      throw new Error(error.message);
    };
    return {
      mod: "dalam talian",
      sb,
      async senarai() { return semak(await sb.from(JADUAL).select("*").order("nama")); },
      async simpan(rekod) {
        const data = bersihRekod(rekod);
        if (rekod.id) semak(await sb.from(JADUAL).update(data).eq("id", rekod.id));
        else semak(await sb.from(JADUAL).insert(data));
      },
      async simpanBanyak(rekods) { semak(await sb.from(JADUAL).insert(rekods.map(bersihRekod))); },
      async padam(id) { semak(await sb.from(JADUAL).delete().eq("id", id)); },
      async muatNaikGambar(blob) {
        const laluan = `${uuid()}.jpg`;
        semak(await sb.storage.from(cfg.SUPABASE_BUCKET).upload(laluan, blob, { contentType: "image/jpeg" }));
        return sb.storage.from(cfg.SUPABASE_BUCKET).getPublicUrl(laluan).data.publicUrl;
      },
      async sesi() { return !!(await sb.auth.getSession()).data.session; },
      async logMasuk({ email, password }) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Log masuk gagal: " + error.message);
      },
      async logKeluar() { await sb.auth.signOut(); },
    };
  }

  const dalamTalian = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && global.supabase;
  global.Store = dalamTalian ? buatSupaStore() : LocalStore;
  global.Store.MEDAN = MEDAN;
})(window);
