"use client";

import { useEffect, useRef, useState } from "react";
import "./ExperienceSection.css";
import DitherField from "./DitherField";
import { useT, type Localized } from "@/features/i18n/useLang";

// Mi trayectoria. Cada entrada: un verso de entrada, dos párrafos cortos
// y las herramientas al pie
const EXPERIENCE: {
  id: string;
  period: Localized<string>;
  role: Localized<string>;
  company: string;
  lede: Localized<string>;
  body: Localized<string>[];
  tools: string[];
  terminalPath: string;
}[] = [
  {
    id: "epicor-qa",
    period: { es: "2026 — Presente", en: "2026 — Present" },
    role: { es: "QA Automation Developer", en: "QA Automation Developer" },
    company: "@Epicor Software",
    lede: {
      es: "Mismo equipo, ahora de tiempo completo.",
      en: "Same team, now full time.",
    },
    body: [
      {
        es: "Sigo automatizando, pero ahora pruebo las stories de funcionalidades nuevas: regresiones en UI y validaciones de backend con Postman, Newman y Bruno, leyendo Swagger y OpenAPI hasta entender las reglas de negocio de verdad.",
        en: "I still automate, but now I test the stories behind new features: UI regressions and backend validation with Postman, Newman and Bruno, reading Swagger and OpenAPI until the real business rules make sense.",
      },
      {
        es: "Migré la suite de WebdriverIO a Playwright con TypeScript y armé en .NET y Blazor un scraper que asigna tickets y sigue su estatus solo. Entre muchos otros proyectos.",
        en: "I migrated the suite from WebdriverIO to Playwright with TypeScript and built a ticket scraper in .NET and Blazor that handles assignments and status on its own. Among plenty of other projects.",
      },
    ],
    tools: ["Playwright", "TypeScript", "Postman", "Bruno", "OpenAPI", ".NET", "Blazor"],
    terminalPath: "~/trayectoria/epicor-qa",
  },
  {
    id: "epicor-intern",
    period: { es: "2025 — 2026", en: "2025 — 2026" },
    role: {
      es: "QA Automation Developer Intern",
      en: "QA Automation Developer Intern",
    },
    company: "@Epicor Software",
    lede: {
      es: "Entré como becario a mitad de la carrera y aprendí a automatizar casi desde cero.",
      en: "I joined as an intern halfway through my degree and learned automation pretty much from scratch.",
    },
    body: [
      {
        es: "Aprendí a automatizar con WebdriverIO, a trabajar tickets en Jira y Zephyr y a seguir un cambio por los pipelines de Azure DevOps. Escribí scripts híbridos con Axios contra la API y generadores de reportes en Python y Excel.",
        en: "I learned to automate with WebdriverIO, work tickets in Jira and Zephyr, and follow a change through Azure DevOps pipelines. I wrote hybrid scripts hitting the API with Axios and report generators in Python and Excel.",
      },
      {
        es: "Después llegaron los agentes: Rovo, MCP y, de ahí, DraftAgent. Muchos mini proyectos, muchos retos y un gran equipo, automatizando desde la UI gran parte del ERP COBRA Autocatalog.",
        en: "Then came the agents: Rovo, MCP and, out of that, DraftAgent. Lots of small projects, lots of challenges and a great team, automating a big part of the COBRA Autocatalog ERP from the UI.",
      },
    ],
    tools: ["WebdriverIO", "Jira", "Zephyr", "Azure DevOps", "Axios", "Python", "MCP"],
    terminalPath: "~/trayectoria/epicor-intern",
  },
  {
    id: "uanl-fime",
    period: { es: "2022 — 2026", en: "2022 — 2026" },
    role: { es: "Ingeniería de Software", en: "Software Engineering" },
    company: "@UANL FIME",
    lede: {
      es: "Diez semestres en FIME, entre clases, proyectos y el equipo de tenis.",
      en: "Ten semesters at FIME, between classes, projects and the tennis team.",
    },
    body: [
      {
        es: "Bases de datos, estándares de la industria, redes neuronales en notebooks de Python, hardware y microcontroladores. Un e-commerce para una perfumería, un hackatón y el equipo de tenis.",
        en: "Databases, industry standards, neural networks in Python notebooks, hardware and microcontrollers. An e-commerce site for a perfume shop, a hackathon and the tennis team.",
      },
      {
        es: "De proyecto final, el sistema de asignación de salones que hoy usa la facultad entre maestros, coordinadores y administradores, desde un servidor de FIME y con miras a toda la UANL. Me divertí mucho. Me gradúo en diciembre de 2026.",
        en: "For my capstone, the classroom assignment system the faculty now uses between teachers, coordinators and admins, running on a FIME server with plans to reach all of UANL. I had a lot of fun. I graduate in December 2026.",
      },
    ],
    tools: ["Python", "Next.js", "Prisma", "SQLite"],
    terminalPath: "~/trayectoria/uanl-fime",
  },
];

const UI = {
  titulo: { es: "Trayectoria", en: "Experience" },
  vacio: { es: "sin entrada activa", en: "no entry selected" },
};

