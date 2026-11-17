import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const deeplKey = Deno.env.get("DEEPL_AUTH_KEY");
    if (!deeplKey) throw new Error("DEEPL_AUTH_KEY is not configured");

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const supabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { data: adminRow, error: adminError } = await supabase
      .from("site_admins").select("user_id").eq("user_id", userData.user.id).maybeSingle();
    if (adminError || !adminRow) return new Response(JSON.stringify({ error: "Administrator access required" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });

    const body = await req.json();
    const fields = body?.fields;
    if (!fields || typeof fields.title !== "string" || typeof fields.category !== "string" || !Array.isArray(fields.items)) {
      return new Response(JSON.stringify({ error: "Invalid update fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const texts = [fields.title, fields.category, ...fields.items.map((x: unknown) => String(x))];
    if (texts.some((x) => x.length > 2000)) throw new Error("A text field is too long");

    async function translate(target_lang: string) {
      const params = new URLSearchParams();
      params.set("target_lang", target_lang);
      params.set("source_lang", "JA");
      params.set("preserve_formatting", "1");
      for (const text of texts) params.append("text", text);
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Authorization": `DeepL-Auth-Key ${deeplKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "DeepL translation failed");
      return result.translations.map((x: { text: string }) => x.text);
    }

    const [en, zh] = await Promise.all([translate("EN"), translate("ZH")]);
    const pack = (values: string[]) => ({ title: values[0], category: values[1], items: values.slice(2) });
    return new Response(JSON.stringify({ en: pack(en), zh: pack(zh) }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});