// app/admin/invite-actions.ts
//
// Server actions for invite links: create, archive, restore. Admin only (password cookie),
// written with the service-role key (the invites table is closed to the app's public key).

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const CODE_RE = /^[a-z0-9-]{2,40}$/;
const KINDS = ["team", "social", "partner", "other"] as const;
const LANGS = ["ka", "en", "ru"] as const;

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const randomCode = (): string => Math.random().toString(36).slice(2, 8);

const back = (params: Record<string, string>): never => redirect(`/admin?${new URLSearchParams(params).toString()}#invites`);

export async function createInvite(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");

  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const kindRaw = String(formData.get("kind") ?? "other");
  const langRaw = String(formData.get("lang") ?? "");
  let code = slugify(String(formData.get("code") ?? ""));
  if (!label) back({ invite_error: "Give the link a name." });
  if (!code) code = slugify(label);
  if (code.length < 2) code = randomCode(); // e.g. a Georgian or Russian name: no Latin letters to use
  if (!CODE_RE.test(code)) back({ invite_error: "The code may use only a–z, 0–9 and dashes." });

  const kind = (KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "other";
  const default_lang = (LANGS as readonly string[]).includes(langRaw) ? langRaw : null;

  const { error } = await getSupabaseAdmin().from("invites").insert({ code, label, kind, default_lang });
  if (error) {
    back({ invite_error: error.code === "23505" ? `The code “${code}” is already used. Pick another.` : error.message });
  }
  revalidatePath("/admin");
  back({ invite_created: code });
}

export async function setInviteArchived(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const code = String(formData.get("code") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  if (!CODE_RE.test(code)) back({});
  const { error } = await getSupabaseAdmin().from("invites").update({ archived }).eq("code", code);
  if (error) back({ invite_error: error.message });
  revalidatePath("/admin");
  back({});
}
