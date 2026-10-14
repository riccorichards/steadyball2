import { redirect } from "next/navigation";
import { CHALLENGES, challengeHref } from "@/lib/challenges";

export default function Home(): never {
  redirect(challengeHref(CHALLENGES[0].slug));
}
