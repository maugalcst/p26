import type {
  RenderCategory,
  RenderGraphLink,
  RenderGraphNode,
} from '@/lib/graph/types';

/**
 * Layout jerárquico por niveles (dependency-graph style).
 * Nivel 0 educación → 1 skills → 2 proyectos → 3 experiencia.
 * Orden dentro de cada nivel por barycenter para minimizar cruces.
 */

export const LEVELS: RenderCategory[] = ['education', 'skill', 'project', 'experience'];

export function levelOf(c: RenderCategory): number {
  const i = LEVELS.indexOf(c);
  return i === -1 ? 0 : i;
}

/** Reordena ítems dentro de cada columna por barycenter (adicencia entre niveles). */
export function orderedLevels(nodes: RenderGraphNode[], links: RenderGraphLink[]): string[][] {
  const levels: string[][] = LEVELS.map(() => []);
  for (const n of nodes) levels[levelOf(n.category)].push(n.id);

  const adj = new Map<string, string[]>();
  const add = (a: string, b: string) => {
    let arr = adj.get(a);
    if (!arr) {
      arr = [];
      adj.set(a, arr);
    }
    arr.push(b);
  };
  for (const l of links) {
    add(l.source, l.target as string);
    add(l.target as string, l.source);
  }

  const bary = (li: number, lr: number) => {
    const order = levels[li];
    const ref = levels[lr];
    if (!ref.length) return;
    const refIdx = new Map<string, number>(ref.map((id, i) => [id, i]));
    const scored = order.map((id, i) => {
      const nb = (adj.get(id) ?? []).filter((x) => refIdx.has(x));
      if (!nb.length) return { id, score: Number.POSITIVE_INFINITY, i };
      const avg = nb.reduce((s, x) => s + (refIdx.get(x) ?? 0), 0) / nb.length;
      return { id, score: avg, i };
    });
    scored.sort((p, q) => (p.score === q.score ? p.i - q.i : p.score - q.score));
    levels[li] = scored.map((s) => s.id);
  };

  // alternanza L→R / R→L convergen en pocas pasadas
  for (let it = 0; it < 3; it++) {
    for (let li = 1; li < LEVELS.length; li++) bary(li, li - 1);
    for (let li = LEVELS.length - 2; li >= 0; li--) bary(li, li + 1);
  }
  return levels;
}

/* ---------------- geometría ---------------- */

export const CHIP_H = 36;

export interface Dim {
  w: number;
  h: number;
}

export function chipDims(label: string, meta: string): Dim {
  const lw = label.length * 7.2 + 38;
  const mw = meta.length * 6 + 38;
  return { w: Math.max(lw, mw, 64), h: CHIP_H };
}

export interface ColumnLayout {
  positions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
  /** x del canal vertical (riser) para una conexión entre a y b */
  riserX: (a: string, b: string) => number;
}

export function computeColumnLayout(
  levels: string[][],
  dims: Record<string, Dim>,
  viewW: number
): ColumnLayout {
  const gaps = LEVELS.length - 1;
  const colW = LEVELS.map((_, li) => Math.max(0, ...levels[li].map((id) => dims[id]?.w ?? 64)));

  const leftpad = 24;
  const rightpad = 24;
  const minGap = 64;
  const totalChip = colW.reduce((s, w) => s + w, 0);
  const gap = Math.max(minGap, (viewW - totalChip - leftpad - rightpad) / gaps);

  const centers: number[] = [];
  let cx = leftpad;
  for (let li = 0; li < LEVELS.length; li++) {
    centers.push(cx + colW[li] / 2);
    cx += colW[li] + gap;
  }
  const width = cx - gap + rightpad;

  const pitch = CHIP_H + 22;
  const colH = levels.map((l) => Math.max(1, l.length) * pitch);
  const maxH = Math.max(...colH);
  const height = maxH + 44;

  const positions: Record<string, { x: number; y: number }> = {};
  levels.forEach((ids, li) => {
    const colTop = 22 + (maxH - colH[li]) / 2 + pitch / 2;
    ids.forEach((id, j) => {
      positions[id] = { x: centers[li], y: colTop + j * pitch };
    });
  });

  const riserX = (a: string, b: string) => {
    const ia = levelIndex(a, levels);
    const ib = levelIndex(b, levels);
    if (ib > ia) return centers[ib] - colW[ib] / 2 - gap / 2;
    if (ib < ia) return centers[ib] + colW[ib] / 2 + gap / 2;
    return (positions[a].x + positions[b].x) / 2;
  };

  return { positions, width, height, riserX };
}

function levelIndex(id: string, levels: string[][]): number {
  for (let i = 0; i < levels.length; i++) if (levels[i].includes(id)) return i;
  return 0;
}

/* ---------------- metadata de chip (dato derivado, no decorativo) ---------------- */

const MONTHS: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

export function uptimeFrom(period?: string): string | null {
  if (!period) return null;
  const m = period.match(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i);
  const y = period.match(/\b(20\d{2})\b/);
  if (!m || !y) return null;
  const now = new Date();
  const start = new Date(Number(y[1]), MONTHS[m[1].toLowerCase()]);
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return `${Math.max(1, months)}mo`;
}

export function etaFrom(period?: string): string | null {
  if (!period) return null;
  const m = period.match(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b\s+(\d{4})/i);
  if (!m) return null;
  return `${m[1].toLowerCase()}-${m[2]}`;
}

export function nodeMeta(
  category: RenderCategory,
  period: string | undefined,
  degree: number
): string {
  switch (category) {
    case 'project':
      return `stack: ${degree}`;
    case 'skill':
      return `use: ${degree}`;
    case 'experience': {
      const u = uptimeFrom(period);
      return u ? `uptime: ${u}` : 'uptime: —';
    }
    case 'education': {
      const e = etaFrom(period);
      return e ? `eta: ${e}` : 'en curso';
    }
  }
}