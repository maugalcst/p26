import { useEffect, type RefObject } from "react";

/* ====== Tunables — ajustar directo en VS Code ====== */

// Chase con spring (lag elástico sutil). Verificado por simulación:
// ζ≈0.79 → salto de 200px llega a ±2px en ~112ms, pause 208ms, overshoot 1.5px.
const SPRING_STIFFNESS = 0.001; // px/ms² por px de offset
const SPRING_FRICTION = 0.05; // amortiguación (por ms) — bajar = más rebote
const SETTLE_DIST = 0.4; // px — umbral para pausar el loop
const SETTLE_VEL = 0.15; // px/ms — umbral de velocidad para pausar
const MAX_DT = 32; // ms — clamp del delta entre frames

// Geometría de la cruz
const BAR_THICKNESS = 3.3; // grosor normal de cada barra
const BAR_THICKNESS_PEAK = 2.4; // mínimo durante el giro (adelgazamiento sutil)

// Compresión mientras el cursor está en movimiento
const CURSOR_SIZE_IDLE = 15; // px — tamaño "brazo a brazo" en reposo
const CURSOR_SIZE_MOVING = 14; // px — comprimido mientras se mueve

// Click izquierdo — giro 180° a la izquierda (acumulativo, se queda ahí)
const TWIST_STEP = -90; // grados por click
const TWIST_MS = 230; // duración total — casi instantáneo pero suave

// Click derecho — giro infinito
const SPIN_REVOLUTION_MS = 1000; // ~1.1s por vuelta completa

// Aburrimiento — cuando el cursor está quieto, juguetea solo
const BORED_IDLE_MS = 1400; // ms quieto antes de empezar a moverse
const BORED_TURN_MIN = 450; // duración mínima de cada giro juguetón
const BORED_TURN_MAX = 1200; // duración máxima
const BORED_PAUSE_MS = 350; // pausa entre giros
const BORED_ARC = 38; // grados máximos por giro (se elige aleatorio dentro de ±)
const BORED_RETURN_MS = 500; // al despertar, vuelve suave a la orientación "+"

/* ====== Math ====== */

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Mode = "idle" | "twist" | "spin";
type Twist = { t0: number; from: number; to: number; dur: number };
type Bored = { state: "turn" | "pause"; t0: number; from: number; to: number; dur: number } | null;

