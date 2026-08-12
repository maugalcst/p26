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
const BAR_THICKNESS = 2; // grosor normal de cada barra
const BAR_THICKNESS_PEAK = 1.4; // mínimo durante el giro (adelgazamiento sutil)

// Click izquierdo — giro 180° a la izquierda (acumulativo, se queda ahí)
const TWIST_STEP = -80; // grados por click
const TWIST_MS = 230; // duración total — casi instantáneo pero suave

// Click derecho — giro infinito
const SPIN_REVOLUTION_MS = 700; // ~1.1s por vuelta completa

/* ====== Math ====== */

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

type Mode = "idle" | "twist" | "spin";

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
    let twist: { t0: number; from: number; to: number } | null = null;
    let lastTs = 0;
    let rafId = 0;
    let running = false;

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

    const applyThickness = () => {
      let th = BAR_THICKNESS;
      if (mode === "twist" && twist) {
        const p = clamp((performance.now() - twist.t0) / TWIST_MS, 0, 1);
        const e = easeOutCubic(p);
        th = BAR_THICKNESS + (BAR_THICKNESS_PEAK - BAR_THICKNESS) * Math.sin(Math.PI * e);
      }
      cross.style.setProperty("--cursor-bar-thickness", `${th}px`);
    };

    const frame = (ts: number) => {
      const dt = Math.min(Math.max(ts - lastTs, 1), MAX_DT);
      lastTs = ts;

      if (mode === "spin") {
        angle = (angle + (360 / SPIN_REVOLUTION_MS) * dt) % 360;
      } else if (mode === "twist" && twist) {
        const p = clamp((ts - twist.t0) / TWIST_MS, 0, 1);
        angle = twist.from + (twist.to - twist.from) * easeOutCubic(p);
        if (p >= 1) {
          angle = twist.to;
          mode = "idle";
          twist = null;
        }
      }

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

      const chaseAlive =
        Math.abs(target.x - pos.x) >= SETTLE_DIST || Math.abs(target.y - pos.y) >= SETTLE_DIST;
      if (mode === "idle" && !chaseAlive) stopLoop();
      else rafId = requestAnimationFrame(frame);
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
      if (reduceMotion) {
        // Seguimiento directo, sin lag de spring ni loop
        pos.x = target.x;
        pos.y = target.y;
        vel.x = 0;
        vel.y = 0;
        cross.style.left = `${pos.x}px`;
        cross.style.top = `${pos.y}px`;
      } else {
        startLoop(); // reaviva el loop apenas el mouse se mueve
      }
    };

    const onMouseDown = (e: MouseEvent) => {
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
        twist = { t0: performance.now(), from: angle, to: Math.round(angle / 90) * 90 };
      } else {
        // Giro normal: 180° a la izquierda, acumulativo, se queda ahí.
        twist = { t0: performance.now(), from: angle, to: angle + TWIST_STEP };
      }
      mode = "twist";
      startLoop();
    };

    const onContextMenu = () => {
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
      area.removeEventListener("mousemove", onMove);
      area.removeEventListener("mousedown", onMouseDown);
      area.removeEventListener("contextmenu", onContextMenu);
      clearTimeout(flashTimer);
      stopLoop();
    };
  }, [areaRef, crossRef]);
}