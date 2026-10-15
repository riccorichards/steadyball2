// app/admin/actions.ts  (NEW FILE)
//
// Server actions for the admin login form and the logout button.

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  passwordMatches,
} from "@/lib/admin-auth";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Wrong password" };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE_S,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
