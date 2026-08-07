/**
 * Router ortogonal de trazas (estilo PCB).
 * Solo segmentos horizontales/verticales, con "vías" (puntos rellenos) en cada giro.
 * No depende del layout: recibe centros y dimensiones de chip y devuelve el path SVG.
 *
 * Modo 'h' (desktop): conexiones fluyen izquierda↔derecha (niveles como columnas).
 * Modo 'v' (mobile): conexiones fluyen arriba↔abajo (niveles como filas).
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RouteResult {
  /** comando SVG `d` para el <path> */
  d: string;
  /** coordenadas de las vías (giros de 90°) */
  vias: Array<[number, number]>;
}

export interface RouteOptions {
  /** x (modo h) o y (modo v) del riser/columna de subida */
  riser?: number;
  /** distancia del U-bend para conexiones del mismo nivel/fila */
  bend?: number;
}

export type TraceMode = 'h' | 'v';

export function orthogonalRoute(
  a: Box,
  b: Box,
  opts: RouteOptions = {},
  mode: TraceMode = 'h'
): RouteResult {
  const bend = opts.bend ?? 24;
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const ahw = a.w / 2;
  const ahh = a.h / 2;
  const bhw = b.w / 2;
  const bhh = b.h / 2;

  if (mode === 'h') {
    const overlap = bx - ax > -ahw - bhw && bx - ax < ahw + bhw;
    if (overlap) {
      // misma columna → U-bend por el lado derecho
      const xb = Math.max(ax + ahw, bx + bhw) + bend;
      return {
        d: `M ${ax + ahw} ${ay} H ${xb} V ${by} H ${bx - bhw}`,
        vias: [
          [xb, ay],
          [xb, by],
        ],
      };
    }
    if (bx > ax) {
      const r = opts.riser ?? (ax + ahw + bx - bhw) / 2;
      return {
        d: `M ${ax + ahw} ${ay} H ${r} V ${by} H ${bx - bhw}`,
        vias: [
          [r, ay],
          [r, by],
        ],
      };
    }
    const r = opts.riser ?? (ax - ahw + bx + bhw) / 2;
    return {
      d: `M ${ax - ahw} ${ay} H ${r} V ${by} H ${bx + bhw}`,
      vias: [
        [r, ay],
        [r, by],
      ],
    };
  }

  // modo vertical
  const overlap = by - ay > -ahh - bhh && by - ay < ahh + bhh;
  if (overlap) {
    // misma fila → U-bend por abajo
    const yb = Math.max(ay + ahh, by + bhh) + bend;
    return {
      d: `M ${ax} ${ay + ahh} V ${yb} H ${bx} V ${by - bhh}`,
      vias: [
        [ax, yb],
        [bx, yb],
      ],
    };
  }
  if (by > ay) {
    const r = opts.riser ?? (ay + ahh + by - bhh) / 2;
    return {
      d: `M ${ax} ${ay + ahh} V ${r} H ${bx} V ${by - bhh}`,
      vias: [
        [ax, r],
        [bx, r],
      ],
    };
  }
  const r = opts.riser ?? (ay - ahh + by + bhh) / 2;
  return {
    d: `M ${ax} ${ay - ahh} V ${r} H ${bx} V ${by + bhh}`,
    vias: [
      [ax, r],
      [bx, r],
    ],
  };
}
