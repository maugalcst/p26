"use client";

import { useCallback, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark" | "alt";

/* Orden del ciclo del botón. "alt" es el tercer tema; sus colores están
   en globals.css (html[data-theme="alt"]) y los define Mau. Para
   renombrarlo basta con cambiarlo aquí, en ese bloque de globals.css y
   en el script inline de app/layout.tsx. */
export const THEMES: Theme[] = ["light", "dark", "alt"];

const STORAGE_KEY = "theme";

const isTheme = (v: string | null): v is Theme =>
  v !== null && (THEMES as string[]).includes(v);

/* Lee el tema que el script inline de <head> ya dejó en <html data-theme>,
   antes de la hidratación (así no hay flash). */
function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  /* useLayoutEffect: sincroniza el label del botón con el tema ya aplicado
     por el script inline de <head> ANTES del primer paint (un useEffect
     normal dejaba el label inicial incorrecto durante un frame). */
  useLayoutEffect(() => {
    setTheme(getInitialTheme());

    /* Si el usuario no fijó preferencia manual, seguir al sistema. Solo
       aplica a light/dark: "alt" no tiene equivalente en el sistema. */
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* El botón cicla por THEMES en orden */
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* modo privado o sin storage */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}