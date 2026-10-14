import type { Metadata } from "next";
import CutBack from "@/components/challenges/CutBack";
import { getChallenge } from "@/lib/challenges";

export const metadata: Metadata = { title: getChallenge("cut-back").full_title };

export default function Page(): React.JSX.Element {
  return <CutBack />;
}
