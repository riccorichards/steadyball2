import type { Metadata } from "next";
import HalfTurn from "@/components/challenges/HalfTurn";

export const metadata: Metadata = { title: "Half-Turn (pilot)" };

export default function Page(): React.JSX.Element {
  return <HalfTurn />;
}
