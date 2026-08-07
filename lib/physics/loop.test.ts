import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  subscribe,
  wake,
  setReducedMotion,
  isLoopRunning,
  activeSubscriberCount,
} from './loop';

type FrameCb = (now: number) => void;

function stubRaf() {
  const queued: FrameCb[] = [];
  let rafId = 0;
  globalThis.requestAnimationFrame = (cb: FrameCb) => {
    queued.push(cb);
    rafId += 1;
    return rafId;
  };
  globalThis.cancelAnimationFrame = () => undefined;
  return {
    stepOnce(now = rafId) {
      if (queued.length === 0) throw new Error('no hay frame pendiente');
      const cb = queued.shift()!;
      cb(now);
    },
    pending() {
      return queued.length;
    },
  };
}

describe('loop global RAF (despierta/duerme)', () => {
  let raf: ReturnType<typeof stubRaf>;
  beforeEach(() => {
    raf = stubRaf();
    setReducedMotion(false);
  });
  afterEach(() => {
    setReducedMotion(true);
    delete (globalThis as Record<string, unknown>).requestAnimationFrame;
    delete (globalThis as Record<string, unknown>).cancelAnimationFrame;
  });

  it('subscribe NO arranca el loop por sí solo (hay que despertarlo)', () => {
    const un = subscribe(() => 0);
    expect(isLoopRunning()).toBe(false);
    un();
  });

  it('wake() arranca el loop y un tick que devuelve 0 lo duerme de nuevo', () => {
    subscribe(() => 0);
    expect(isLoopRunning()).toBe(false);
    wake();
    expect(isLoopRunning()).toBe(true);
    raf.stepOnce();
    expect(isLoopRunning()).toBe(false);
  });

  it('mientras un subscriber devuelva >0, el RAF sigue encolado', () => {
    subscribe(() => 5);
    wake();
    raf.stepOnce();
    expect(isLoopRunning()).toBe(true);
    expect(raf.pending()).toBe(1);
  });

  it('setReducedMotion(true) cancela y vacía subscribers', () => {
    subscribe(() => 9);
    wake();
    expect(activeSubscriberCount()).toBe(1);
    setReducedMotion(true);
    expect(isLoopRunning()).toBe(false);
    expect(activeSubscriberCount()).toBe(0);
  });
});
