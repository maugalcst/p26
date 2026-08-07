import { Camera } from './camera';
import { Spring } from './spring';
import type { MotionConfig } from './spring-config';
import { DEFAULT_CONFIG, SCALE_READABLE, SCALE_DOT } from './spring-config';
import { targetScale, type NodeRole } from './world';

export interface WorldNode {
  id: string;
  x: number;
  y: number;
}

export interface WorldView {
  cx: number;
  cy: number;
  zoom: number;
}

/**
 * Controlador del mundo focus/periferia (framework-free, testeable):
 * - una cámara (3 springs) que se mueve para centrar el nodo activo
 * - un spring de escala por nodo (chip ⇄ punto)
 * - momentum del pan manual con fricción
 * El subscriber del loop global llama a tick() y lee scaleOf/view.
 */
export class GraphWorld {
  readonly camera: Camera;
  private scales = new Map<string, Spring>();
  private readonly config: MotionConfig;
  private readonly worldNodes = new Map<string, { x: number; y: number }>();
  private bounds = { w: 0, h: 0 };

  // pan manual (momentum)
  private panVx = 0;
  private panVy = 0;
  private panning = false;

  constructor(nodes: WorldNode[], config: MotionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.camera = new Camera(config.camera, config.cameraZoom);
    for (const n of nodes) {
      this.worldNodes.set(n.id, { x: n.x, y: n.y });
      this.scales.set(n.id, new Spring(SCALE_READABLE, config.nodeScale));
    }
  }

  setBounds(w: number, h: number) {
    this.bounds = { w, h };
  }

  /**
   * Asigna roles y apunta objetivos de cámara + escalas.
   * focus = true cuando hay nodo activo (modo foco); si no, overview.
   */
  updateRoles(opts: {
    activeId: string | null;
    hoveredId: string | null;
    isNeighbor: (id: string, of: string) => boolean;
  }): void {
    const { activeId, hoveredId, isNeighbor } = opts;

    if (activeId) {
      // modo foco: activo legible, vecinos a media escala, resto a puntos
      const active = this.worldNodes.get(activeId);
      if (active) this.camera.focus(active.x, active.y, 1.6);
      for (const [id, s] of this.scales) {
        const role: NodeRole =
          id === activeId
            ? 'active'
            : id === hoveredId
              ? 'hovered'
              : isNeighbor(id, activeId)
                ? 'neighbor'
                : 'idle';
        s.setTarget(targetScale(role));
      }
    } else {
      // overview: todo legible, el hover simplemente resalta
      this.camera.focus(this.bounds.w / 2, this.bounds.h / 2, 1);
      for (const [id, s] of this.scales) {
        s.setTarget(targetScale(hoveredId === id ? 'hovered' : 'active'));
      }
    }
  }

  /** salto instantáneo (reduced-motion / montaje). */
  snap(): void {
    this.camera.snap(this.bounds.w / 2, this.bounds.h / 2, 1);
    for (const s of this.scales.values()) s.snap(targetScale('active'));
  }

  /** salto instantáneo a los OBJETIVOS actuales (respeta roles/foco). */
  snapToTargets(): void {
    this.camera.snap(
      this.camera.cx.target,
      this.camera.cy.target,
      this.camera.zoom.target
    );
    for (const s of this.scales.values()) s.snap(s.target);
  }

  scaleOf(id: string): number {
    return this.scales.get(id)?.x ?? SCALE_READABLE;
  }

  isDot(id: string): boolean {
    return this.scaleOf(id) <= SCALE_DOT + 1e-4;
  }

  get view(): WorldView {
    const { cx, cy, zoom } = this.camera.view;
    return { cx, cy, zoom };
  }

  /* ---------------- pan manual con momentum ---------------- */

  beginPan() {
    this.panning = true;
    this.panVx = 0;
    this.panVy = 0;
  }

  /** durante el drag: mueve la cámara y registra velocidad. */
  panBy(dxWorld: number, dyWorld: number, dt: number): void {
    const { cx, cy } = this.camera.view;
    this.camera.cx.setPosition(cx - dxWorld);
    this.camera.cy.setPosition(cy - dyWorld);
    if (dt > 0) {
      this.panVx = -dxWorld / dt;
      this.panVy = -dyWorld / dt;
    }
  }

	/** al soltar: el momentum sigue por inercia hasta frenar. */
	endPan() {
    this.panning = false;
    // fija el objetivo del spring en la posición actual para no "rebotar" a la anterior
    const v = this.camera.view;
    this.camera.cx.setTarget(v.cx);
    this.camera.cy.setTarget(v.cy);
  }

  /* ---------------- integración ---------------- */

  /**
   * Integra un frame. Devuelve el nº de springs con energía residual (vivos).
   * Además aplica el momentum del pan y el clamp de cámara dentro del mundo.
   */
  tick(dt: number): number {
    let alive = 0;

    // momentum del pan tras soltar (fricción)
    if (!this.panning) {
      const speed = Math.hypot(this.panVx, this.panVy);
      if (speed > this.config.drag.stopThreshold) {
        const nx = this.camera.cx.x + this.panVx * dt;
        const ny = this.camera.cy.x + this.panVy * dt;
        this.camera.cx.setPosition(nx);
        this.camera.cy.setPosition(ny);
        const f = this.config.drag.friction;
        this.panVx *= f;
        this.panVy *= f;
        alive += 1;
      } else {
        this.panVx = 0;
        this.panVy = 0;
      }
    }

    // cámara (spring)
    if (!this.camera.step(dt)) alive += 1;

    // springs por-nodo
    for (const s of this.scales.values()) {
      if (!s.step(dt)) alive += 1;
    }

    return alive;
  }
}
