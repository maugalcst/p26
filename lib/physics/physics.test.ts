import { describe, it, expect } from 'vitest';
import { Camera } from './camera';
import { Spring } from './spring';
import { DEFAULT_CONFIG } from './spring-config';

describe('Spring (integración semi-implícita)', () => {
  it('asienta hacia el objetivo', () => {
    const s = new Spring(0, DEFAULT_CONFIG.nodeScale);
    s.setTarget(10);
    for (let i = 0; i < 400; i++) s.step(1 / 60);
    expect(s.x).toBeCloseTo(10, 1);
    expect(Math.abs(s.velocity)).toBeLessThan(0.05);
  });

  it('redirige a medio vuelo sin reiniciar desde cero', () => {
    const s = new Spring(0, DEFAULT_CONFIG.nodeScale);
    s.setTarget(50);
    // mover un buen rato hacia 50
    for (let i = 0; i < 90; i++) s.step(1 / 60);
    const mid = s.x;
    expect(mid).toBeGreaterThan(0);
    // cambio de objetivo: debe continuar desde la posición actual
    s.setTarget(-40);
    for (let i = 0; i < 60; i++) s.step(1 / 60);
    // no debe estar de vuelta en 0: siguió su ruta física
    expect(s.x).toBeLessThan(mid);
    expect(s.x).toBeCloseTo(-40, 0);
  });

  it('snap salta instantáneamente', () => {
    const s = new Spring(0, DEFAULT_CONFIG.nodeScale);
    s.snap(5);
    expect(s.x).toBe(5);
    expect(s.velocity).toBe(0);
  });

  it('converge hacia el objetivo en un número finito de pasos', () => {
    const s = new Spring(0, DEFAULT_CONFIG.camera);
    s.setTarget(100);
    let settled = false;
    for (let i = 0; i < 1000; i++) {
      if (s.step(1 / 60)) {
        settled = true;
        break;
      }
    }
    expect(settled).toBe(true);
  });
});

describe('Camera focus/periferia', () => {
  it('centra en un nodo con por springs separados', () => {
    const cam = new Camera(DEFAULT_CONFIG.camera, DEFAULT_CONFIG.cameraZoom);
    cam.focus(500, 300, 2.5);
    for (let i = 0; i < 500; i++) cam.step(1 / 60);
    expect(cam.cx.x).toBeCloseTo({ cx: 500 }.cx, 0);
    expect(cam.cy.x).toBeCloseTo(300, 0);
    expect(cam.zoom.x).toBeCloseTo(2.5, 1);
  });

  it('reemplazo de objetivo a mitad de animación se redirige suavemente', () => {
    const cam = new Camera(DEFAULT_CONFIG.camera, DEFAULT_CONFIG.cameraZoom);
    cam.focus(800, 400, 2);
    for (let i = 0; i < 60; i++) cam.step(1 / 60);
    const mid = cam.cx.x;
    expect(mid).toBeGreaterThan(0);
    cam.focus(50, 50, 0.5); // usuario hizo click en otro nodo antes de asentarse
    for (let i = 0; i < 60; i++) cam.step(1 / 60);
    expect(cam.cx.x).toBeLessThan(mid);
  });
});

describe('config constantes', () => {
  it('exporta parámetros sensatos', () => {
    const { camera, cameraZoom, nodeScale } = DEFAULT_CONFIG;
    for (const p of [camera, cameraZoom, nodeScale]) {
      expect(p.mass).toBeGreaterThan(0);
      expect(p.stiffness).toBeGreaterThan(0);
      expect(p.damping).toBeGreaterThan(0);
    }
  });
});