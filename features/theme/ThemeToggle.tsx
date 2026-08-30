"use client";

import { useTheme } from "@/features/theme/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <li>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        aria-pressed={theme === "dark"}
      >
        {theme === "dark" ? "LIGHT" : "DARK"}
      </button>
    </li>
  );
}