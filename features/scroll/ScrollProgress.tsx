"use client";

import { useEffect } from "react";

/* Scroll virtual: bloquea el scroll real del navegador y mapea los
   eventos wheel/touch a un progreso 0..1 que se publica como
   --scroll-progress en <html>. Los elementos que quieran reaccionar
   al scroll (opacidad de secciones, revelado del nav) leen esa
   variable y nosotros no necesitamos pasar props por todo el árbol.

   El progreso se interpola con lerp para suavizar el movimiento: una
   ráfaga de wheel no produce saltos, sino una transición continua.
   El nav (#proyectos) anima el progreso a 1 con la misma curva. */
export default function ScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    let target = 0;
    let current = 0;
    let raf = 0;

    const setProgress = (v: number) => {
      root.style.setProperty("--scroll-progress", v.toFixed(4));
      root.setAttribute("data-progress", v.toFixed(3));
      /* mitad del recorrido: a partir de aquí el hero deja de recibir
         pointer-events (queda debajo de los proyectos en la misma celda
         del grid) y los proyectos vuelven a capturarlos. */
      root.classList.toggle("scroll-mid", v >= 0.5);
    };

    const tick = () => {
      // lerp hacia el target — factor bajo = más suave y pesado
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      setProgress(current);
      if (current !== target) raf = requestAnimationFrame(tick);
    };

    const move = (delta: number) => {
      target = Math.max(0, Math.min(1, target + delta));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // deltaY positivo = scroll hacia abajo. Factor 0.0035: una
      // rueda mecánica (~100px) mueve ~0.35 — 3 ruedas cubren el
      // recorrido entero. Un golpe de trackpad (~5px) mueve ~0.018,
      // suficiente para sentir progreso sin saltos bruscos.
      move(e.deltaY * 0.0035);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      touchStartY = y;
      e.preventDefault();
      move(delta * 0.005);
    };

    const onKey = (e: KeyboardEvent) => {
      const step = 0.12;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        move(step);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        move(-step);
      } else if (e.key === "Home") {
        e.preventDefault();
        target = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      } else if (e.key === "End") {
        e.preventDefault();
        target = 1;
        if (!raf) raf = requestAnimationFrame(tick);
      } else if (e.key === "Escape") {
        e.preventDefault();
        target = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };

    /* click en anchor (#proyectos) → animar a 1 sin preventDefault
       (deja que el navegador haga scroll-into-view, pero como el
       scroll real está bloqueado el efecto es solo el nuestro) */
    const onAnchorClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      const targetEl = id ? document.getElementById(id) : null;
      if (!targetEl) return;
      e.preventDefault();
      // índice de la sección: cualquier hijo directo de main en orden
      const sections = Array.from(
        document.querySelectorAll("main > section, main > header"),
      );
      const idx = sections.indexOf(targetEl);
      if (idx < 0) return;
      target = idx / Math.max(1, sections.length - 1);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("click", onAnchorClick, { capture: true });

    setProgress(0);

    const opts = { capture: true } as EventListenerOptions;
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, opts);
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("keydown", onKey, opts);
      document.removeEventListener("click", onAnchorClick, opts);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
