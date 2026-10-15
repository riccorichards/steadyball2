// app/challenges/layout.tsx  (NEW FILE)
//
// Wraps every /challenges/* page: players who haven't signed up are sent to the home page first.

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHydrated, useProfile } from "@/lib/player";

export default function ChallengesLayout({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();

  useEffect(() => {
    if (hydrated && !profile) router.replace("/");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) return null;
  return <>{children}</>;
}
