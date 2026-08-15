import type { Metadata } from "next";
import localFont from "next/font/local";
import "@fontsource/bagnard";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/400-italic.css";
import "@fontsource/literata/400.css";
import "@fontsource/literata/400-italic.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/400-italic.css";
import "./globals.css";
import Nav from "@/components/Nav";
import ScrollNav from "@/components/ScrollNav";
import RotatingCursor from "@/components/RotatingCursor";
import BootSequence from "@/components/BootSequence";

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
const fontReglo = localFont({
  src: "./fonts/Reglo-Bold.woff2",
  variable: "--font-reglo",
  weight: "700",
});
const fontYoungSerif = localFont({
  src: "./fonts/YoungSerif-Regular.woff2",
  variable: "--font-young-serif",
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
    <html
      lang="es"
      className={`${fontBody.variable} ${fontMeta.variable} ${fontReglo.variable} ${fontYoungSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("theme");if(s!=="light"&&s!=="dark"){s=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",s);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <BootSequence />
        <ScrollNav />
        <RotatingCursor>
          <Nav />
          {children}
        </RotatingCursor>
        <div className="frame" aria-hidden="true">
          <span className="frame__top" />
          <span className="frame__right" />
          <span className="frame__bottom" />
          <span className="frame__left" />
        </div>
      </body>
    </html>
  );
}