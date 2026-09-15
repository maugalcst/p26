"use client";

import { useEffect, useRef } from "react";

/* =============================================================================
   DitherField — luz tramada detrás del contenido del panel.

   Una nube de luz muy grande que deriva despacio en diagonal, tramada en
   1 bit (Bayer 8×8) con la tinta del tema. Es un fondo para leer encima:
   sin acento, sin eventos, sin sobresaltos. Un poco más presente hacia la
   esquina inferior derecha, lejos de donde empieza a leerse el panel.

   Con una card seleccionada (connected) el campo se atenúa; eso lo hace el
   CSS con un fundido largo de opacidad sobre el elemento
   (.experience__detail__bg--quiet), así se desvanece como un todo en vez
   de apagar puntos sueltos.

   Presupuesto: solo dibuja con TRAYECTORIA en pantalla (html.scroll-end) y
   la pestaña visible, a 12fps. Nunca se reinicia: tema, tamaño y cambios de
   clase en <html> ajustan el estado existente. Con prefers-reduced-motion
   queda un único fotograma quieto.
   ========================================================================== */

/* lado de cada celda en px CSS — entero para que el escalado sea exacto */
const CELL = 3;
const FPS = 12;

/* nube: tamaño en celdas (grande = formas amplias y calmas) y deriva en
   celdas/segundo. Lento a propósito: cada punto del borde cambia cada un
   par de segundos, se lee como respiración y no como hormigueo */
const NOISE_SCALE = 46;
const DRIFT_X = 0.5;
const DRIFT_Y = 0.22;

/* tono: solo las zonas más claras de la nube llegan a tramarse, con un
   borde suave (smoothstep) y una densidad máxima baja */
const TONE_FROM = 0.44;
const TONE_TO = 0.92;
const MAX_DENSITY = 0.3;

/* luz: la nube pesa LIGHT_MIN arriba a la izquierda y 1 abajo a la derecha */
const LIGHT_MIN = 0.45;

/* alfa de cada punto (0..255) — la intensidad vive aquí y en la opacidad
   del elemento (CSS), nunca en la densidad */
const ALPHA = 64;

/* Bayer 8×8 como umbrales (i + 0.5) / 64, construido por recursión */
const BAYER8 = (() => {
  let m = [[0]];
  for (let n = 1; n < 8; n *= 2) {
    const next: number[][] = [];
    for (let y = 0; y < n * 2; y++) {
      next.push([]);
      for (let x = 0; x < n * 2; x++) {
        const q = [0, 2, 3, 1][(y < n ? 0 : 2) + (x < n ? 0 : 1)];
        next[y].push(m[y % n][x % n] * 4 + q);
      }
    }
    m = next;
  }
  const out = new Float32Array(64);
  for (let i = 0; i < 64; i++) out[i] = (m[i >> 3][i & 7] + 0.5) / 64;
  return out;
})();

type RGB = [number, number, number];

/* hash entero → [0, 1): barato y sin patrones visibles a esta escala */
function hash(ix: number, iy: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/* Dos octavas con el dominio rotado ~27°: una sola octava alineada a los
   ejes deja rombos y cruces siguiendo la retícula del hash. */
const ROT_C = Math.cos(0.47);
const ROT_S = Math.sin(0.47);
function fieldNoise(x: number, y: number) {
  const u = x * ROT_C - y * ROT_S;
  const v = x * ROT_S + y * ROT_C;
  return valueNoise(u, v) * 0.7 + valueNoise(v * 2 + 17.3, u * 2 - 9.1) * 0.3;
}

/* Resuelve cualquier color CSS (hex, color-mix, oklch…) pintándolo en un
   canvas de 1×1 y leyéndolo de vuelta. Canvas aparte para que el principal
   no necesite willReadFrequently (que le quita la aceleración). */
function toRGB(css: string): RGB {
  const probe = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!probe) return [0, 0, 0];
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

export default function DitherField({ connected }: { connected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let cols = 0;
    let rows = 0;
    let img: ImageData | null = null;
    let ink: RGB = [0, 0, 0];
    let raf = 0;
    let lastDraw = 0;

    const readInk = () => {
      ink = toRGB(getComputedStyle(canvas).color);
    };

    /* retícula = panel entero en celdas cuadradas; el canvas mide exactamente
       cols×CELL por rows×CELL y el panel recorta el sobrante (overflow) */
    const resize = () => {
      const r = host.getBoundingClientRect();
      const c = Math.max(1, Math.ceil(r.width / CELL));
      const rr = Math.max(1, Math.ceil(r.height / CELL));
      if (c === cols && rr === rows) return;
      cols = c;
      rows = rr;
      canvas.width = cols;
      canvas.height = rows;
      canvas.style.width = `${cols * CELL}px`;
      canvas.style.height = `${rows * CELL}px`;
      img = ctx.createImageData(cols, rows);
    };

    const draw = (now: number) => {
      if (!img) return;
      const data = img.data;
      const t = now / 1000;
      const ox = t * DRIFT_X;
      const oy = t * DRIFT_Y;
      const [r, g, b] = ink;
      const span = TONE_TO - TONE_FROM;
      const invCols = 1 / cols;
      const invRows = 1 / rows;

      for (let y = 0; y < rows; y++) {
        const by = (y & 7) << 3;
        const ny = (y + oy) / NOISE_SCALE;
        const lightY = y * invRows;
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const n = fieldNoise((x + ox) / NOISE_SCALE, ny);
          let s = (n - TONE_FROM) / span;
          if (s <= 0) {
            data[i + 3] = 0;
            continue;
          }
          if (s > 1) s = 1;
          const soft = s * s * (3 - 2 * s);
          const light = LIGHT_MIN + (1 - LIGHT_MIN) * (x * invCols + lightY) * 0.5;
          if (soft * light * MAX_DENSITY > BAYER8[by | (x & 7)]) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = ALPHA;
          } else {
            data[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const canRun = () =>
      !reduced.matches &&
      !document.hidden &&
      root.classList.contains("scroll-end");

    const frame = (now: number) => {
      raf = 0;
      if (!canRun()) return;
      if (now - lastDraw >= 1000 / FPS - 2) {
        lastDraw = now;
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && canRun()) raf = requestAnimationFrame(frame);
    };

    /* Cambios de clase en <html> (el cursor cambia varias por segundo) solo
       ARRANCAN el loop si hace falta; nunca tiran el estado. El tema sí
       vuelve a leer la tinta y redibuja. */
    const mo = new MutationObserver((records) => {
      if (records.some((rec) => rec.attributeName === "data-theme")) {
        readInk();
        draw(performance.now());
      }
      kick();
    });

    readInk();
    resize();
    draw(performance.now()); // visible desde el primer momento, aunque no corra

    mo.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(host);
    document.addEventListener("visibilitychange", kick);
    const onReduced = () => {
      draw(performance.now());
      kick();
    };
    reduced.addEventListener("change", onReduced);

    kick();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", kick);
      reduced.removeEventListener("change", onReduced);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={
        connected
          ? "experience__detail__bg experience__detail__bg--quiet"
          : "experience__detail__bg"
      }
      aria-hidden="true"
    />
  );
}
