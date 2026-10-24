import type { Metadata } from "next";
import ThirdMan from "@/components/challenges/ThirdMan";

export const metadata: Metadata = { title: "Third Man (pilot)" };

export default function Page(): React.JSX.Element {
  return <ThirdMan />;
}
