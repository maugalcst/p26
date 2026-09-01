"use client";

import { useEffect, useRef } from "react";

/* Fondo tramado (dithering Bayer 4x4) para el estado vacío de
   TRAYECTORIA. Se dibuja en un canvas de baja resolución y se escala
   con image-rendering: pixelated, así que los "puntos" son píxeles
   reales del canvas, no una textura.

   El color de los puntos se hereda del CSS: el canvas lee su propio
   `color` computado, así que basta con poner
   `.experience__detail__bg { color: var(--frame-line) }` y el fondo
   se adapta solo al tema claro/oscuro.

   Corre a 12 fps a propósito: se ve más digital que a 60 y consume
   una fracción. Se detiene cuando `paused` es true (tarjeta
   seleccionada), cuando la sección sale del viewport, y cuando el
   usuario pidió menos movimiento. */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [9, 1, 11, 3],
  [13, 5, 15, 7],
];

/* Resolución interna del canvas. Más chico = puntos más grandes al
   escalar. 180x130 da un grano parecido a la referencia; bájalo a
   120x88 si quieres puntos más gordos. */
const W = 180;
const H = 130;
const FPS = 12;

export default function DitherField({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    /* color de los puntos, tomado del CSS del propio canvas */
    const computed = getComputedStyle(canvas).color.match(/\d+/g);
    const r = computed ? Number(computed[0]) : 255;
    const g = computed ? Number(computed[1]) : 255;
    const b = computed ? Number(computed[2]) : 255;

    const img = ctx.createImageData(W, H);
    const data = img.data;

    /* El campo de densidad. Aquí es donde vive el diseño: cambia esta
       función y cambia por completo el carácter del fondo.
       - solo senos      → ondas suaves
       - Math.random()   → estática pura
       - las bandas de abajo → los bloques rectangulares densos que
         tiene la referencia */
    const density = (x: number, y: number, t: number) => {
      let n =
        Math.sin(x * 0.055 + t * 0.6) * 0.25 +
        Math.cos(y * 0.07 - t * 0.4) * 0.25 +
        Math.sin((x + y) * 0.03 + t * 0.25) * 0.15 +
        0.18;

      /* bloques rectangulares: suben la densidad en zonas concretas */
      if (x > W * 0.62 && y < H * 0.3) n += 0.32;
      if (x > W * 0.78 && y > H * 0.55) n += 0.28;
      if (x < W * 0.12) n += 0.18;

      return n;
    };

    const render = (t: number) => {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (density(x, y, t) > BAYER[y & 3][x & 3] / 16) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
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
    let visible = true;
    const interval = 1000 / FPS;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < interval) return;
      last = now;
      t += 0.08;
      render(t);
    };

    const start = () => {
      if (raf || reduced || paused || !visible) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* un cuadro fijo siempre, para que nunca se vea vacío */
    render(0);

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
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="experience__detail__bg"
      aria-hidden="true"
    />
  );
}
