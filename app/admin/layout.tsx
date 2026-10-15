// app/admin/layout.tsx  (NEW FILE)
//
// The root layout is a phone-width column; the admin area breaks out of it to use the full
// screen (works on a laptop or a phone). Hidden from search engines.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 select-text overflow-y-auto bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
