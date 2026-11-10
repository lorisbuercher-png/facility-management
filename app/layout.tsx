import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSCD – Onsite Control Desk",
  description: "OSCD – Onsite Control Desk, ein Produkt der FB Spezialbau. Die Facility-Management-Plattform für Standorte, Mängel, Freigaben und dokumentierte Unterhaltsarbeiten.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-CH">
      <body className="antialiased">{children}</body>
    </html>
  );
}
