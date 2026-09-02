"use client";

import { useEffect, useRef, useState } from "react";
import "./ExperienceSection.css";
import DitherField from "./DitherField";

/* Datos de TRAYECTORIA. Hardcoded por ahora — la fuente de verdad es el
   usuario. id sirve para identificar la tarjeta seleccionada.

   Modelo del detail (columna derecha):
   - state vacío (sin tarjeta): una frase intro corta centrada en gris.
     El fondo del detail es un video (lo pasa el usuario después).
   - state con tarjeta:
     * metrics: 2 cifras grandes con valor + label. Por ahora placeholder
       genérico (mismas cifras para las 3). Cuando lleguen datos reales
       se mueven al objeto de cada tarjeta.
     * description: párrafo de 2-3 líneas.
     * terminal: barra estilo shell con mau@port y path dinámico según
       la tarjeta. LED cuadrado del color del cursor a la derecha. */
const EXPERIENCE = [
  {
    id: "epicor-qa",
    period: "2026 — Present",
    role: "QA Automation Developer",
    company: "@Epicor Software",
    metrics: [
      { value: "6h", label: "ciclo de regresión [cifra de ejemplo]" },
      { value: "120", label: "casos automatizados cada PR" },
    ],
    description:
      "El equipo corría la regresión a mano antes de cada release. Construí la suite automatizada que hoy se ejecuta en cada pull request, y documenté el proceso para que el resto del equipo pudiera extenderla.",
    terminalPath: "~/trayectoria/epicor-qa",
  },
  {
    id: "epicor-intern",
    period: "2025 — 2026",
    role: "QA Automation Developer Intern",
    company: "@Epicor Software",
    metrics: [
      { value: "6h", label: "ciclo de regresión [cifra de ejemplo]" },
      { value: "120", label: "casos automatizados cada PR" },
    ],
    description:
      "Comencé como becario automatizando regresiones manuales del equipo de plataforma.",
    terminalPath: "~/trayectoria/epicor-intern",
  },
  {
    id: "uanl-fime",
    period: "2022 — 2026",
    role: "Ingeniería de Software",
    company: "@UANL FIME",
    metrics: [
      { value: "6h", label: "ciclo de regresión [cifra de ejemplo]" },
      { value: "120", label: "casos automatizados cada PR" },
    ],
    description:
      "Carrera profesional en la Facultad de Ingeniería Mecánica y Eléctrica. Graduación diciembre 2026.",
    terminalPath: "~/trayectoria/uanl-fime",
  },
];

const EMPTY_INTRO =
  "Selecciona una entrada";

