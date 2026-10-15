// lib/supabase-admin.ts  (NEW FILE)
//
// Server-only Supabase client with the service-role key (bypasses Row Level Security).
// Import it ONLY from server code (app/admin/page.tsx, server actions). The key has no
// NEXT_PUBLIC_ prefix, so Next.js never puts it in the browser bundle.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin() must never run in the browser");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
