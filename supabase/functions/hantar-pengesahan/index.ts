// Hantar e-mel pengesahan kehadiran (dengan sijil PDF pilihan).
// Panggilan awam : { kod, warga_id }            → hanya jika rekod hadir wujud & e-mel belum pernah dihantar.
// Panggilan admin: { program_id, warga_ids[] }   → token pentadbir diperlukan; boleh hantar semula.
// Muat turun sijil: { kod, warga_id, peranti, muat_turun: true } → hanya dari telefon yang merekod kehadiran itu.
import { createClient } from "npm:@supabase/supabase-js@2";
import * as PDFLib from "npm:pdf-lib@1.17.1";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { Sijil } from "./sijil.ts";

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

const SUBJEK_LALAI = "Pengesahan Kehadiran: {program}";
const ISI_LALAI = `Assalamualaikum dan salam sejahtera {nama},

Terima kasih atas kehadiran tuan/puan ke {program} pada {tarikh} di {lokasi}.

Kehadiran tuan/puan telah direkodkan pada {masa_hadir}.

Sekian, terima kasih.

Urus Setia
Jabatan Perangkaan Malaysia, Wilayah Persekutuan`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const tz = { timeZone: "Asia/Kuala_Lumpur" } as const;

async function adalahPentadbir(req: Request): Promise<boolean> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token.startsWith("sb_")) return false;
  const { data } = await svc.auth.getUser(token);
  const emel = data?.user?.email;
  if (!emel || !data.user?.email_confirmed_at) return false;
  const { data: p } = await svc.from("pentadbir").select("emel").ilike("emel", emel).maybeSingle();
  return !!p;
}

async function hantarEmel(ke: string, nama: string, subjek: string, teks: string, html: string, lampiran?: { nama: string; bait: Uint8Array }) {
  const namaPengirim = Deno.env.get("PENGIRIM_NAMA") || "DOSM Wilayah Persekutuan";
  const balasKe = Deno.env.get("BALAS_KE") || undefined;
  const brevo = Deno.env.get("BREVO_API_KEY");
  if (brevo) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevo, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: namaPengirim, email: Deno.env.get("PENGIRIM_EMEL") },
        to: [{ email: ke, name: nama }], subject: subjek, textContent: teks, htmlContent: html,
        ...(balasKe ? { replyTo: { email: balasKe } } : {}),
        ...(lampiran ? { attachment: [{ name: lampiran.nama, content: encodeBase64(lampiran.bait) }] } : {}),
      }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return;
  }
  const user = Deno.env.get("GMAIL_USER"), pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) throw new Error("Penghantar e-mel belum ditetapkan (GMAIL_USER / GMAIL_APP_PASSWORD).");
  const smtp = new SMTPClient({
    connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: user, password: pass.replace(/\s+/g, "") } },
  });
  try {
    await smtp.send({
      from: `${namaPengirim} <${user}>`, to: ke, subject: subjek, content: teks, html,
      ...(balasKe ? { replyTo: balasKe } : {}),
      attachments: lampiran ? [{ filename: lampiran.nama, content: lampiran.bait, encoding: "binary", contentType: "application/pdf" }] : [],
    });
  } finally {
    await smtp.close();
  }
}