export function useRotatingCursor(
  areaRef: RefObject<HTMLElement | null>,
  crossRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const area = areaRef.current;
    const cross = crossRef.current;
    if (!area || !cross) return;

    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Estado de la simulación (fuera del árbol de React) */
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    let angle = 0;
    let mode: Mode = "idle";
    let twist: Twist | null = null;
    let lastTs = 0;
    let rafId = 0;
    let running = false;

    /* Aburrimiento + coordenadas */
    let lastActivity = performance.now(); // último movimiento (para aburrirse)
    let hasMoved = false;
    let bored: Bored = null;
    let trackingTimer = 0;
    let boredTimer = 0; // despierta el loop tras el rato de inactividad

    const startLoop = () => {
      if (running) return;
      running = true;
      lastTs = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    const stopLoop = () => {
      cancelAnimationFrame(rafId);
      running = false;
    };

    const cancelBoredTimer = () => {
      if (boredTimer) {
        clearTimeout(boredTimer);
        boredTimer = 0;
      }
    };

    const applyThickness = () => {
      let th = BAR_THICKNESS;
      if (mode === "twist" && twist) {
        const p = clamp((performance.now() - twist.t0) / twist.dur, 0, 1);
        const e = easeOutCubic(p);
        th = BAR_THICKNESS + (BAR_THICKNESS_PEAK - BAR_THICKNESS) * Math.sin(Math.PI * e);
      }
      cross.style.setProperty("--cursor-bar-thickness", `${th}px`);
    };

    /* Mientras el cursor está en movimiento: se comprime y el marco deja de estar cortado */
    const applyMotionState = (inMotion: boolean) => {
      cross.style.setProperty(
        "--cursor-size",
        `${inMotion ? CURSOR_SIZE_MOVING : CURSOR_SIZE_IDLE}px`
      );
      document.documentElement.classList.toggle("cursor-motion", inMotion);
    };

    /* Coordenadas — capa fija que NO rota: X siempre a la derecha, Y abajo.
       Visibles solo mientras la cruz está persiguiendo al mouse. */
    const coordLayer = area.querySelector<HTMLElement>(".cursor-coord-layer");
    const coordXEl = coordLayer?.querySelector<HTMLElement>(".cursor-coord--x") ?? null;
    const coordYEl = coordLayer?.querySelector<HTMLElement>(".cursor-coord--y") ?? null;
    let lastCoordX = -1;
    let lastCoordY = -1;
    const applyCoordLayer = (x: number, y: number) => {
      if (coordLayer) coordLayer.style.transform = `translate(${x}px, ${y}px)`;
    };
    const updateCoords = (x: number, y: number) => {
      applyCoordLayer(x, y);
      if (!coordXEl || !coordYEl) return;
      const rx = Math.round(x);
      const ry = Math.round(y);
      if (rx !== lastCoordX) {
        coordXEl.textContent = String(rx);
        lastCoordX = rx;
      }
      if (ry !== lastCoordY) {
        coordYEl.textContent = String(ry);
        lastCoordY = ry;
      }
    };

    const setTracking = (on: boolean) => {
      clearTimeout(trackingTimer);
      document.documentElement.classList.toggle("cursor-tracking", on);
      if (on && reduceMotion) {
        trackingTimer = window.setTimeout(() => setTracking(false), 160);
      }
    };

    /* Aburrimiento — función aparte: cuando lleva un rato quieto, el cursor
       gira a un ángulo aleatorio con easing suave, pausa, y vuelve a girar.
       Devuelve true mientras está jugueteando (para mantener el loop vivo). */
    const updateBoredom = (ts: number): boolean => {
      if (!hasMoved || mode !== "idle") {
        bored = null;
        return false;
      }
      const idleMs = ts - lastActivity;
      if (idleMs < BORED_IDLE_MS) {
        bored = null;
        return false;
      }
      if (!bored) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const arc = BORED_ARC * (0.35 + Math.random() * 0.65);
        bored = {
          state: "turn",
          t0: ts,
          from: angle,
          to: angle + dir * arc,
          dur: BORED_TURN_MIN + Math.random() * (BORED_TURN_MAX - BORED_TURN_MIN),
        };
      }
      if (bored.state === "turn") {
        const p = clamp((ts - bored.t0) / bored.dur, 0, 1);
        angle = bored.from + (bored.to - bored.from) * easeInOutCubic(p);
        if (p >= 1) {
          angle = bored.to;
          bored = { state: "pause", t0: ts, from: angle, to: angle, dur: BORED_PAUSE_MS };
        }
      } else if (ts - bored.t0 >= bored.dur) {
        bored = null; // en el próximo frame arranca un giro nuevo
      }
      return true;
    };

    const frame = (ts: number) => {
      const dt = Math.min(Math.max(ts - lastTs, 1), MAX_DT);
      lastTs = ts;

      if (mode === "spin") {
        angle = (angle + (360 / SPIN_REVOLUTION_MS) * dt) % 360;
      } else if (mode === "twist" && twist) {
        const p = clamp((ts - twist.t0) / twist.dur, 0, 1);
        angle = twist.from + (twist.to - twist.from) * easeOutCubic(p);
        if (p >= 1) {
          angle = twist.to;
          mode = "idle";
          twist = null;
        }
      }

      const boredActive = updateBoredom(ts);

      /* Spring de posición */
      if (target.x !== pos.x || target.y !== pos.y) {
        const ax = (target.x - pos.x) * SPRING_STIFFNESS - vel.x * SPRING_FRICTION;
        const ay = (target.y - pos.y) * SPRING_STIFFNESS - vel.y * SPRING_FRICTION;
        pos.x += vel.x * dt + 0.5 * ax * dt * dt;
        pos.y += vel.y * dt + 0.5 * ay * dt * dt;
        vel.x += ax * dt;
        vel.y += ay * dt;
        if (
          Math.abs(target.x - pos.x) < SETTLE_DIST &&
          Math.abs(target.y - pos.y) < SETTLE_DIST &&
          Math.abs(vel.x) < SETTLE_VEL &&
          Math.abs(vel.y) < SETTLE_VEL
        ) {
          pos.x = target.x;
          pos.y = target.y;
          vel.x = 0;
          vel.y = 0;
        }
      }

      cross.style.left = `${pos.x}px`;
      cross.style.top = `${pos.y}px`;
      cross.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      applyThickness();
      updateCoords(pos.x, pos.y);

      const chaseAlive =
        Math.abs(target.x - pos.x) >= SETTLE_DIST || Math.abs(target.y - pos.y) >= SETTLE_DIST;
      const inMotion = chaseAlive || mode !== "idle";
      applyMotionState(inMotion);
      setTracking(chaseAlive);

      if (mode === "idle" && !chaseAlive && !boredActive) {
        // El cursor se asentó: el loop se apaga, pero programamos el despertar
        // para que el "aburrimiento" pueda arrancar tras BORED_IDLE_MS quieto.
        if (hasMoved && !boredTimer) {
          boredTimer = window.setTimeout(() => {
            boredTimer = 0;
            startLoop();
          }, BORED_IDLE_MS);
        }
        stopLoop();
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };

    /* Feedback de click simplificado (solo prefers-reduced-motion) */
    let flashTimer = 0;
    const flashClick = () => {
      cross.classList.add("cursor-click-flash");
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => cross.classList.remove("cursor-click-flash"), 160);
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      cross.style.opacity = "1"; // visible desde el primer movimiento
      lastActivity = performance.now();
      hasMoved = true;
      cancelBoredTimer();

      // Si estaba jugueteando, despertarlo: volver suave a la orientación "+"
      if (bored && mode === "idle") {
        twist = { t0: performance.now(), from: angle, to: Math.round(angle / 90) * 90, dur: BORED_RETURN_MS };
        mode = "twist";
        bored = null;
      }

      if (reduceMotion) {
        // Seguimiento directo, sin lag de spring ni loop
        pos.x = target.x;
        pos.y = target.y;
        vel.x = 0;
        vel.y = 0;
        cross.style.left = `${pos.x}px`;
        cross.style.top = `${pos.y}px`;
        updateCoords(pos.x, pos.y);
        setTracking(true);
      } else {
        startLoop(); // reaviva el loop apenas el mouse se mueve
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      lastActivity = performance.now();
      cancelBoredTimer();
      if (e.button === 0) onLeftClick();
    };

    const onLeftClick = () => {
      if (reduceMotion) {
        flashClick();
        return;
      }
      if (mode === "spin") {
        // Frenar el giro infinito y volver a la orientación default (+):
        // aterrizar en el múltiplo de 90° más cercano (la cruz + se ve igual cada 90°).
        twist = { t0: performance.now(), from: angle, to: Math.round(angle / 90) * 90, dur: TWIST_MS };
      } else {
        // Giro normal: 180° a la izquierda, acumulativo, se queda ahí.
        twist = { t0: performance.now(), from: angle, to: angle + TWIST_STEP, dur: TWIST_MS };
      }
      mode = "twist";
      startLoop();
    };

    const onContextMenu = () => {
      lastActivity = performance.now();
      cancelBoredTimer();
      if (reduceMotion) return; // giro infinito desactivado con reduced-motion
      if (mode !== "twist") {
        angle = angle % 360;
        mode = "spin";
        startLoop();
      }
    };

    area.addEventListener("mousemove", onMove);
    area.addEventListener("mousedown", onMouseDown);
    area.addEventListener("contextmenu", onContextMenu);

    return () => {
      if (cross) cross.style.opacity = "0";
      document.documentElement.classList.remove("cursor-motion", "cursor-tracking");
      clearTimeout(trackingTimer);
      cancelBoredTimer();
      area.removeEventListener("mousemove", onMove);
      area.removeEventListener("mousedown", onMouseDown);
      area.removeEventListener("contextmenu", onContextMenu);
      clearTimeout(flashTimer);
      stopLoop();
    };
  }, [areaRef, crossRef]);
}