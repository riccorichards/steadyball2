import type { Metadata } from "next";
import PassingTriangle from "@/components/challenges/PassingTriangle";

export const metadata: Metadata = { title: "Passing Triangle (pilot)" };

export default function Page(): React.JSX.Element {
  return <PassingTriangle />;
}
