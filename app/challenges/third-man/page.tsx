import type { Metadata } from "next";
import ThirdMan from "@/components/challenges/ThirdMan";
import { getChallenge } from "@/lib/challenges";

export const metadata: Metadata = { title: getChallenge("third-man").full_title };

export default function Page(): React.JSX.Element {
  return <ThirdMan />;
}
