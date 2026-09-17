"use client";

import { useState } from "react";
import RevealTitle from "./RevealTitle";
import { useT } from "@/features/i18n/useLang";
import "./ProjectsSection.css";

// Mis proyectos. TODO: links y descripciones finales
const PROJECTS = [
  {
    id: "tnews",
    no: "01",
    title: "tnews",
    description: {
      es: "Briefing diario de noticias en la terminal. Scrapea fuentes configurables por XPath, resume con Ollama local y entrega el digest en una TUI de Terminal.Gui. Sin navegador, sin ruido.",
      en: "A daily news briefing in the terminal. It scrapes sources configured by XPath, summarizes them with a local Ollama model and delivers the digest in a Terminal.Gui TUI. No browser, no noise.",
    },
    stack: ["ASP.NET Core", "Ollama", "Terminal.Gui", "PostgreSQL"],
    url: "https://github.com/maugalcst/tnews",
    repo: "https://github.com/maugalcst/tnews",
  },
  {
    id: "draftagent",
    no: "02",
    title: "DraftAgent",
    description: {
      es: "Hub interno de QA en Epicor. Indexa tickets de Jira por label para asignarlos, darles seguimiento y, desde un link, generar drafts de WebdriverIO con contexto del proyecto.",
      en: "An internal QA hub at Epicor. It indexes Jira tickets by label to assign and track them and, from a single link, drafts WebdriverIO specs with the project's context.",
    },
    stack: ["WebdriverIO", "Jira", "GitHub Copilot"],
    url: null,
    repo: null,
  },
  {
    id: "dnslabapi",
    no: "03",
    title: "DnaLabApi",
    description: {
      es: "API REST para laboratorios de genética. Registra muestras de ADN, sigue su estado (recolección → análisis → archivo) y protege el acceso con JWT sobre MongoDB.",
      en: "A REST API for genetics labs. It registers DNA samples, tracks their state (collection → analysis → archive) and guards access with JWT over MongoDB.",
    },
    stack: ["ASP.NET Core", "MongoDB", "JWT", "Docker"],
    url: "https://github.com/maugalcst/DNALabApi",
    repo: "https://github.com/maugalcst/DNALabApi",
  },
  {
    id: "salones",
    no: "04",
    title: "Asignación de Salones",
    description: {
      es: "Plataforma web para FIME-UANL. Coordinadores reparten salones por materia, salón y semestre; maestros envían solicitudes que el sistema valida en tiempo real.",
      en: "A web platform for FIME-UANL. Coordinators assign classrooms by subject, room and semester; teachers send requests that the system validates in real time.",
    },
    stack: ["Next.js 15", "Prisma", "SQLite", "TypeScript"],
    url: "https://github.com/maugalcst/asignacion-salones",
    repo: "https://github.com/maugalcst/asignacion-salones",
  },
];

const UI = {
  titulo: { es: "Proyectos", en: "Projects" },
  verCaso: { es: "Ver caso ↗", en: "View case ↗" },
  codigo: { es: "Código ↗", en: "Code ↗" },
};

export default function ProjectsSection() {
  const t = useT();
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
          <h2 className="projects__title">{t(UI.titulo)}</h2>
        </header>

        <div className="projects__grid">
          <div className="projects__media">
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
            <p className="projects__detail__desc">{t(selected.description)}</p>
            <p className="projects__detail__stack">{selected.stack.join(" · ")}</p>
            {(selected.url || selected.repo) && (
              <p className="projects__detail__links">
                {selected.url && <a href={selected.url}>{t(UI.verCaso)}</a>}
                {selected.repo && <a href={selected.repo}>{t(UI.codigo)}</a>}
              </p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
