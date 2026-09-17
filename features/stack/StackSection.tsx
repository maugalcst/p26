"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./StackSection.css";

/* STACK: un bus. Los costados del marco se juntan en medio y forman la
   columna; a la izquierda cuelgan los lugares donde trabajé (fuentes) y a
   la derecha las tecnologías. Cada renglón es un filamento soldado a la
   columna por un extremo.

   Hardcoded por ahora — la fuente de verdad es el usuario.
   TODO: la lista de Epicor es provisional (salió de DraftAgent, que vive
   en Epicor); confirmar qué se puede publicar del trabajo interno. */
const TECH = [
  "Terminal.Gui",
  "Ollama",
  "PostgreSQL",
  "ASP.NET Core",
  "JWT",
  "MongoDB",
  "Docker",
  "Next.js",
  "TypeScript",
  "Prisma",
  "SQLite",
  "WebdriverIO",
  "Jira",
  "GitHub Copilot",
];

/* El orden de TECH agrupa las tecnologías de cada fuente, así los tramos
   que la energía recorre por la columna quedan cortos. */
const SOURCES = [
  { id: "tnews", name: "tnews", uses: ["Terminal.Gui", "Ollama", "PostgreSQL", "ASP.NET Core"] },
  { id: "dnalabapi", name: "DnaLabApi", uses: ["ASP.NET Core", "JWT", "MongoDB", "Docker"] },
  { id: "salones", name: "Asignación de Salones", uses: ["Next.js", "TypeScript", "Prisma", "SQLite"] },
  { id: "draftagent", name: "DraftAgent", uses: ["WebdriverIO", "Jira", "GitHub Copilot"] },
  { id: "epicor", name: "Epicor Software", uses: ["WebdriverIO", "Jira"] },
];

type Side = "src" | "tech";
type Key = `${Side}:${string}`;

/* Velocidad de la energía: milisegundos por pixel recorrido. Una sola
   velocidad para filamentos y columna, así el pulso se lee continuo. */
const FLOW_MS_PER_PX = 0.55;

/* Aire: resorte amortiguado por renglón. d es el desplazamiento vertical
   (px) del nodo, el extremo libre; el extremo pegado a la columna no se
   mueve porque el renglón gira alrededor de él. */
const AIR_STIFFNESS = 120; // 1/s² → ~1.7 Hz, un vaivén lento
const AIR_DAMPING = 7; // unas pocas oscilaciones y reposo
const AIR_GAIN = 1.8; // px/s de impulso por px de movimiento del cursor
const AIR_RADIUS = 30; // px: alcance vertical del "aire" alrededor del cursor
const AIR_MAX = 5; // px: tope del desplazamiento

function related(key: Key): Set<Key> {
  const cut = key.indexOf(":");
  const side = key.slice(0, cut) as Side;
  const id = key.slice(cut + 1);
  if (side === "src") {
    const src = SOURCES.find((s) => s.id === id);
    return new Set((src?.uses ?? []).map((t) => `tech:${t}` as Key));
  }
  return new Set(
    SOURCES.filter((s) => s.uses.includes(id)).map((s) => `src:${s.id}` as Key),
  );
}

