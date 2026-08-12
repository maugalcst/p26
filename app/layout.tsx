import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import RotatingCursor from "@/components/RotatingCursor";

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
    <html lang="es">
      <body>
        <RotatingCursor>
          <Nav />
          {children}
        </RotatingCursor>
      </body>
    </html>
  );
}