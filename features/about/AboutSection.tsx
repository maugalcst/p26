"use client";

import "./AboutSection.css";
import { useT, type Localized } from "@/features/i18n/useLang";

// Mi texto. Si lo cambio, en los dos idiomas.
const TEXTO: Localized<string>[] = [
  {
    es: "Me gusta entender las cosas por dentro. Desarmo lo que ya funcionaba, le muevo hasta ver cómo se sostiene y casi siempre acabo con algo que solo existía en mi cabeza. Soy necio con el detalle: ahí es donde está lo bueno.",
    en: "I like understanding things from the inside. I take apart what already worked, poke at it until I see what holds it up, and usually end up with something that only existed in my head. I'm stubborn about detail: that's where the good part is.",
  },
  {
    es: "Juego tenis y escalo boulder, pero lo que de verdad me ordena la cabeza es el cerro. Un río y unos árboles me arreglan la semana; lo que no, lo arregla un piano. Vivo en Monterrey y estoy a gusto, aunque quiero conocer el mundo entero.",
    en: "I play tennis and boulder, but what really sorts my head out is the mountains. A river and a few trees fix my week; whatever they don't, a piano does. I live in Monterrey and I'm happy here, though I want to see the whole world.",
  },
];

const CONTACTO: {
  label: Localized<string>;
  text: Localized<string>;
  href: string | null;
}[] = [
  {
    label: { es: "correo", en: "email" },
    text: { es: "maugal.cst@gmail.com", en: "maugal.cst@gmail.com" },
    href: "mailto:maugal.cst@gmail.com",
  },
  {
    label: { es: "github", en: "github" },
    text: { es: "maugalcst", en: "maugalcst" },
    href: "https://github.com/maugalcst",
  },
  {
    label: { es: "linkedin", en: "linkedin" },
    text: { es: "mauricio-gallegos-castillo", en: "mauricio-gallegos-castillo" },
    href: "https://www.linkedin.com/in/mauricio-gallegos-castillo-4b9503288/",
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
          {TEXTO.map((line, i) => (
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