export default function ExperienceSection() {
  const t = useT();
  const bandRef = useRef<HTMLElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(EXPERIENCE[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = selectedId
    ? (EXPERIENCE.find((e) => e.id === selectedId) ?? null)
    : null;

  const activeId = hoveredId ?? selectedId;

  // El cursor se oculta dentro de una card, salvo en la seleccionada:
  // ahí sigue visible.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(
      "cursor-dim",
      hoveredId !== null && hoveredId !== selectedId,
    );
    return () => root.classList.remove("cursor-dim");
  }, [hoveredId, selectedId]);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    const root = document.documentElement;
    const measure = () => {
      const el = bandRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      root.style.setProperty(
        "--title-bottom-y",
        `${Math.round(r.bottom)}px`,
      );

      const activeCard = document.querySelector<HTMLElement>(
        ".experience__card[aria-pressed=true]",
      );
      if (activeCard) {
        const cr = activeCard.getBoundingClientRect();
        root.style.setProperty(
          "--conn-y",
          `${Math.round(cr.top + cr.height / 2)}px`,
        );

        const wrap = activeCard.parentElement;
        const frame = wrap?.querySelector<HTMLElement>(
          ".experience__card-frame",
        );
        const panel = document.querySelector<HTMLElement>(
          ".experience__detail",
        );
        if (wrap && frame && panel) {
          const inset = parseFloat(getComputedStyle(frame).right) || 0;
          root.style.setProperty(
            "--conn-x-1",
            `${Math.round(wrap.getBoundingClientRect().right - inset)}px`,
          );
          root.style.setProperty(
            "--conn-x-2",
            `${Math.round(panel.getBoundingClientRect().left)}px`,
          );
        }
      }
    };
    const measureAfter = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(measure);
      });
    };

    const ro = new ResizeObserver(measureAfter);
    if (bandRef.current) ro.observe(bandRef.current);
    window.addEventListener("resize", measureAfter);
    window.addEventListener("scroll", measureAfter, { passive: true });

    const htmlObserver = new MutationObserver(measureAfter);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    measureAfter();

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
      htmlObserver.disconnect();
      window.removeEventListener("resize", measureAfter);
      window.removeEventListener("scroll", measureAfter);
    };
  }, [selectedId]);

  return (
    <section
      id="experiencia"
      className="experience scroll-section scroll-section--after-2"
    >
      <div className="experience__fill" aria-hidden="true" />

      {selected && (
        <span key={selected.id} className="experience__conn" aria-hidden="true">
          <span className="experience__conn__track" />
          <span className="experience__conn__lane">
            <span className="experience__conn__bit" />
          </span>
          <span className="experience__conn__node experience__conn__node--out" />
          <span className="experience__conn__node experience__conn__node--in" />
        </span>
      )}

      <div className="experience__content scroll-target">
        <header className="experience__title-band" ref={bandRef}>
          <h2 className="experience__title">{t(UI.titulo)}</h2>
        </header>

        <div className="experience__grid">
          <span className="experience__vline" aria-hidden="true" />
          <ol className="experience__cards">
            {EXPERIENCE.map((e) => {
              const isHovered = e.id === hoveredId;
              const isSelected = e.id === selectedId;
              return (
                <li
                  key={e.id}
                  className={[
                    "experience__card-wrap",
                    isHovered && "experience__card-wrap--hovered",
                    isSelected && "experience__card-wrap--selected",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button
                    type="button"
                    className="experience__card"
                    onMouseEnter={() => setHoveredId(e.id)}
                    onMouseLeave={() =>
                      setHoveredId((h) => (h === e.id ? null : h))
                    }
                    onFocus={() => setHoveredId(e.id)}
                    onBlur={() => setHoveredId((h) => (h === e.id ? null : h))}
                    onClick={() => setSelectedId((s) => (s === e.id ? null : e.id))}
                    aria-pressed={isSelected}
                  >
                    <span className="experience__card__period">{t(e.period)}</span>
                    <span
                      className={
                        e.id === "uanl-fime"
                          ? "experience__card__role experience__card__role--soft"
                          : "experience__card__role"
                      }
                    >
                      {t(e.role)}
                    </span>
                    <span className="experience__card__company">{e.company}</span>
                  </button>

                  <span className="experience__card-frame" aria-hidden="true" />
                </li>
              );
            })}
          </ol>

          <article className="experience__detail">
            <DitherField connected={selected !== null} />

            {selected ? (

              <div key={selected.id} className="experience__detail__content">
                <p className="experience__detail__lede">{t(selected.lede)}</p>
                <div className="experience__detail__body">
                  {selected.body.map((p, i) => (
                    <p key={i}>{t(p)}</p>
                  ))}
                  <p className="experience__detail__tools">
                    {selected.tools.join(" · ")}
                  </p>
                </div>
                <div className="experience__detail__terminal">
                  <span className="experience__detail__terminal__cmd">
                    <span className="experience__detail__terminal__user">
                      mau@port
                    </span>{" "}
                    <span className="experience__detail__terminal__path">
                      {selected.terminalPath}
                    </span>
                  </span>
                  <span
                    className="experience__detail__terminal__led"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : (
              <p className="experience__detail__empty">{t(UI.vacio)}</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
