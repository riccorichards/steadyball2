import type { Metadata } from "next";
import HalfTurn from "@/components/challenges/HalfTurn";
import { getChallenge } from "@/lib/challenges";

export const metadata: Metadata = { title: getChallenge("half-turn").full_title };

export default function Page(): React.JSX.Element {
  return <HalfTurn />;
}
