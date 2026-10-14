import type { Metadata } from "next";
import CurvedRun from "@/components/challenges/CurvedRun";
import { getChallenge } from "@/lib/challenges";

export const metadata: Metadata = { title: getChallenge("curved-run").full_title };

export default function Page(): React.JSX.Element {
  return <CurvedRun />;
}
