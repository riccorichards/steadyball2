import type { Metadata } from "next";
import PassingTriangle from "@/components/challenges/PassingTriangle";
import { getChallenge } from "@/lib/challenges";

export const metadata: Metadata = { title: getChallenge("triangle").full_title };

export default function Page(): React.JSX.Element {
  return <PassingTriangle />;
}
