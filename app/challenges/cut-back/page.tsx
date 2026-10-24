import type { Metadata } from "next";
import CutBack from "@/components/challenges/CutBack";

export const metadata: Metadata = { title: "Cut-Back (pilot)" };

export default function Page(): React.JSX.Element {
  return <CutBack />;
}