export default function ExperienceSection() {
  const bandRef = useRef<HTMLElement>(null);
  /* null = estado vacío (intro centrada en gris). El usuario entra a
     TRAYECTORIA y ve la invitación a seleccionar. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = selectedId
    ? (EXPERIENCE.find((e) => e.id === selectedId) ?? null)
    : null;
  /* El wrapper de cursor se muestra en la tarjeta hovered o, si no hay
     hover ni selección, NO se muestra (estado vacío). */
  const activeId = hoveredId ?? selectedId;

  /* Publica la coordenada Y del borde inferior del title-band (en el
     viewport) como --title-bottom-y en :root. La usa el marco para
     subir su línea inferior hasta la base del título cuando TRAYECTORIA
     está visible (html.scroll-end).

     Además, cuando hay tarjeta seleccionada, publica --conn-y-1 y
     --conn-y-2 con las Y de las 2 líneas de conexión (a 1/4 y 3/4 de
     la altura de la card activa). Eso las mantiene alineadas cuando
     el usuario hace click en una card más grande o cambia el zoom.

     La primera medición se retrasa 2 RAF: cuando el componente monta,
     el scroll-virtual puede tener el .scroll-target con transform en
     pleno fade-in, así que getBoundingClientRect devuelve una posición
     stale (más arriba de la real). Esperar 2 frames garantiza que CSS
     haya aplicado el estado final. Además re-mide cuando html.scroll-end
     se activa/desactiva, por si el cambio de sección mueve el bloque. */
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
      /* Líneas de conexión: se posicionan a 1/4 y 3/4 de la card
         activa. Buscamos el botón con [aria-pressed=true] dentro de
         la grid. Si no hay selección, no publicamos nada (las líneas
         se desmontan en el JSX). */
      const activeCard = document.querySelector<HTMLElement>(
        ".experience__card[aria-pressed=true]",
      );
      if (activeCard) {
        const cr = activeCard.getBoundingClientRect();
        root.style.setProperty(
          "--conn-y-1",
          `${Math.round(cr.top + cr.height * 0.25)}px`,
        );
        root.style.setProperty(
          "--conn-y-2",
          `${Math.round(cr.top + cr.height * 0.75)}px`,
        );
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
    /* re-medir cuando TRAYECTORIA entra o sale del viewport, porque el
       scroll-virtual reposiciona el wrapper. observer se desuscribe
       en cleanup. */
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
      {/* El fill vive como hijo directo del section, NO del scroll-target.
          Si estuviera dentro del .scroll-target, su position: fixed se
          anclaría al scroll-target transformado y se vería en una
          posición incorrecta. Al estar aquí arriba, se ancla al viewport. */}
      <div className="experience__fill" aria-hidden="true" />

      {/* Líneas de conexión: 2 hairlines horizontales dashed naranjas
          que conectan el borde derecho de la tarjeta activa con el
          borde izquierdo del panel. Viven fuera del scroll-target
          (position: fixed → viewport). El JS publica --conn-y-1 y
          --conn-y-2 con la coordenada Y de cada línea. Solo visibles
          cuando hay tarjeta seleccionada. */}
      {selected && (
        <>
          <span className="experience__conn experience__conn--1" aria-hidden="true" />
          <span className="experience__conn experience__conn--2" aria-hidden="true" />
        </>
      )}

      <div className="experience__content scroll-target">
        <header className="experience__title-band" ref={bandRef}>
          <h2 className="experience__title">TRAYECTORIA</h2>
        </header>

        {/* Retícula 38/62 dividida por hairline vertical. La hairline
            (.experience__vline) vive como hija directa del section
            (fuera del scroll-target) por la misma razón que el fill:
            su position: fixed debe anclarse al viewport. */}
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
                    <span className="experience__card__period">{e.period}</span>
                    <span
                      className={
                        e.id === "uanl-fime"
                          ? "experience__card__role experience__card__role--soft"
                          : "experience__card__role"
                      }
                    >
                      {e.role}
                    </span>
                    <span className="experience__card__company">{e.company}</span>
                  </button>

                  <span className="experience__card-frame" aria-hidden="true" />
                </li>
              );
            })}
          </ol>

          {/* Wrapper del cursor: un div un poco más grande que la tarjeta
              activa (inset: -0.25rem), con borde y fill del cursor-color.
              pointer-events: none para no robar el click. Se posiciona
              con coordenadas absolutas calculadas en runtime (top/left
              via variables) — la tarjeta activa publica su posición
              relativa al grid, y el wrapper se monta como hijo del grid. */}

          {/* Detail (columna derecha):
              - Sin selección: intro centrada en gris sobre fondo video.
                El <video> está marcado hidden (display:none por CSS)
                mientras no haya src; el contenedor sigue mostrando el
                intro. Cuando el usuario pase el video, se quita el
                hidden.
              - Con selección: 2 cifras grandes, descripción y módulo
                terminal (path dinámico + LED del cursor-color). */}
          <article className="experience__detail">
            {/* Slot para el video de fondo del estado vacío. Por ahora
                el src es null; cuando el usuario lo pase, se actualiza
                y se quita hidden. */}
            <DitherField paused={!!selected} />

            {selected ? (
              <div className="experience__detail__content">
                <div className="experience__detail__metrics">
                  {selected.metrics.map((m, i) => (
                    <p key={i} className="experience__detail__metric">
                      <span className="experience__detail__metric__value">
                        {m.value}
                      </span>{" "}
                      <span className="experience__detail__metric__label">
                        {m.label}
                      </span>
                    </p>
                  ))}
                </div>
                <p className="experience__detail__desc">
                  {selected.description}
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
              <p className="experience__detail__empty">{EMPTY_INTRO}</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
