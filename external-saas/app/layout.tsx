import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextDue",
  description: "Jurisdiction-aware life administration, before it becomes urgent."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
