'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Cursor.module.css';

/**
 * Cursor custom (cruz + circunferencia + coordenadas).
 * Solo desktop con puntero fino y sin prefers-reduced-motion.
 * La cruz sigue al puntero; la circunferencia lo persigue suavizado.
 * Los elementos son decorativos (aria-hidden) y nunca interfieren (pointer-events: none).
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const crossRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const state = useRef({ x: -100, y: -100, rx: -100, ry: -100, hover: false, inside: false });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setEnabled(true);
    document.body.classList.add('custom-cursor');

    let raf = 0;
    const loop = () => {
      const s = state.current;
      if (crossRef.current) {
        crossRef.current.style.opacity = s.inside ? '1' : '0';
        crossRef.current.style.transform = `translate(-50%,-50%) translate3d(${s.x}px,${s.y}px,0)`;
      }
      s.rx += (s.x - s.rx) * 0.22;
      s.ry += (s.y - s.ry) * 0.22;
      if (ringRef.current) {
        ringRef.current.style.opacity = s.inside ? '1' : '0';
        ringRef.current.style.transform = `translate(-50%,-50%) translate3d(${s.rx}px,${s.ry}px,0) scale(${s.hover ? 1.6 : 1})`;
      }
      if (coordRef.current) {
        coordRef.current.style.opacity = s.inside ? '1' : '0';
        coordRef.current.style.transform = `translate3d(${s.x + 16}px,${s.y + 18}px,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const s = state.current;
      s.x = e.clientX;
      s.y = e.clientY;
      if (coordRef.current) coordRef.current.textContent = `x:${e.clientX} y:${e.clientY}`;
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      state.current.hover = !!t?.closest('a, button, [role="button"], input, [tabindex]');
    };
    const onEnter = () => {
      state.current.inside = true;
    };
    const onLeave = () => {
      state.current.inside = false;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    document.documentElement.addEventListener('mouseenter', onEnter);
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.body.classList.remove('custom-cursor');
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className={styles.root}>
      <div ref={crossRef} className={styles.cross} />
      <div ref={ringRef} className={styles.ring} />
      <div ref={coordRef} className={styles.coords} />
    </div>
  );
}
