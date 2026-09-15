"use client";

import { useState } from "react";
import RevealTitle from "./RevealTitle";
import "./ProjectsSection.css";

/* TODO: descripciones, años y links reales los escribe Mau.
   Los títulos y stack vienen de data/content.ts. */
const PROJECTS = [
  {
    id: "tnews",
    no: "01",
    title: "tnews",
    description:
      "Briefing diario de noticias en la terminal. Scrapea fuentes configurables por XPath, resume con Ollama local y entrega el digest en una TUI de Terminal.Gui. Sin navegador, sin ruido.",
    stack: ["ASP.NET Core", "Ollama", "Terminal.Gui", "PostgreSQL"],
    url: "https://github.com/maugalcst/tnews",
    repo: "https://github.com/maugalcst/tnews",
  },
  {
    id: "draftagent",
    no: "02",
    title: "DraftAgent",
    description:
      "Hub interno de QA en Epicor. Indexa tickets de Jira por label para asignarlos, darles seguimiento y, desde un link, generar drafts de WebdriverIO con contexto del proyecto.",
    stack: ["WebdriverIO", "Jira", "GitHub Copilot"],
    url: null,
    repo: null,
  },
  {
    id: "dnslabapi",
    no: "03",
    title: "DnaLabApi",
    description:
      "API REST para laboratorios de genética. Registra muestras de ADN, sigue su estado (recolección → análisis → archivo) y protege el acceso con JWT sobre MongoDB.",
    stack: ["ASP.NET Core", "MongoDB", "JWT", "Docker"],
    url: "https://github.com/maugalcst/DNALabApi",
    repo: "https://github.com/maugalcst/DNALabApi",
  },
  {
    id: "salones",
    no: "04",
    title: "Asignación de Salones",
    description:
      "Plataforma web para FIME-UANL. Coordinadores reparten salones por materia, salón y semestre; maestros envían solicitudes que el sistema valida en tiempo real.",
    stack: ["Next.js 15", "Prisma", "SQLite", "TypeScript"],
    url: "https://github.com/maugalcst/asignacion-salones",
    repo: "https://github.com/maugalcst/asignacion-salones",
  },
];

/* La selección es interactiva: cada renglón del índice cambia el proyecto
   activo (texto del detalle y placeholder de la media). */
export default function ProjectsSection() {
  const [selectedId, setSelectedId] = useState(PROJECTS[0].id);
  const selected = PROJECTS.find((p) => p.id === selectedId) ?? PROJECTS[0];

  return (
    <section
      id="proyectos"
      className="projects scroll-section scroll-section--after"
    >
      <span className="projects__vline" aria-hidden="true" />

      <div className="projects__content scroll-target">
        <header className="projects__title-band">
          <h2 className="projects__title">Proyectos</h2>
        </header>

        <div className="projects__grid">
          <div className="projects__media">
            {/* TODO: imagen real del proyecto seleccionado.
               Mientras no hay imagen, mostramos el número del proyecto y su
               stack en esquinas opuestas (mismo lenguaje del resto). */}
            <div className="projects__placeholder">
              <span className="projects__placeholder__no">{selected.no}</span>
              <ul className="projects__placeholder__stack">
                {selected.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <ol className="projects__index">
            {PROJECTS.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={p.id === selected.id}
                  className={
                    p.id === selected.id
                      ? "projects__row projects__row--selected"
                      : "projects__row"
                  }
                  onClick={() => setSelectedId(p.id)}
                >
                  {i === 0 && (
                    <span
                      className="projects__row__top-hairline"
                      aria-hidden="true"
                    />
                  )}
                  <span className="projects__row__no">{p.no}</span>
                  <span className="projects__row__name">{p.title}</span>
                  {/* regla que se extiende: elemento propio porque los
                      ::before/::after del row ya dibujan las hairlines
                      divisorias (sólido ↔ trazos con cursor-motion). */}
                  <span className="projects__row__rule" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>

          <article className="projects__detail">
            <RevealTitle
              className="projects__detail__title"
              text={selected.title}
              revealKey={selected.id}
            />
            <p className="projects__detail__desc">{selected.description}</p>
            <p className="projects__detail__stack">{selected.stack.join(" · ")}</p>
            {(selected.url || selected.repo) && (
              <p className="projects__detail__links">
                {selected.url && <a href={selected.url}>Ver caso ↗</a>}
                {selected.repo && <a href={selected.repo}>Código ↗</a>}
              </p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}