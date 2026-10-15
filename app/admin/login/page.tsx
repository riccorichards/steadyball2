// app/admin/login/page.tsx  (NEW FILE)

"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { login, type LoginState } from "../actions";

const initial: LoginState = { error: null };

export default function AdminLoginPage(): React.JSX.Element {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <form
        action={action}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-xl font-black">SteadyBall Admin</h1>
        <p className="mt-1 text-sm text-slate-400">Enter the admin password.</p>

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-5 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-base text-white outline-none focus:border-cyan-300/70"
        />
        {state.error && (
          <p className="mt-2 text-sm font-semibold text-rose-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-xl bg-cyan-400 py-3 text-base font-black text-slate-950 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
