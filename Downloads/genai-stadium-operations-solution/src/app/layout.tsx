import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "StadiumFlow AI | FIFA World Cup 2026 Operations",
  description:
    "A GenAI-enabled stadium operations and fan experience command center for FIFA World Cup 2026.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#07111f] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
