"use client";

import { useEffect, useRef, useState } from "react";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [9, 1, 11, 3],
  [13, 5, 15, 7],
];

const W = 180;
const H = 130;
const FPS = 12;

/* Cuántos pulsos pueden estar vivos a la vez. Más = más denso. */
const MAX_PULSES = 7;
/* Cada cuántos cuadros nace uno nuevo (rango). */
const SPAWN_MIN = 9;
const SPAWN_MAX = 20;

type Pulse = {
  x: number;
  y: number;
  born: number;
  speed: number;
  life: number;
  thick: number;
  amp: number;
};

export default function DitherField({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const mo = new MutationObserver(() => setThemeTick((n) => n + 1));
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    /* El color se resuelve pintándolo y leyéndolo de vuelta, así
       funciona con cualquier formato de CSS (color-mix, oklch...). */
    ctx.fillStyle = getComputedStyle(canvas).color;
    ctx.fillRect(0, 0, 1, 1);
    const px = ctx.getImageData(0, 0, 1, 1).data;
    const R = px[0];
    const G = px[1];
    const B = px[2];
    ctx.clearRect(0, 0, W, H);

    const img = ctx.createImageData(W, H);
    const data = img.data;

    const pulses: Pulse[] = [];

    const spawn = (t: number) => {
      pulses.push({
        x: Math.random() * W,
        y: Math.random() * H,
        born: t,
        /* qué tan rápido se expande el anillo */
        speed: 14 + Math.random() * 32,
        /* cuánto vive, en unidades de t (≈ segundos) */
        life: 2.5 + Math.random() * 4,
        /* grosor del anillo en píxeles de canvas */
        thick: 2 + Math.random() * 30,
        amp: 0.55 + Math.random() * 0.45,
      });
    };

    const render = (t: number) => {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          /* Base casi vacía: solo un granulado muy tenue para que
             el campo nunca se vea completamente muerto. */
          let n = (Math.sin(x * 4.7 + y * 3.1) * 0.5 + 0.5) * 0.06;

          for (let p = 0; p < pulses.length; p++) {
            const pu = pulses[p];
            const age = t - pu.born;
            const radius = age * pu.speed;

            /* distancia Chebyshev → anillos cuadrados */
            const d = Math.max(Math.abs(x - pu.x), Math.abs(y - pu.y));

            const off = Math.abs(d - radius);
            if (off < pu.thick) {
              /* el anillo se desvanece conforme envejece */
              const fade = 1 - age / pu.life;
              n += pu.amp * (1 - off / pu.thick) * fade * fade;
            }
          }

          const i = (y * W + x) * 4;
          if (n > BAYER[y & 3][x & 3] / 16) {
            data[i] = R;
            data[i + 1] = G;
            data[i + 2] = B;
            data[i + 3] = 255;
          } else {
            data[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let last = 0;
    let t = 0;
    let frame = 0;
    let nextSpawn = 0;
    let visible = true;
    const interval = 1000 / FPS;

    const step = () => {
      t += 0.08;
      frame++;

      /* nace un pulso nuevo cada tantos cuadros */
      if (frame >= nextSpawn && pulses.length < MAX_PULSES) {
        spawn(t);
        nextSpawn =
          frame +
          SPAWN_MIN +
          Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN));
      }

      /* se retiran los que ya cumplieron su vida */
      for (let i = pulses.length - 1; i >= 0; i--) {
        if (t - pulses[i].born > pulses[i].life) pulses.splice(i, 1);
      }

      render(t);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < interval) return;
      last = now;
      step();
    };

    const start = () => {
      if (raf || reduced || paused || !visible) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* Estado inicial: unos cuantos pulsos ya en curso, para que la
       sección nunca aparezca en negro absoluto. */
    for (let i = 0; i < 3; i++) {
      spawn(t - Math.random() * 2);
    }
    render(t);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    start();

    return () => {
      stop();
      io.disconnect();
    };
  }, [paused, themeTick]);

  return (
    <canvas
      ref={canvasRef}
      className="experience__detail__bg"
      aria-hidden="true"
    />
  );
}