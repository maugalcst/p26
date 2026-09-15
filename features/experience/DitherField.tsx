"use client";

import { useEffect, useRef } from "react";

/* =============================================================================
   DitherField — luz tramada en capas detrás del contenido del panel.

   Varias capas de nube, cada una con su tamaño, deriva, densidad y tono,
   tramadas en 1 bit (Bayer 8×8) con la tinta del tema. Todas comparten la
   misma matriz: los puntos de una capa clara caen sobre los de las más
   densas, así donde se enciman el mismo punto sale más oscuro, como tinta
   sobre tinta. (Con matrices desplazadas por capa aparecía moiré en
   diagonal.) Es un fondo para leer encima:
   sin acento, sin eventos, sin sobresaltos.

   Con una card seleccionada (connected) cada capa se retira según su
   `conTexto`: las más oscuras desaparecen, queda un rastro de neblina. La
   transición es por alfa (no por densidad), así se desvanece continua en
   vez de apagar puntos de golpe.

   Presupuesto: solo dibuja con TRAYECTORIA en pantalla (html.scroll-end) y
   la pestaña visible, a 12fps. El ruido se calcula en una retícula gruesa
   e interpola por celda; los bloques que ninguna capa alcanza se saltan y
   una capa con alfa 0 no se calcula. Nunca se
   reinicia: tema, tamaño y cambios de clase en <html> ajustan el estado
   existente. Con prefers-reduced-motion queda un único fotograma quieto.
   ========================================================================== */

type Layer = {
  /* solo para leer el código */
  nombre: string;
  /* tamaño de las formas, en celdas (grande = formas amplias y calmas) */
  escala: number;
  /* deriva en celdas/segundo [x, y] — direcciones distintas por capa hacen
     que las formas se crucen en vez de moverse en bloque */
  deriva: [number, number];
  /* 0..1: si > 0 la forma también se deforma sola, mezclando una segunda
     muestra que deriva en sentido contrario */
  deformacion: number;
  /* rango de la nube que se trama: bajo `desde` no hay nada, sobre `hasta`
     llega a la densidad máxima (borde suave entre ambos). Subir `desde` =
     formas más escasas y compactas */
  desde: number;
  hasta: number;
  /* densidad máxima de puntos (0..1) en el centro de la forma */
  densidad: number;
  /* qué tan oscuro es cada punto (0..1) */
  tono: number;
  /* multiplicador del tono con una card seleccionada (0 = desaparece) */
  conTexto: number;
  semilla: number;
};

const LAYERS: Layer[] = [
  {
    nombre: "nubes",
    escala: 84,
    deriva: [-0.28, 0.4],
    deformacion: 0.35,
    desde: 0.48,
    hasta: 0.92,
    densidad: 0.32,
    tono: 0.09,
    conTexto: 0.18,
    semilla: 57,
  },
  {
    /* grandes y de borde muy abierto (desde→hasta amplio): se leen como
       sombras suaves. Chicas y de borde corto parecían camuflaje */
    nombre: "manchas",
    escala: 60,
    deriva: [0.18, -0.1],
    deformacion: 0.5,
    desde: 0.56,
    hasta: 0.94,
    densidad: 0.7,
    tono: 0.20,
    conTexto: 0,
    semilla: 203,
  },
];

/* lado de cada celda en px CSS — entero para que el escalado sea exacto */
const CELL = 3;
const FPS = 12;

/* El ruido se calcula en una retícula gruesa (cada GRID celdas) y se
   interpola por celda. Las formas miden decenas de celdas, así que la
   diferencia es invisible y el costo baja ~16×. Potencia de 2 (se usa >>). */
const GRID = 4;
const GRID_SHIFT = 2;

/* luz: las capas pesan LIGHT_MIN arriba a la izquierda y 1 abajo a la
   derecha, lejos de donde empieza a leerse el panel */
const LIGHT_MIN = 0.55;

