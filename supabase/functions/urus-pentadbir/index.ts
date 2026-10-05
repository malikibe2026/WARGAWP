// Urus akaun pentadbir (hanya pentadbir sedia ada boleh panggil).
// { tindakan: "senarai" }                 → senarai e-mel pentadbir
// { tindakan: "tambah", emel }            → cipta akaun (kata laluan sementara dipulangkan sekali) + daftar sebagai pentadbir
// { tindakan: "buang", emel }             → buang daripada senarai pentadbir (tidak boleh buang diri sendiri)
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

async function emelPentadbir(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token.startsWith("sb_")) return null;
  const { data } = await svc.auth.getUser(token);
  const emel = data?.user?.email?.toLowerCase();
  if (!emel || !data.user?.email_confirmed_at) return null;
  const { data: p } = await svc.from("pentadbir").select("emel").ilike("emel", emel).maybeSingle();
  return p ? emel : null;
}

function kataLaluanSementara() {
  const abjad = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b, (x) => abjad[x % abjad.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, sebab: "Kaedah tidak dibenarkan" }, 405);
  const saya = await emelPentadbir(req);
  if (!saya) return json({ ok: false, sebab: "Akses pentadbir diperlukan" }, 403);
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, sebab: "Permintaan tidak sah" }, 400); }
  const emel = String(body.emel || "").trim().toLowerCase();

  if (body.tindakan === "senarai") {
    const { data, error } = await svc.from("pentadbir").select("emel").order("emel");
    if (error) return json({ ok: false, sebab: error.message }, 500);
    return json({ ok: true, saya, senarai: (data || []).map((r) => r.emel.toLowerCase()) });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emel)) return json({ ok: false, sebab: "Format e-mel tidak sah." });

  if (body.tindakan === "tambah") {
    const sementara = kataLaluanSementara();
    const { error } = await svc.auth.admin.createUser({ email: emel, password: sementara, email_confirm: true });
    const sudahAda = !!error && /already|registered|exists/i.test(error.message);
    if (error && !sudahAda) return json({ ok: false, sebab: error.message });
    const { error: e2 } = await svc.from("pentadbir").upsert({ emel }, { onConflict: "emel" });
    if (e2) return json({ ok: false, sebab: e2.message });
    return json({ ok: true, emel, kata_laluan: sudahAda ? null : sementara, sudah_ada: sudahAda });
  }

  if (body.tindakan === "buang") {
    if (emel === saya) return json({ ok: false, sebab: "Anda tidak boleh membuang akaun anda sendiri." });
    const { count } = await svc.from("pentadbir").select("emel", { count: "exact", head: true });
    if ((count || 0) <= 1) return json({ ok: false, sebab: "Sekurang-kurangnya seorang pentadbir diperlukan." });
    const { error } = await svc.from("pentadbir").delete().ilike("emel", emel);
    if (error) return json({ ok: false, sebab: error.message });
    return json({ ok: true });
  }

  return json({ ok: false, sebab: "Tindakan tidak dikenali" }, 400);
});
