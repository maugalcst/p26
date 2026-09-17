"use client";

import "./AboutSection.css";

/* SOBRE MÍ — sección 04. PLACEHOLDER.

   El gesto de la sección (app/layout.css, html.scroll-about): el marco
   se retira. Las cuatro hairlines salen del viewport por sus cuatro
   lados y el nav se va con ellas, así que es el único momento del sitio
   sin encuadre. Todo el recorrido mide, fecha y conecta; aquí se apaga
   el instrumento para hablar en primera persona.

   PLACEHOLDER de contenido: el texto y los datos de contacto los
   escribe Mau. TODO: correo real y LinkedIn; el GitHub sale del remoto
   del repo. */
const PLACEHOLDER = [
  "Aquí va el texto: unas líneas en primera persona, sin currículum ni adjetivos de relleno.",
  "Tres o cuatro frases, una idea por frase, con espacio para respirar entre ellas.",
];

/* TODO: correo y LinkedIn reales. El correo se deja como placeholder a
   propósito — publicarlo es decisión de Mau, no mía. */
const CONTACTO = [
  { label: "correo", text: "tu@correo.com", href: "mailto:tu@correo.com" },
  { label: "github", text: "maugalcst", href: "https://github.com/maugalcst" },
  { label: "linkedin", text: "pendiente", href: null },
];

export default function AboutSection() {
  return (
    <section
      id="sobre-mi"
      className="about scroll-section scroll-section--after-4"
    >
      <div className="about__content scroll-target">
        <header className="about__title-band">
          <h2 className="about__title">Sobre mí</h2>
        </header>

        <div className="about__body">
          {PLACEHOLDER.map((line, i) => (
            <p key={i} className="about__line">
              {line}
            </p>
          ))}
        </div>

        {/* cierre: contacto. Última cosa del sitio, en mono y en voz
            baja — la sección ya dijo lo importante. */}
        <footer className="about__contact">
          <ul className="about__contact__list">
            {CONTACTO.map((c) => (
              <li key={c.label} className="about__contact__item">
                <span className="about__contact__label">{c.label}</span>
                {c.href ? (
                  <a href={c.href}>{c.text}</a>
                ) : (
                  <span className="about__contact__pending">{c.text}</span>
                )}
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </section>
  );
}
