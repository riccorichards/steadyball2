// app/tree/[branch]/page.tsx
//
// One branch of the tree: its lessons as a climbing path, easiest first.
// Finished = coloured ✓ with the XP earned, next = pulsing, the rest = dim (still playable:
// kids may jump ahead). A finished branch shows a trophy and the share button.

import { notFound } from "next/navigation";
import BranchView from "@/components/tree/BranchView";
import { BRANCHES, getBranch } from "@/lib/tree";

export const dynamicParams = false;

export function generateStaticParams(): { branch: string }[] {
  return BRANCHES.map((b) => ({ branch: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }): Promise<{ title: string }> {
  const { branch } = await params;
  return { title: getBranch(branch)?.name.en ?? "Branch" };
}

export default async function Page({ params }: { params: Promise<{ branch: string }> }): Promise<React.JSX.Element> {
  const { branch } = await params;
  if (!getBranch(branch)) notFound();
  return <BranchView branchId={branch} />;
}