/* segundos que tarda en retirarse (o volver) al cambiar de estado */
const QUIET_SECONDS = 0.9;

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
function hash(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/* dominio rotado ~27°: alineado a los ejes, el ruido de valor deja rombos
   y cruces siguiendo la retícula del hash */
const ROT_C = Math.cos(0.47);
const ROT_S = Math.sin(0.47);

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
  /* el efecto principal no depende de props (no se reinicia); lee esto */
  const connectedRef = useRef(connected);
  connectedRef.current = connected;

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
    /* retícula gruesa: una por capa, (gw × gh) muestras de ruido */
    let gw = 0;
    let gh = 0;
    let fields: Float32Array[] = [];
    /* luz por celda y posición en la retícula gruesa, precalculadas */
    let lightMap = new Float32Array(0);
    let raf = 0;
    let lastDraw = 0;
    let lastTick = 0;
    /* 0 = panel vacío, 1 = card seleccionada; se acerca al objetivo en el
       tiempo de QUIET_SECONDS */
    let quiet = connectedRef.current ? 1 : 0;

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
      gw = (cols >> GRID_SHIFT) + 2;
      gh = (rows >> GRID_SHIFT) + 2;
      fields = LAYERS.map(() => new Float32Array(gw * gh));
      lightMap = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          lightMap[y * cols + x] =
            LIGHT_MIN + (1 - LIGHT_MIN) * (x / cols + y / rows) * 0.5;
        }
      }
    };

    const draw = (now: number) => {
      if (!img) return;
      const data = img.data;
      const t = now / 1000;
      const [r, g, b] = ink;

      /* capas activas de este frame (alfa 0 = no se calcula) y su ruido en
         la retícula gruesa */
      const active: {
        L: Layer;
        field: Float32Array;
        span: number;
        alpha: number;
      }[] = [];
      for (let k = 0; k < LAYERS.length; k++) {
        const L = LAYERS[k];
        const alpha = L.tono * (1 + (L.conTexto - 1) * quiet);
        if (alpha <= 0.002) continue;
        const field = fields[k];
        const inv = 1 / L.escala;
        const ox = t * L.deriva[0];
        const oy = t * L.deriva[1];
        for (let gy = 0; gy < gh; gy++) {
          const py = (gy * GRID + oy) * inv;
          for (let gx = 0; gx < gw; gx++) {
            const px = (gx * GRID + ox) * inv;
            const u = px * ROT_C - py * ROT_S;
            const v = px * ROT_S + py * ROT_C;
            let n = valueNoise(u, v, L.semilla);
            if (L.deformacion > 0) {
              /* segunda muestra que deriva al revés: al cruzarse, la forma
                 cambia en vez de solo desplazarse */
              const m = valueNoise(
                v * 1.3 - ox * inv * 2,
                u * 1.3 - oy * inv * 2,
                L.semilla + 1,
              );
              n += (m - n) * L.deformacion * 0.5;
            }
            field[gy * gw + gx] = n;
          }
        }
        active.push({ L, field, span: L.hasta - L.desde, alpha });
      }

      const inv = 1 / GRID;
      const blockLayers: typeof active = [];
      data.fill(0);
      for (let gy = 0; gy < gh - 1; gy++) {
        const y0 = gy << GRID_SHIFT;
        if (y0 >= rows) break;
        const y1 = Math.min(rows, y0 + GRID);
        for (let gx = 0; gx < gw - 1; gx++) {
          const x0 = gx << GRID_SHIFT;
          if (x0 >= cols) break;
          const x1 = Math.min(cols, x0 + GRID);
          const o = gy * gw + gx;

          /* la interpolación nunca supera la esquina más alta del bloque:
             si ninguna esquina pasa `desde`, esa capa no pinta aquí */
          blockLayers.length = 0;
          for (let k = 0; k < active.length; k++) {
            const f = active[k].field;
            const peak = Math.max(f[o], f[o + 1], f[o + gw], f[o + gw + 1]);
            if (peak > active[k].L.desde) blockLayers.push(active[k]);
          }
          if (!blockLayers.length) continue; // bloque vacío (ya en 0)

          for (let y = y0; y < y1; y++) {
            const ty = (y - y0) * inv;
            const by = (y & 7) << 3;
            for (let x = x0; x < x1; x++) {
              const tx = (x - x0) * inv;
              const threshold = BAYER8[by | (x & 7)];
              const light = lightMap[y * cols + x];
              /* composición "over" de las capas encendidas: donde se
                 enciman, la tinta se acumula y el punto sale más oscuro */
              let clear = 1;
              for (let k = 0; k < blockLayers.length; k++) {
                const a = blockLayers[k];
                const f = a.field;
                const top = f[o] + (f[o + 1] - f[o]) * tx;
                const bot = f[o + gw] + (f[o + gw + 1] - f[o + gw]) * tx;
                let sv = (top + (bot - top) * ty - a.L.desde) / a.span;
                if (sv <= 0) continue;
                if (sv > 1) sv = 1;
                if (sv * sv * (3 - 2 * sv) * light * a.L.densidad > threshold) {
                  clear *= 1 - a.alpha;
                }
              }
              if (clear < 1) {
                const i = (y * cols + x) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = Math.round((1 - clear) * 255);
              }
            }
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
      const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0;
      lastTick = now;
      const target = connectedRef.current ? 1 : 0;
      const step = dt / QUIET_SECONDS;
      quiet = target > quiet ? Math.min(target, quiet + step) : Math.max(target, quiet - step);

      if (now - lastDraw >= 1000 / FPS - 2) {
        lastDraw = now;
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (raf || !canRun()) return;
      lastTick = 0;
      raf = requestAnimationFrame(frame);
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
      quiet = connectedRef.current ? 1 : 0;
      draw(performance.now());
      kick();
    };
    reduced.addEventListener("change", onReduced);
    /* sin loop (reduced-motion), el cambio de card llega por este evento y
       se aplica de inmediato, sin fundido */
    canvas.addEventListener("dither:redraw", onReduced);

    kick();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", kick);
      reduced.removeEventListener("change", onReduced);
      canvas.removeEventListener("dither:redraw", onReduced);
    };
  }, []);

  /* con reduced-motion el loop no corre: avisa al efecto de arriba para que
     aplique el nuevo estado y redibuje */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvasRef.current?.dispatchEvent(new Event("dither:redraw"));
    }
  }, [connected]);

  return (
    <canvas
      ref={canvasRef}
      className="experience__detail__bg"
      aria-hidden="true"
    />
  );
}
