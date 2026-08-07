import { describe, it, expect } from 'vitest';
import { GraphWorld } from './graph-world';
import { seedOf, jitterOffset, worldTransform } from './world';
import { SCALE_DOT, SCALE_READABLE } from './spring-config';

const NODES = [
  { id: 'a', x: 0, y: 0 },
  { id: 'b', x: 200, y: 100 },
  { id: 'c', x: 400, y: 300 },
];

function makeWorld() {
  const w = new GraphWorld(NODES);
  w.setBounds(1000, 800);
  return w;
}

describe('GraphWorld focus/periferia', () => {
  it('en modo foco centra el nodo activo y reduce los demás a puntos', () => {
    const w = makeWorld();
    w.updateRoles({ activeId: 'b', hoveredId: null, isNeighbor: () => false });
    for (let i = 0; i < 500; i++) w.tick(1 / 60);
    const v = w.view;
    expect(v.cx).toBeCloseTo(200, 0);
    expect(v.cy).toBeCloseTo(100, 0);
    expect(w.view.zoom).toBeCloseTo(1.6, 5);
    expect(w.scaleOf('b')).toBeCloseTo(SCALE_READABLE, 1);
    expect(w.scaleOf('a')).toBeCloseTo(SCALE_DOT, 1);
  });

  it('vecinos quedan a media escala (no a punto)', () => {
    const w = makeWorld();
    w.updateRoles({
      activeId: 'b',
      hoveredId: null,
      isNeighbor: (id, of) => of === 'b' && id === 'a',
    });
    for (let i = 0; i < 500; i++) w.tick(1 / 60);
    expect(w.scaleOf('a')).toBeCloseTo(0.55, 1);
    expect(w.scaleOf('c')).toBeCloseTo(SCALE_DOT, 1);
  });

  it('en overview todo queda legible', () => {
    const w = makeWorld();
    w.updateRoles({ activeId: null, hoveredId: null, isNeighbor: () => false });
    for (let i = 0; i < 100; i++) w.tick(1 / 60);
    expect(w.scaleOf('a')).toBeCloseTo(SCALE_READABLE, 1);
    expect(w.view.zoom).toBeCloseTo(1, 1);
  });

  it('tick devuelve 0 cuando todo asentado (loop puede dormir)', () => {
    const w = makeWorld();
    w.updateRoles({ activeId: null, hoveredId: null, isNeighbor: () => false });
    w.snap();
    expect(w.tick(1 / 60)).toBe(0);
  });

  it('momentum: endPan no rebota a la posición previa', () => {
    const w = makeWorld();
    w.updateRoles({ activeId: null, hoveredId: null, isNeighbor: () => false });
    w.beginPan();
    for (let i = 0; i < 20; i++) w.panBy(10, 5, 1 / 60);
    w.endPan();
    for (let i = 0; i < 60; i++) w.tick(1 / 60);
    // la cámara debe haberse alejado del centro por el pan
    expect(Math.hypot(w.view.cx - 500, w.view.cy - 400)).toBeGreaterThan(50);
  });

  it('snapToTargets salta a los objetivos fijados por updateRoles', () => {
    const w = makeWorld();
    w.updateRoles({ activeId: 'b', hoveredId: null, isNeighbor: () => false });
    w.snapToTargets();
    expect(w.view.cx).toBeCloseTo(NODES[1].x, 5);
    expect(w.view.cy).toBeCloseTo(NODES[1].y, 5);
    expect(w.view.zoom).toBeGreaterThan(1);
    expect(w.scaleOf('b')).toBe(SCALE_READABLE);
    expect(w.scaleOf('a')).toBe(SCALE_DOT);
  });
});

describe('world helpers', () => {
  it('seedOf es determinista y en [0,1)', () => {
    expect(seedOf('a')).toBe(seedOf('a'));
    expect(seedOf('a')).toBeGreaterThanOrEqual(0);
    expect(seedOf('a')).toBeLessThan(1);
  });

  it('jitterOffset es determinista y acotado por la amplitud', () => {
    const j = jitterOffset(0.5, 1, 2, 1);
    expect(Math.abs(j.x)).toBeLessThanOrEqual(2);
    expect(jitterOffset(0.5, 1, 2, 1)).toEqual(j);
  });

  it('worldTransform centra el punto mundo', () => {
    expect(worldTransform(800, 600, 100, 50, 2)).toBe(
      'translate(400 300) scale(2) translate(-100 -50)'
    );
  });
});