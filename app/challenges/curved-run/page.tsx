import type { Metadata } from "next";
import CurvedRun from "@/components/challenges/CurvedRun";

export const metadata: Metadata = { title: "Curved Run (pilot)" };

export default function Page(): React.JSX.Element {
  return <CurvedRun />;
}
