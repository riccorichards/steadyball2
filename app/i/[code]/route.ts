// app/i/[code]/route.ts
//
// Invite links: steadyball.app/i/<code>  →  /?i=<code>&l=<language>
// The language comes from ?l= on the link, else the invite's default language (set in /admin).
// The home page remembers the code on the device (first link wins) and saves it with the player,
// so the dashboard can show how many players each link brought and how far they got.
// Links are created in /admin. An unknown code still works (it shows up under "Other sources").

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const CODE_RE = /^[a-z0-9-]{2,40}$/;

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).trim().toLowerCase();
  const target = new URL("/", request.url);
  if (!CODE_RE.test(code)) return NextResponse.redirect(target);

  target.searchParams.set("i", code);
  // A language in the link itself wins (the share button adds the sharer's language).
  const l = new URL(request.url).searchParams.get("l");
  if (l === "ka" || l === "en" || l === "ru") {
    target.searchParams.set("l", l);
    return NextResponse.redirect(target);
  }
  try {
    const { data } = await getSupabaseAdmin()
      .from("invites")
      .select("default_lang")
      .eq("code", code)
      .maybeSingle();
    if (data?.default_lang) target.searchParams.set("l", data.default_lang);
  } catch {
    /* database not configured: the link still works, just without a preset language */
  }
  return NextResponse.redirect(target);
}
