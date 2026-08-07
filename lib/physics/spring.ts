import type { SpringParams } from './spring-config';

/**
 * Spring 1D con integración semi-implícita de Euler.
 *
 * La clave de "ser física y no animación": velocity y position se integran
 * al frame actual, de modo que si cambias el objetivo a mitad de vuelo el
 * objeto continúa desde su posición Y velocidad actuales — nunca reinicia.
 *
 *   a  = (-k·(x - target) - c·v) / m
 *   v += a·dt
 *   x += v·dt
 */
export class Spring {
  private _x: number;
  private _v: number = 0;
  private _target: number;
  private readonly p: SpringParams;

  constructor(initial: number, params: SpringParams) {
    this._x = initial;
    this._target = initial;
    this.p = params;
  }

  get x(): number {
    return this._x;
  }

  get velocity(): number {
    return this._v;
  }

  get target(): number {
    return this._target;
  }

  /** reemplaza el objetivo — redirige suavemente desde el estado actual. */
  setTarget(target: number): void {
    this._target = target;
  }

  /** salta instantáneamente al objetivo (para reduced-motion). */
  snap(target: number): void {
    this._target = target;
    this._x = target;
    this._v = 0;
  }

  /** fuerza el estado (p. ej. arrastre manual que override el spring). */
  setPosition(x: number, v: number = 0): void {
    this._x = x;
    this._v = v;
  }

  /** energía residual — útil para saber si el spring "está quieto". */
  get energy(): number {
    const posErr = this._target - this._x;
    return posErr * posErr + this._v * this._v;
  }

  /** integra un paso. devuelve true si quedó esencialmente asentado. */
  step(dt: number): boolean {
    const { mass, stiffness, damping } = this.p;
    if (mass <= 0) {
      this._x = this._target;
      this._v = 0;
      return true;
    }
    const a = (-stiffness * (this._x - this._target) - damping * this._v) / mass;
    this._v += a * dt;
    this._x += this._v * dt;
    return this.energy < 1e-8;
  }
}