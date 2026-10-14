import type { Metadata, Viewport } from "next";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SteadyBall Tactics", template: "%s · SteadyBall Tactics" },
  description: "Interactive football tactics puzzles",
};

/* Mobile-only: lock zoom so drags on the pitch never pinch-zoom the page. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="ka">
      <body className="bg-slate-950 text-white antialiased">
        <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden">
          <AppHeader />
          <main className="relative min-h-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
