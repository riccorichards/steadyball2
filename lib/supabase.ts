// lib/supabase.ts  (REPLACE the existing file)
//
// One shared browser client. Returns null when settings are missing, so the app keeps
// working offline instead of crashing — and says exactly what's missing in the console.
//
// Accepts the key under any of the names Supabase's own guides use:
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// (Each name must be written out in full below: Next.js only bakes NEXT_PUBLIC_ values into
//  the browser build when it sees the exact name.)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** Base project URL only — strips a pasted "/rest/v1/" or trailing slash. */
const cleanUrl = (raw: string | undefined): string | undefined =>
  raw
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "") || undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === "undefined") return null;

  const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.warn(
      `[supabase] OFFLINE — nothing will be saved to the database. Missing: ${[
        !url && "NEXT_PUBLIC_SUPABASE_URL",
        !key &&
          "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)",
      ]
        .filter(Boolean)
        .join(
          ", ",
        )}. On Vercel: add it in Settings → Environment Variables, then Redeploy.`,
    );
    client = null;
    return client;
  }

  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
