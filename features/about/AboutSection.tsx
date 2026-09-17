"use client";

import "./AboutSection.css";
import { useT, type Localized } from "@/features/i18n/useLang";

// TODO: escribir mi texto aquí, en los dos idiomas
const PLACEHOLDER: Localized<string>[] = [
  {
    es: "Aquí va el texto: unas líneas en primera persona, sin currículum ni adjetivos de relleno.",
    en: "My text goes here: a few lines in first person, no résumé and no filler adjectives.",
  },
  {
    es: "Tres o cuatro frases, una idea por frase, con espacio para respirar entre ellas.",
    en: "Three or four sentences, one idea each, with room to breathe between them.",
  },
];

// TODO: mi correo real y el LinkedIn
const CONTACTO: {
  label: Localized<string>;
  text: Localized<string>;
  href: string | null;
}[] = [
  {
    label: { es: "correo", en: "email" },
    text: { es: "tu@correo.com", en: "tu@correo.com" },
    href: "mailto:tu@correo.com",
  },
  {
    label: { es: "github", en: "github" },
    text: { es: "maugalcst", en: "maugalcst" },
    href: "https://github.com/maugalcst",
  },
  {
    label: { es: "linkedin", en: "linkedin" },
    text: { es: "pendiente", en: "pending" },
    href: null,
  },
];

const UI = {
  titulo: { es: "Sobre mí", en: "About" },
};

export default function AboutSection() {
  const t = useT();
  return (
    <section
      id="sobre-mi"
      className="about scroll-section scroll-section--after-4"
    >
      <div className="about__content scroll-target">
        <header className="about__title-band">
          <h2 className="about__title">{t(UI.titulo)}</h2>
        </header>

        <div className="about__body">
          {PLACEHOLDER.map((line, i) => (
            <p key={i} className="about__line">
              {t(line)}
            </p>
          ))}
        </div>

        <footer className="about__contact">
          <ul className="about__contact__list">
            {CONTACTO.map((c) => (
              <li key={c.label.es} className="about__contact__item">
                <span className="about__contact__label">{t(c.label)}</span>
                {c.href ? (
                  <a href={c.href}>{t(c.text)}</a>
                ) : (
                  <span className="about__contact__pending">{t(c.text)}</span>
                )}
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </section>
  );
}
