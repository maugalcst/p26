"use client";

import type { CSSProperties } from "react";
import { useTheme, THEMES, type Theme } from "@/features/theme/useTheme";
import { useT } from "@/features/i18n/useLang";

const LABEL: Record<Theme, string> = {
  light: "IVORY",
  dark: "EMBER",
  alt: "PHOSPHOR",
};

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const t = useT();

  return (
    <div className="nav-aside">
      <button
        type="button"
        className="theme-toggle"
        onClick={toggle}
        aria-label={t({
          es: `Tema: ${LABEL[theme]}. Cambiar al siguiente`,
          en: `Theme: ${LABEL[theme]}. Switch to the next one`,
        })}
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
