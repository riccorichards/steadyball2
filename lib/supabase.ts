// lib/supabase.ts  (NEW FILE)
//
// One shared browser client. Returns null when the env vars are missing, so the app
// still works offline / in local dev without a Supabase project.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window === "undefined" || !url || !key) {
    if (typeof window !== "undefined") {
      console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set — running offline.");
    }
    client = null;
    return client;
  }

  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
