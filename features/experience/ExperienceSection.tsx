"use client";

import { useEffect, useRef, useState } from "react";
import "./ExperienceSection.css";
import DitherField from "./DitherField";
import { useT } from "@/features/i18n/useLang";

// Mi trayectoria. TODO: cambiar las métricas de ejemplo por cifras reales
const EXPERIENCE = [
  {
    id: "epicor-qa",
    period: { es: "2026 — Presente", en: "2026 — Present" },
    role: { es: "QA Automation Developer", en: "QA Automation Developer" },
    company: "@Epicor Software",
    metrics: [
      {
        value: "6h",
        label: {
          es: "ciclo de regresión [cifra de ejemplo]",
          en: "regression cycle [sample figure]",
        },
      },
      {
        value: "120",
        label: {
          es: "casos automatizados cada PR",
          en: "automated cases per PR",
        },
      },
    ],
    description: {
      es: "El equipo corría la regresión a mano antes de cada release. Construí la suite automatizada que hoy se ejecuta en cada pull request, y documenté el proceso para que el resto del equipo pudiera extenderla.",
      en: "The team ran regression by hand before every release. I built the automated suite that now runs on each pull request, and documented the process so the rest of the team could extend it.",
    },
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
    metrics: [
      {
        value: "6h",
        label: {
          es: "ciclo de regresión [cifra de ejemplo]",
          en: "regression cycle [sample figure]",
        },
      },
      {
        value: "120",
        label: {
          es: "casos automatizados cada PR",
          en: "automated cases per PR",
        },
      },
    ],
    description: {
      es: "Comencé como becario automatizando regresiones manuales del equipo de plataforma.",
      en: "I started as an intern automating the platform team's manual regressions.",
    },
    terminalPath: "~/trayectoria/epicor-intern",
  },
  {
    id: "uanl-fime",
    period: { es: "2022 — 2026", en: "2022 — 2026" },
    role: { es: "Ingeniería de Software", en: "Software Engineering" },
    company: "@UANL FIME",
    metrics: [
      {
        value: "6h",
        label: {
          es: "ciclo de regresión [cifra de ejemplo]",
          en: "regression cycle [sample figure]",
        },
      },
      {
        value: "120",
        label: {
          es: "casos automatizados cada PR",
          en: "automated cases per PR",
        },
      },
    ],
    description: {
      es: "Carrera profesional en la Facultad de Ingeniería Mecánica y Eléctrica. Graduación diciembre 2026.",
      en: "Degree at the Faculty of Mechanical and Electrical Engineering. Graduating December 2026.",
    },
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
                    onMouseEnter={() => {
                      setHoveredId(e.id);
                      document.documentElement.classList.add("cursor-dim");
                    }}
                    onMouseLeave={() => {
                      setHoveredId((h) => (h === e.id ? null : h));
                      document.documentElement.classList.remove("cursor-dim");
                    }}
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
                <div className="experience__detail__metrics">
                  {selected.metrics.map((m, i) => (
                    <p key={i} className="experience__detail__metric">
                      <span className="experience__detail__metric__value">
                        {m.value}
                      </span>{" "}
                      <span className="experience__detail__metric__label">
                        {t(m.label)}
                      </span>
                    </p>
                  ))}
                </div>
                <p className="experience__detail__desc">
                  {t(selected.description)}
                </p>
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
