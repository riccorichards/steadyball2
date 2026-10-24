// app/api/geo/route.ts
//
// The visitor's country (two letters, e.g. "GE", "AZ"), read from the hosting edge.
// Vercel adds the x-vercel-ip-country header to every request; nothing is stored here and the
// IP address itself is never read or saved. Locally (npm run dev) the answer is null.

import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const h = await headers();
  const raw = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) && raw !== "XX" ? raw : null;
  return Response.json({ country }, { headers: { "cache-control": "no-store" } });
}
