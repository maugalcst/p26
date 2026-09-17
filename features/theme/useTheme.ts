"use client";

import { useCallback, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark" | "alt";

export const THEMES: Theme[] = ["light", "dark", "alt"];

const STORAGE_KEY = "theme";

const isTheme = (v: string | null): v is Theme =>
  v !== null && (THEMES as string[]).includes(v);

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    setTheme(getInitialTheme());

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

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {

      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
