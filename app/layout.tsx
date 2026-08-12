import type { Metadata } from "next";
import localFont from "next/font/local";
import "@fontsource/bagnard";
import "./globals.css";
import Nav from "@/components/Nav";
import RotatingCursor from "@/components/RotatingCursor";

const fontBody = localFont({
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
});
const fontMeta = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-meta",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Mau — Portafolio 2026",
  description: "Portafolio de QA Automation Developer y desarrollador fullstack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontBody.variable} ${fontMeta.variable}`}>
      <body>
        <RotatingCursor>
          <Nav />
          {children}
        </RotatingCursor>
      </body>
    </html>
  );
}