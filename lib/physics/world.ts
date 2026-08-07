import { SCALE_DOT, SCALE_READABLE } from './spring-config';

/**
 * Cola pura de la capa de mundo: escala por-nodo, jitter y el transform de
 * la cámara. Sin React, sin DOM — testeable.
 */

export type NodeRole = 'active' | 'neighbor' | 'hovered' | 'idle';

/** escala objetivo de un nodo según su rol (focus/periferia). */
export function targetScale(role: NodeRole): number {
  switch (role) {
    case 'active':
    case 'hovered':
      return SCALE_READABLE; // 1 = chip legible
    case 'neighbor':
      return 0.55;
    case 'idle':
      return SCALE_DOT; // punto tenue de fondo
  }
}

/**
 * Jitter ambiental: desplazamiento determinista pequeño en px a partir de
 * un seed (hash del id). Debe ser una función pura de fase para no "saltar"
 * entre frames.
 */
export function jitterOffset(
  seed: number,
  t: number,
  amplitude: number,
  freq: number
): { x: number; y: number } {
  return {
    x: Math.sin(seed * 7.13 + t * freq) * amplitude,
    y: Math.sin(seed * 3.71 + t * freq * 0.83) * amplitude,
  };
}

/** tabla de seed estables a partir de un id (hash corto). */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295; // [0,1)
}

/**
 * String de transform de cámara SVG. Mapea el punto mundo (cx,cy) al centro
 * del viewport, escalado por `zoom`. El resto del grafo "pandea" alrededor
 * porque este transform se mueve, no los nodos.
 */
export function worldTransform(
  viewW: number,
  viewH: number,
  cx: number,
  cy: number,
  zoom: number
): string {
  return `translate(${viewW / 2} ${viewH / 2}) scale(${zoom}) translate(${-cx} ${-cy})`;
}

/** centro del mundo para la vista de resumen (overview). */
export function overviewCenter(viewW: number, viewH: number): { x: number; y: number } {
  return { x: viewW / 2, y: viewH / 2 };
}

export interface CameraTarget {
  cx: number;
  cy: number;
  zoom: number;
}

/** escala de zoom objetivo según si hay un nodo enfocado o es overview. */
export function cameraTarget(focused: boolean, focus?: { x: number; y: number }): CameraTarget {
  if (focused && focus) return { cx: focus.x, cy: focus.y, zoom: 1.6 };
  return { cx: 0, cy: 0, zoom: 1 };
}