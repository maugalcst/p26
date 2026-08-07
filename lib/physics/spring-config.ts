/**
 * Parámetros de la simulación física de springs.
 * Todo se tunea aquí — nada de constantes inline en el render.
 */

export interface SpringParams {
  /** masa del objeto que se mueve */
  mass: number;
  /** rigidez (k) — qué tan "tenso" es el resorte */
  stiffness: number;
  /** amortiguación (c) — qué tan rápido se asienta */
  damping: number;
}

export interface MotionConfig {
  /** spring de la cámara (traducción x/y del mundo) */
  camera: SpringParams;
  /** spring del zoom de la cámara */
  cameraZoom: SpringParams;
  /** spring por-nodo para el escalado chip ⇄ punto */
  nodeScale: SpringParams;
  /** jitter ambiental de los nodos inactivos */
  jitter: {
    /** amplitud en px */
    amplitude: number;
    /** rango de frecuencias [min, max] por nodo */
    freqRange: [number, number];
  };
  /** fricción del drag manual (momento tras soltar) */
  drag: {
    /** fricción lineal (deceleración proporcional a v) */
    friction: number;
    /** umbral para detener el momentum (px/s) */
    stopThreshold: number;
  };
}

/** límites de escala: 1 = chip legible, dot = punto tenue de fondo */
export const SCALE_READABLE = 1;
export const SCALE_DOT = 0.12;

/**
 * Sensación por defecto.
 * Para tunear: cambia estos números, no el código de render.
 */
export const DEFAULT_CONFIG: MotionConfig = {
  camera: { mass: 1, stiffness: 120, damping: 20 },
  cameraZoom: { mass: 1, stiffness: 140, damping: 22 },
  nodeScale: { mass: 1, stiffness: 200, damping: 26 },
  jitter: { amplitude: 1.6, freqRange: [0.35, 1.1] },
  drag: { friction: 0.92, stopThreshold: 6 },
};

/** true si el usuario prefiere menos movimiento (configuración del SO). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** aquí se puede variar la config en runtime (p. ej. por reduced-motion). */
export function createMotionConfig(): MotionConfig {
  return {
    camera: { ...DEFAULT_CONFIG.camera },
    cameraZoom: { ...DEFAULT_CONFIG.cameraZoom },
    nodeScale: { ...DEFAULT_CONFIG.nodeScale },
    jitter: { ...DEFAULT_CONFIG.jitter },
    drag: { ...DEFAULT_CONFIG.drag },
  };
}