// deno-lint-ignore no-explicit-any
function dataRuang(program: any, w: any, masaHadir: string) {
  const jam = (t: string | null) => (t ? t.slice(0, 5) : "");
  return {
    nama: w.nama, jawatan: w.jawatan || "", gred: w.gred || "", unit: w.unit || "",
    program: program.nama, lokasi: program.lokasi_nama || "",
    tarikh: new Date(program.tarikh + "T00:00:00+08:00").toLocaleDateString("ms-MY", { ...tz, day: "numeric", month: "long", year: "numeric" }),
    masa: program.masa_mula ? `${jam(program.masa_mula)}${program.masa_tamat ? " - " + jam(program.masa_tamat) : ""}` : "",
    masa_hadir: new Date(masaHadir).toLocaleString("ms-MY", { ...tz, hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric" }),
  };
}

const namaFailSijil = (nama: string) => `Sijil - ${Sijil.bersih(nama).replace(/[^\w ]+/g, "").trim()}.pdf`;

// deno-lint-ignore no-explicit-any
async function janaSijil(program: any, templat: Uint8Array | null, data: Record<string, string>) {
  // Nyahkod PNG besar melebihi had CPU fungsi (~2 s) — minta pentadbir tukar ke JPEG.
  if (templat && templat[0] === 0x89 && templat[1] === 0x50 && templat.length > 400_000)
    throw new Error("Templat sijil PNG terlalu besar untuk diproses. Buka tetapan program dan klik Simpan (templat akan ditukar ke JPEG).");
  return await Sijil.jana(PDFLib, { templat, teks: program.sijil_teks, data });
}

// deno-lint-ignore no-explicit-any
async function muatTurunSijil(program: any, templat: Uint8Array | null, wargaId: string, peranti: string) {
  if (!program.sijil_aktif || !program.sijil_muat_turun) return json({ ok: false, sebab: "Muat turun sijil tidak dibenarkan untuk program ini." });
  const { data: rekod } = await svc.from("kehadiran").select("masa, peranti_id, warga:warga_id(nama, jawatan, gred, unit)")
    .eq("program_id", program.id).eq("warga_id", wargaId).maybeSingle();
  if (!rekod) return json({ ok: false, sebab: "Rekod kehadiran tidak dijumpai." });
  if (!peranti || rekod.peranti_id !== peranti)
    return json({ ok: false, sebab: "Sijil hanya boleh dimuat turun dari telefon yang digunakan semasa daftar hadir." });
  try {
    const bait = await janaSijil(program, templat, dataRuang(program, rekod.warga, rekod.masa));
    // deno-lint-ignore no-explicit-any
    return json({ ok: true, nama_fail: namaFailSijil((rekod.warga as any).nama), pdf: encodeBase64(bait) });
  } catch (e) {
    return json({ ok: false, sebab: String((e as Error).message || e).slice(0, 300) });
  }
}

// deno-lint-ignore no-explicit-any
async function prosesSatu(program: any, templat: Uint8Array | null, hadirId: string, paksa: boolean) {
  // Tuntut rekod secara atomik supaya e-mel tidak dihantar dua kali.
  let q = svc.from("kehadiran").update({ emel_status: "menghantar", emel_ralat: null }).eq("id", hadirId);
  if (!paksa) q = q.is("emel_status", null);
  const { data: rows } = await q.select("id, masa, warga:warga_id(nama, emel, jawatan, gred, unit)");
  const rekod = rows?.[0];
  if (!rekod) return { ok: false, sebab: "sudah_diproses" };
  // deno-lint-ignore no-explicit-any
  const w: any = rekod.warga;
  if (!w?.emel) {
    await svc.from("kehadiran").update({ emel_status: "tiada_emel" }).eq("id", hadirId);
    return { ok: false, sebab: "tiada_emel" };
  }
  const data = dataRuang(program, w, rekod.masa);
  try {
    const subjek = Sijil.isiRuang(program.emel_subjek || SUBJEK_LALAI, data);
    const teks = Sijil.isiRuang(program.emel_isi || ISI_LALAI, data);
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1b2533;max-width:600px">
      <div style="border-top:4px solid #c9a227;padding-top:14px">${esc(teks).replace(/\n/g, "<br>")}</div></div>`;
    let lampiran;
    if (program.sijil_aktif && program.sijil_emel !== false) {
      lampiran = { nama: namaFailSijil(w.nama), bait: await janaSijil(program, templat, data) };
    }
    await hantarEmel(w.emel, w.nama, subjek, teks, html, lampiran);
    await svc.from("kehadiran").update({ emel_status: "dihantar", emel_masa: new Date().toISOString() }).eq("id", hadirId);
    return { ok: true, emel: w.emel.replace(/^(.).*?(@.*)$/, "$1***$2") };
  } catch (e) {
    const ralat = String((e as Error).message || e).slice(0, 300);
    await svc.from("kehadiran").update({ emel_status: "gagal", emel_ralat: ralat }).eq("id", hadirId);
    return { ok: false, sebab: "gagal", ralat };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, sebab: "Kaedah tidak dibenarkan" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, sebab: "Permintaan tidak sah" }, 400); }

  const admin = body.program_id ? await adalahPentadbir(req) : false;
  if (body.program_id && !admin) return json({ ok: false, sebab: "Akses pentadbir diperlukan" }, 403);

  const { data: program } = admin
    ? await svc.from("program").select("*").eq("id", body.program_id).maybeSingle()
    : await svc.from("program").select("*").eq("kod", String(body.kod || "")).maybeSingle();
  if (!program) return json({ ok: false, sebab: "Program tidak dijumpai" }, 404);
  if (!admin && !body.muat_turun && !program.emel_aktif) return json({ ok: false, sebab: "E-mel pengesahan tidak diaktifkan" });

  let templat: Uint8Array | null = null;
  if (program.sijil_aktif && program.sijil_templat) {
    const { data: fail, error } = await svc.storage.from("templat-sijil").download(program.sijil_templat);
    if (error) return json({ ok: false, sebab: "Templat sijil tidak dapat dibaca: " + error.message }, 500);
    templat = new Uint8Array(await fail.arrayBuffer());
  }

  if (body.muat_turun && !admin) return await muatTurunSijil(program, templat, String(body.warga_id || ""), String(body.peranti || ""));

  const ids: string[] = admin ? (body.warga_ids || []).slice(0, 20) : [String(body.warga_id || "")];
  const { data: hadir } = await svc.from("kehadiran").select("id, warga_id")
    .eq("program_id", program.id).in("warga_id", ids);
  const hasil: Record<string, unknown> = {};
  for (const h of hadir || []) hasil[h.warga_id] = await prosesSatu(program, templat, h.id, admin);
  for (const id of ids) if (!hasil[id]) hasil[id] = { ok: false, sebab: "tiada_rekod_hadir" };

  return json(admin ? { ok: true, hasil } : hasil[ids[0]]);
});
