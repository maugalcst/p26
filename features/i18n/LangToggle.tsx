"use client";

import { useLang } from "./useLang";

const OTHER = { es: "EN", en: "ES" } as const;
const ARIA = {
  es: "Ver el sitio en inglés",
  en: "View the site in Spanish",
} as const;

export default function LangToggle() {
  const { lang, toggle } = useLang();

  return (
    <div className="nav-lang">
      <button
        type="button"
        className="lang-toggle"
        onClick={toggle}
        lang={lang === "es" ? "en" : "es"}
        aria-label={ARIA[lang]}
      >
        {OTHER[lang]}
      </button>
    </div>
  );
}
