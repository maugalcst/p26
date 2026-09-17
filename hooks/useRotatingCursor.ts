import { useEffect, type RefObject } from "react";

const SPRING_STIFFNESS = 0.001;
const SPRING_FRICTION = 0.05;
const SETTLE_DIST = 0.4;
const SETTLE_VEL = 0.15;
const MAX_DT = 32;

const BAR_THICKNESS = 3.3;
const BAR_THICKNESS_PEAK = 3.1;

const CURSOR_SIZE_IDLE = 15;
const CURSOR_SIZE_MOVING = 15;

const TWIST_STEP = -180;
const TWIST_MS = 230;

const SPIN_REVOLUTION_MS = 1000;

const BORED_IDLE_MS = 2000;
const BORED_TURN_MIN = 450;
const BORED_TURN_MAX = 1200;
const BORED_PAUSE_MS = 350;
const BORED_ARC = 200;
const BORED_RETURN_MS = 500;

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

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    let angle = 0;
    let mode: Mode = "idle";
    let twist: Twist | null = null;
    let lastTs = 0;
    let rafId = 0;
    let running = false;

    let lastActivity = performance.now();
    let hasMoved = false;
    let bored: Bored = null;
    let trackingTimer = 0;
    let boredTimer = 0;

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

    const applyMotionState = (inMotion: boolean) => {
      cross.style.setProperty(
        "--cursor-size",
        `${inMotion ? CURSOR_SIZE_MOVING : CURSOR_SIZE_IDLE}px`
      );
      document.documentElement.classList.toggle("cursor-motion", inMotion);
    };

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
        bored = null;
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

      const inMotion = chaseAlive;
      applyMotionState(inMotion);
      setTracking(chaseAlive);

      if (mode === "idle" && !chaseAlive && !boredActive) {

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

    let flashTimer = 0;
    const flashClick = () => {
      cross.classList.add("cursor-click-flash");
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => cross.classList.remove("cursor-click-flash"), 160);
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      cross.style.opacity = "1";
      lastActivity = performance.now();
      hasMoved = true;
      cancelBoredTimer();

      if (bored && mode === "idle") {
        twist = { t0: performance.now(), from: angle, to: Math.round(angle / 90) * 90, dur: BORED_RETURN_MS };
        mode = "twist";
        bored = null;
      }

      if (reduceMotion) {

        pos.x = target.x;
        pos.y = target.y;
        vel.x = 0;
        vel.y = 0;
        cross.style.left = `${pos.x}px`;
        cross.style.top = `${pos.y}px`;
        updateCoords(pos.x, pos.y);
        setTracking(true);
      } else {
        startLoop();
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

        twist = { t0: performance.now(), from: angle, to: Math.round(angle / 90) * 90, dur: TWIST_MS };
      } else {

        twist = { t0: performance.now(), from: angle, to: angle + TWIST_STEP, dur: TWIST_MS };
      }
      mode = "twist";
      startLoop();
    };

    const onContextMenu = () => {
      lastActivity = performance.now();
      cancelBoredTimer();
      if (reduceMotion) return;
      if (mode !== "twist") {
        angle = angle % 360;
        mode = "spin";
        startLoop();
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("contextmenu", onContextMenu);

    return () => {
      if (cross) cross.style.opacity = "0";
      document.documentElement.classList.remove("cursor-motion", "cursor-tracking");
      clearTimeout(trackingTimer);
      cancelBoredTimer();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("contextmenu", onContextMenu);
      clearTimeout(flashTimer);
      stopLoop();
    };
  }, [areaRef, crossRef]);
}
