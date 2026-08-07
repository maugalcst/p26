import { Spring } from './spring';
import type { SpringParams } from './spring-config';

export interface CameraView {
  cx: number;
  cy: number;
  zoom: number;
}

/**
 * Cámara 2D con zoom, gobernada por 3 springs (cx, cy, zoom).
 * Se usa para la navegación focus/periferia: el nodo clickeado se centra y
 * el resto del mundo "pandea" alrededor porque la cámara se mueve — no se
 * recarga contenido.
 */
export class Camera {
  readonly cx: Spring;
  readonly cy: Spring;
  readonly zoom: Spring;

  constructor(
    params: SpringParams,
    zoomParams: SpringParams,
    start: CameraView = { cx: 0, cy: 0, zoom: 1 }
  ) {
    this.cx = new Spring(start.cx, params);
    this.cy = new Spring(start.cy, params);
    this.zoom = new Spring(start.zoom, zoomParams);
  }

  /** fija el objetivo de cámara — redirige suavemente desde el estado actual. */
  focus(cx: number, cy: number, zoom: number): void {
    this.cx.setTarget(cx);
    this.cy.setTarget(cy);
    this.zoom.setTarget(zoom);
  }

  /** salto instantáneo (reduced-motion). */
  snap(cx: number, cy: number, zoom: number): void {
    this.cx.snap(cx);
    this.cy.snap(cy);
    this.zoom.snap(zoom);
  }

  get view(): CameraView {
    return { cx: this.cx.x, cy: this.cy.x, zoom: this.zoom.x };
  }

  /** integra un frame; true si todo asentado. */
  step(dt: number): boolean {
    const a = this.cx.step(dt);
    const b = this.cy.step(dt);
    const c = this.zoom.step(dt);
    return a && b && c;
  }

  get energy(): number {
    return this.cx.energy + this.cy.energy + this.zoom.energy;
  }
}