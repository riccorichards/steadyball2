// components/admin/CopyLink.tsx
//
// The invite URL with a one-tap copy button (the only client-side piece of the dashboard).

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyLink({ url }: { url: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy the link:", url);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={url}
      className="group flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-cyan-200 hover:bg-white/10"
    >
      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
      {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />}
    </button>
  );
}
