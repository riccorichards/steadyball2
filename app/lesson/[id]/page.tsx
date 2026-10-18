// app/lesson/[id]/page.tsx
//
// Plays any lesson from lessons/ — no component per challenge. Pages are generated at build time.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonScreen from "@/components/LessonScreen";
import { CHALLENGES } from "@/lib/challenges";

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return CHALLENGES.map((c) => ({ id: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = CHALLENGES.find((x) => x.slug === id);
  return { title: c?.full_title ?? "Lesson" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!CHALLENGES.some((c) => c.slug === id)) notFound();
  return <LessonScreen id={id} />;
}
