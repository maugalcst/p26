"use client";

import { useEffect } from "react";
import { THEMES, type Theme } from "./useTheme";

// Por si el CSS no se puede leer (hoja de otro origen, por ejemplo)
const RESPALDO: Record<Theme, { bg: string; fg: string; acento: string }> = {
  light: { bg: "#efedea", fg: "#2c2726", acento: "#0137bf" },
  dark: { bg: "#0f0e0e", fg: "#eadac8", acento: "#ff8f63" },
  alt: { bg: "#010101", fg: "#a2acb7", acento: "#57be80" },
};

// Lee cada paleta de globals.css en vez de repetirla aquí: si cambio un
// color del tema, el icono se entera solo.
function leerPaletas() {
  const paletas = { ...RESPALDO };
  const selector: Record<Theme, string> = {
    light: ":root",
    dark: 'html[data-theme="dark"]',
    alt: 'html[data-theme="alt"]',
  };
  for (const hoja of Array.from(document.styleSheets)) {
    let reglas: CSSRuleList;
    try {
      reglas = hoja.cssRules;
    } catch {
      continue;
    }
    for (const regla of Array.from(reglas)) {
      if (!(regla instanceof CSSStyleRule)) continue;
      for (const tema of THEMES) {
        if (regla.selectorText !== selector[tema]) continue;
        const bg = regla.style.getPropertyValue("--bg").trim();
        const fg = regla.style.getPropertyValue("--fg").trim();
        const acento = regla.style.getPropertyValue("--cursor-color").trim();
        if (bg && fg && acento) paletas[tema] = { bg, fg, acento };
      }
    }
  }
  return paletas;
}

// Misma geometría que app/icon.svg: la cruz del cursor y sus cuatro cotas
const dibujar = (p: { bg: string; fg: string; acento: string }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" fill="${p.bg}"/>` +
  `<rect x="4" y="13" width="24" height="6" fill="${p.acento}"/>` +
  `<rect x="13" y="4" width="6" height="24" fill="${p.acento}"/>` +
  `<g fill="${p.fg}" opacity="0.38">` +
  `<rect x="15" y="0" width="2" height="3"/>` +
  `<rect x="15" y="29" width="2" height="3"/>` +
  `<rect x="0" y="15" width="3" height="2"/>` +
  `<rect x="29" y="15" width="3" height="2"/>` +
  `</g></svg>`;

export default function FaviconTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const paletas = leerPaletas();
    const iconos = Object.fromEntries(
      THEMES.map((tema) => [
        tema,
        `data:image/svg+xml,${encodeURIComponent(dibujar(paletas[tema]))}`,
      ]),
    ) as Record<Theme, string>;

    const enlace =
      document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ??
      document.head.appendChild(
        Object.assign(document.createElement("link"), { rel: "icon" }),
      );
    const original = enlace.getAttribute("href");
    enlace.type = "image/svg+xml";

    const pintar = () => {
      const tema = root.getAttribute("data-theme");
      const icono = iconos[tema as Theme] ?? iconos.light;
      if (enlace.getAttribute("href") !== icono) {
        enlace.setAttribute("href", icono);
      }
    };

    pintar();
    const obs = new MutationObserver(pintar);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      obs.disconnect();
      if (original) enlace.setAttribute("href", original);
    };
  }, []);

  return null;
}
