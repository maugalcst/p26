"use client";

import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";

export type Lang = "es" | "en";

// Cualquier texto del sitio se escribe así: { es: "...", en: "..." }
export type Localized<T> = Record<Lang, T>;

const STORAGE_KEY = "lang";

// Estado compartido: el toggle vive en el nav y las secciones lo leen,
// así que el idioma no puede vivir dentro de un solo componente
let current: Lang = "es";
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const snapshot = () => current;
const serverSnapshot = (): Lang => "es";

export const isLang = (v: string | null): v is Lang => v === "es" || v === "en";

export function setLang(next: Lang) {
  if (next === current) return;
  current = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  listeners.forEach((fn) => fn());
}

export function useLang() {
  const lang = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  // El script de <head> ya dejó el idioma en <html lang>. Se sincroniza
  // antes del primer paint para que no se vea un parpadeo en español.
  useLayoutEffect(() => {
    const fromHtml = document.documentElement.lang;
    if (isLang(fromHtml) && fromHtml !== current) {
      current = fromHtml;
      listeners.forEach((fn) => fn());
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(current === "es" ? "en" : "es");
  }, []);

  return { lang, toggle };
}

export function useT() {
  const { lang } = useLang();
  return <T,>(value: Localized<T>): T => value[lang];
}
