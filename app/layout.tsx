import type { Metadata } from "next";
import localFont from "next/font/local";
import "@fontsource/bagnard";
import "./globals.css";
import "./layout.css";
import "./utilities.css";
import Nav from "@/features/nav/Nav";
import ScrollNav from "@/features/nav/ScrollNav";
import NavKeyboard from "@/features/nav/NavKeyboard";
import ScrollProgress from "@/features/scroll/ScrollProgress";
import RotatingCursor from "@/features/cursor/RotatingCursor";
import BootSequence from "@/features/boot/BootSequence";

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
    <html
      lang="es"
      className={`${fontBody.variable} ${fontMeta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("theme");if(["light","dark","alt"].indexOf(s)<0){s=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",s);var l=localStorage.getItem("lang");if(l!=="es"&&l!=="en"){l=(navigator.language||"es").toLowerCase().indexOf("es")===0?"es":"en";}document.documentElement.lang=l;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <BootSequence />
        <ScrollProgress />
        <ScrollNav />
        <NavKeyboard />
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
