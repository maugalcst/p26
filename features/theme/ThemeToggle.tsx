"use client";

import type { CSSProperties } from "react";
import { useTheme, THEMES, type Theme } from "@/features/theme/useTheme";

const LABEL: Record<Theme, string> = {
  light: "IVORY",
  dark: "EMBER",
  alt: "PHOSPHOR",
};

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  /* Vive en el nav, en su propia columna a la derecha de los tabs (ver
     .nav-aside en app/layout.css). Es un div, no un li: fuera de un
     ul/ol, un li se pinta con su viñeta — el reset de globals.css solo
     la apaga dentro de listas. */
  return (
    <div className="nav-aside">
      {/* Nombre del tema EN PANTALLA (no el siguiente: con tres en ciclo,
          nombrar el destino es una adivinanza) y un riel con el nodo del
          bus marcando en cuál de los tres vas. El riel es decorativo; lo
          que se lee es el nombre. Sin aria-pressed: es un ciclo, no un
          interruptor de dos estados. */}
      <button
        type="button"
        className="theme-toggle"
        onClick={toggle}
        aria-label={`Tema: ${LABEL[theme]}. Cambiar al siguiente`}
      >
        <span className="theme-toggle__name">{LABEL[theme]}</span>
        <span
          className="theme-toggle__rail"
          style={{ "--pos": THEMES.indexOf(theme) } as CSSProperties}
          aria-hidden="true"
        >
          <span className="theme-toggle__node" />
        </span>
      </button>
    </div>
  );
}