export default function StackSection() {
  const listsRef = useRef<HTMLDivElement>(null);
  const segUpRef = useRef<HTMLSpanElement>(null);
  const segDownRef = useRef<HTMLSpanElement>(null);

  /* hover/foco manda; si no hay, se muestra la fijada con click */
  const [hovered, setHovered] = useState<Key | null>(null);
  const [pinned, setPinned] = useState<Key | null>(null);
  const active = hovered ?? pinned;
  const targets = active ? related(active) : null;

  const roleOf = (key: Key) => {
    if (!active) return "";
    if (key === active) return "stack__row--source";
    if (targets?.has(key)) return "stack__row--target";
    return "stack__row--dim";
  };

  /* Coreografía del flujo: mide dónde está cada renglón y publica los
     retrasos para que la energía salga del nodo fuente, recorra la
     columna y llegue a cada destino a velocidad constante. Corre antes
     del paint para que las animaciones arranquen con estos valores. */
  useLayoutEffect(() => {
    const lists = listsRef.current;
    const up = segUpRef.current;
    const down = segDownRef.current;
    if (!active || !lists || !up || !down) return;

    const rowOf = (key: Key) =>
      lists.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
    /* offsetTop/offsetWidth ignoran el giro del aire: geometría en reposo */
    const lineY = (row: HTMLElement) =>
      Math.round(row.offsetTop + (row.offsetHeight - 1) / 2);
    const filWidth = (row: HTMLElement) =>
      row.querySelector<HTMLElement>(".stack__fil")?.offsetWidth ?? 0;

    const targets = related(active);
    const source = rowOf(active);
    if (!source) return;
    const sy = lineY(source);
    const srcDur = Math.max(140, filWidth(source) * FLOW_MS_PER_PX);
    source.style.setProperty("--d", "0ms");
    source.style.setProperty("--flow", `${srcDur}ms`);
    source.style.setProperty("--n", "0ms");

    let minY = sy;
    let maxY = sy;
    targets.forEach((key) => {
      const row = rowOf(key);
      if (!row) return;
      const ty = lineY(row);
      minY = Math.min(minY, ty);
      maxY = Math.max(maxY, ty);
      const arrive = srcDur + Math.abs(ty - sy) * FLOW_MS_PER_PX;
      const dur = Math.max(100, filWidth(row) * FLOW_MS_PER_PX);
      row.style.setProperty("--d", `${arrive}ms`);
      row.style.setProperty("--flow", `${dur}ms`);
      row.style.setProperty("--n", `${arrive + dur}ms`);
    });

    /* dos tramos de columna que nacen en la fuente: uno sube, otro baja */
    up.style.top = `${minY}px`;
    up.style.height = `${sy - minY + 1}px`;
    up.style.setProperty("--d", `${srcDur}ms`);
    up.style.setProperty("--flow", `${(sy - minY) * FLOW_MS_PER_PX}ms`);
    down.style.top = `${sy}px`;
    down.style.height = `${maxY - sy + 1}px`;
    down.style.setProperty("--d", `${srcDur}ms`);
    down.style.setProperty("--flow", `${(maxY - sy) * FLOW_MS_PER_PX}ms`);

    /* la clase de flujo puede seguir puesta al pasar de una fuente a otra;
       reiniciar la animación a mano para que el pulso vuelva a salir */
    for (const seg of [up, down]) {
      seg.style.animation = "none";
      void seg.offsetWidth;
      seg.style.animation = "";
    }
  }, [active]);

  /* Aire: el cursor empuja los filamentos que pasa. Solo transform, un
     RAF vivo únicamente mientras algún renglón se mueve. */
  useEffect(() => {
    const lists = listsRef.current;
    if (!lists) return;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    type Spring = {
      el: HTMLElement;
      sign: 1 | -1; // izquierda gira al revés: su ancla está a la derecha
      top: number; // centro del renglón, relativo a .stack__lists
      x0: number; // tramo horizontal del renglón, relativo
      x1: number;
      anchor: number; // x del punto soldado a la columna, relativo
      lever: number; // largo del filamento: del ancla al nodo
      d: number;
      v: number;
    };
    let springs: Spring[] = [];
    let raf = 0;
    let last = 0;
    let px: number | null = null;
    let py = 0;

    const measure = () => {
      const center = lists.offsetWidth / 2;
      springs = Array.from(
        lists.querySelectorAll<HTMLElement>(".stack__row"),
      ).map((el) => {
        const isSrc = el.dataset.side === "src";
        const fil = el.querySelector<HTMLElement>(".stack__fil");
        const x0 = el.offsetLeft; // offsetParent del renglón: .stack__lists
        return {
          el,
          sign: isSrc ? -1 : 1,
          top: el.offsetTop + el.offsetHeight / 2,
          x0,
          x1: x0 + el.offsetWidth,
          anchor: center,
          lever: Math.max(24, (fil?.offsetWidth ?? 0) + 5),
          d: 0,
          v: 0,
        };
      });
    };

    const step = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
      last = t;
      let moving = false;
      for (const s of springs) {
        const a = -AIR_STIFFNESS * s.d - AIR_DAMPING * s.v;
        s.v += a * dt;
        s.d = Math.max(-AIR_MAX, Math.min(AIR_MAX, s.d + s.v * dt));
        if (Math.abs(s.d) > 0.02 || Math.abs(s.v) > 0.05) {
          moving = true;
          s.el.style.transform = `rotate(${(s.sign * s.d) / s.lever}rad)`;
        } else if (s.d !== 0 || s.v !== 0) {
          s.d = 0;
          s.v = 0;
          s.el.style.transform = "";
        }
      }
      raf = moving ? requestAnimationFrame(step) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (reduced.matches || !root.classList.contains("scroll-stack")) return;
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const box = lists.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      if (px === null || !springs.length) {
        measure();
        px = x;
        py = y;
        return;
      }
      const dx = x - px;
      const dy = y - py;
      px = x;
      py = y;
      let kicked = false;
      for (const s of springs) {
        if (x < s.x0 || x > s.x1) continue;
        const dist = Math.abs(y - s.top);
        if (dist > AIR_RADIUS) continue;
        const falloff = 1 - dist / AIR_RADIUS;
        /* palanca: cerca de la columna el filamento casi no cede */
        const along = Math.min(1, Math.abs(x - s.anchor) / s.lever);
        /* el cursor arrastra en su dirección vertical y, si cruza de
           lado, aparta el filamento de sí mismo */
        const away = y < s.top ? 1 : -1;
        s.v += (dy + Math.abs(dx) * 0.25 * away) * AIR_GAIN * falloff * along;
        s.v = Math.max(-90, Math.min(90, s.v));
        kicked = true;
      }
      if (kicked && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    const onLeave = () => {
      px = null;
    };
    const ro = new ResizeObserver(() => {
      springs = [];
    });
    ro.observe(lists);

    lists.addEventListener("pointermove", onMove);
    lists.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      lists.removeEventListener("pointermove", onMove);
      lists.removeEventListener("pointerleave", onLeave);
      springs.forEach((s) => (s.el.style.transform = ""));
    };
  }, []);

  /* Marco al entrar a STACK. El movimiento lo hace CSS (app/layout.css:
     los costados se juntan en medio y la inferior sale del viewport);
     aquí solo se resuelve la unión de las verticales. */
  useEffect(() => {
    const root = document.documentElement;
    let inside = root.classList.contains("scroll-stack");
    let anims: Animation[] = [];
    let mergeRaf = 0;

    /* Unión de los costados: las dos verticales terminan encimadas y,
       como la tinta del marco es semitransparente, la columna se vería
       al doble de oscura. Se apaga la derecha en el primer cuadro en que
       ambas coinciden — ni antes (se vería una sola línea viajando) ni
       después (se vería el oscurecimiento). Se mide cada frame en vez de
       usar un retraso fijo: con ease-out-expo el último pixel se cierra
       a distinta hora según el ancho del viewport y el punto de partida.
       Web Animations con fill "forwards": al salir de STACK se cancela y
       la línea vuelve al instante, sin la transición de opacidad del
       marco. */
    const merge = () => {
      const left = document.querySelector<HTMLElement>(".frame__left");
      const right = document.querySelector<HTMLElement>(".frame__right");
      if (!left || !right) return;
      const check = () => {
        const gap = Math.abs(
          left.getBoundingClientRect().left - right.getBoundingClientRect().left,
        );
        if (gap < 0.5) {
          mergeRaf = 0;
          anims.push(right.animate([{ opacity: 0 }], { duration: 0, fill: "forwards" }));
          return;
        }
        mergeRaf = requestAnimationFrame(check);
      };
      mergeRaf = requestAnimationFrame(check);
    };

    const obs = new MutationObserver(() => {
      const now = root.classList.contains("scroll-stack");
      if (now === inside) return;
      inside = now;
      cancelAnimationFrame(mergeRaf);
      mergeRaf = 0;
      anims.forEach((a) => a.cancel());
      anims = [];
      if (now) merge();
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    if (inside) merge(); // montado ya dentro de STACK
    return () => {
      obs.disconnect();
      cancelAnimationFrame(mergeRaf);
      anims.forEach((a) => a.cancel());
    };
  }, []);

  const rowProps = (key: Key, side: Side) => ({
    type: "button" as const,
    "data-key": key,
    "data-side": side,
    "aria-pressed": pinned === key,
    className: ["stack__row", roleOf(key)].filter(Boolean).join(" "),
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered((h) => (h === key ? null : h)),
    onFocus: () => setHovered(key),
    onBlur: () => setHovered((h) => (h === key ? null : h)),
    onClick: () => setPinned((p) => (p === key ? null : key)),
  });

  /* orden de brote: desde el cruce hacia los extremos */
  const fromHub = (i: number, n: number) =>
    ({ "--i": Math.abs(i - (n - 1) / 2) }) as CSSProperties;

  return (
    <section id="stack" className="stack scroll-section scroll-section--after-3">
      <div className="stack__content scroll-target">
        <header className="stack__title-band">
          <h2 className="stack__title">Stack</h2>
        </header>

        <div className="stack__bus">
          <div className="stack__captions" aria-hidden="true">
            <p className="stack__caption stack__caption--src">Dónde</p>
            <p className="stack__caption stack__caption--tech">Con qué</p>
          </div>

          <div
            ref={listsRef}
            className={active ? "stack__lists stack__lists--flowing" : "stack__lists"}
          >
            <ul className="stack__col stack__col--src" aria-label="Dónde">
              {SOURCES.map((s, i) => {
                const key = `src:${s.id}` as Key;
                return (
                  <li key={key} style={fromHub(i, SOURCES.length)}>
                    <button {...rowProps(key, "src")}>
                      <span className="stack__name">{s.name}</span>
                      <span className="stack__sr">, usa {s.uses.join(", ")}</span>
                      <span className="stack__node" aria-hidden="true" />
                      <span className="stack__fil" aria-hidden="true">
                        <span className="stack__fil__glow" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <ul className="stack__col stack__col--tech" aria-label="Con qué">
              {TECH.map((t, i) => {
                const key = `tech:${t}` as Key;
                const where = SOURCES.filter((s) => s.uses.includes(t)).map((s) => s.name);
                return (
                  <li key={key} style={fromHub(i, TECH.length)}>
                    <button {...rowProps(key, "tech")}>
                      <span className="stack__fil" aria-hidden="true">
                        <span className="stack__fil__glow" />
                      </span>
                      <span className="stack__node" aria-hidden="true" />
                      <span className="stack__name">{t}</span>
                      <span className="stack__sr">, usado en {where.join(", ")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* tramos de energía sobre la columna */}
            <span ref={segUpRef} className="stack__seg stack__seg--up" aria-hidden="true" />
            <span ref={segDownRef} className="stack__seg stack__seg--down" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
