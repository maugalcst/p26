"use client";

import { useEffect, useRef } from "react";

type Layer = {

  nombre: string;

  escala: number;

  deriva: [number, number];

  deformacion: number;

  desde: number;
  hasta: number;

  densidad: number;

  tono: number;

  conTexto: number;
  semilla: number;
};

// Las capas de la luz tramada: escala = tamaño de las manchas,
// densidad y tono = qué tan marcadas, conTexto = cuánto se ven con una card abierta
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

const CELL = 3;
const FPS = 12;

const GRID = 4;
const GRID_SHIFT = 2;

const LIGHT_MIN = 0.55;

const QUIET_SECONDS = 0.9;

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

const ROT_C = Math.cos(0.47);
const ROT_S = Math.sin(0.47);

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

    let gw = 0;
    let gh = 0;
    let fields: Float32Array[] = [];

    let lightMap = new Float32Array(0);
    let raf = 0;
    let lastDraw = 0;
    let lastTick = 0;

    let quiet = connectedRef.current ? 1 : 0;

    const readInk = () => {
      ink = toRGB(getComputedStyle(canvas).color);
    };

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

          blockLayers.length = 0;
          for (let k = 0; k < active.length; k++) {
            const f = active[k].field;
            const peak = Math.max(f[o], f[o + 1], f[o + gw], f[o + gw + 1]);
            if (peak > active[k].L.desde) blockLayers.push(active[k]);
          }
          if (!blockLayers.length) continue;

          for (let y = y0; y < y1; y++) {
            const ty = (y - y0) * inv;
            const by = (y & 7) << 3;
            for (let x = x0; x < x1; x++) {
              const tx = (x - x0) * inv;
              const threshold = BAYER8[by | (x & 7)];
              const light = lightMap[y * cols + x];

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

    const mo = new MutationObserver((records) => {
      if (records.some((rec) => rec.attributeName === "data-theme")) {
        readInk();
        draw(performance.now());
      }
      kick();
    });

    readInk();
    resize();
    draw(performance.now());

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
