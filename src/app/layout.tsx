import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Skool Workshop Planning",
  description: "Planningsysteem voor workshops, docenten en opdrachten",
  manifest: "/manifest.webmanifest",
  applicationName: "Skool Planning",
};

export const viewport: Viewport = {
  themeColor: "#f47c20",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
