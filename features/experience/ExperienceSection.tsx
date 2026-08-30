"use client";

/* EXPERIENCIA · placeholder visual
   Mismo lenguaje que el resto: header con título sans, hairline abajo,
   cards en columna con número + rol + empresa + tiempo + descripción.
   Por ahora los datos son placeholders. Se reemplazan cuando Mau los
   escriba. */
const EXPERIENCES = [
  {
    no: "01",
    role: "QA Automation Developer",
    company: "Epicor",
    period: "jun 2026 — presente",
    description:
      "Diseño y mantengo la suite de pruebas automatizadas del producto. WebdriverIO contra la app, integración con Jira y pipelines de CI.",
  },
  {
    no: "02",
    role: "Desarrollador fullstack",
    company: "—",
    period: "—",
    description: "Placeholder. Reemplazar con info real de Mau.",
  },
  {
    no: "03",
    role: "Becario / proyecto escolar",
    company: "FIME-UANL",
    period: "—",
    description: "Placeholder. Reemplazar con info real de Mau.",
  },
];

export default function ExperienceSection() {
  return (
    <section
      id="experiencia"
      className="experience scroll-section scroll-section--after-2"
    >
      <div className="experience__content scroll-target">
        <header className="experience__title-band">
          <h2 className="experience__title">EXPERIENCIA</h2>
        </header>

        <ol className="experience__list">
          {EXPERIENCES.map((e) => (
            <li key={e.no} className="experience__row">
              <span className="experience__row__no">{e.no}</span>
              <div className="experience__row__body">
                <p className="experience__row__role">{e.role}</p>
                <p className="experience__row__meta">
                  {e.company} · {e.period}
                </p>
                <p className="experience__row__desc">{e.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
