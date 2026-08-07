/**
 * Loop de física GLOBAL: un único requestAnimationFrame cuando hay springs
 * activos. Se detiene por completo cuando ninguno se mueve (no quema CPU en
 * idle). Cualquier spring "despierta" el loop y lo mantiene vivo mientras
 * tenga energía residual.
 */

interface Subscriber {
  /** integra un frame; devuelve cuántos springs siguen con energía (activos). */
  (dt: number): number;
}

const subscribers = new Set<Subscriber>();
let rafId: number | null = null;
let last = 0;
let reduced = false;

function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 1 / 30); // clamp: no saltar en tab-bg
  last = now;

  let alive = 0;
  for (const sub of subscribers) {
    alive += sub(dt);
  }

  if (alive > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    stop();
  }
}

function start() {
  if (rafId !== null || subscribers.size === 0) return;
  last = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/** despierta el loop (se llama desde los springs cuando cobran energía). */
export function wake() {
  if (!reduced) start();
}

/** registra un subscriber; devuelve la función de cleanup. */
export function subscribe(sub: Subscriber): () => void {
  subscribers.add(sub);
  return () => {
    subscribers.delete(sub);
    if (subscribers.size === 0) stop();
  };
}

/** reduced-motion global: corta la física y no permite despertarla. */
export function setReducedMotion(value: boolean) {
  reduced = value;
  if (value) {
    stop();
    subscribers.clear();
  } else {
    wake();
  }
}

export function isLoopRunning() {
  return rafId !== null;
}

export function activeSubscriberCount() {
  return subscribers.size;
}