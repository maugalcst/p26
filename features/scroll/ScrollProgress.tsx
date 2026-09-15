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
      /* projects visible durante su meseta [0.5, 0.85]. Arriba de 0.85,
         experience está entrando y projects debe ceder — la clase
         scroll-mid se apaga para que el contenido de projects se
         desvanezca. */
      root.classList.toggle("scroll-mid", v >= 0.5 && v < 0.85);
      /* experience entra a partir de p=0.9 (inicio de su meseta). */
      root.classList.toggle("scroll-end", v >= 0.9);
      /* hero en su meseta [0, 0.2]. Los elementos que solo deben
         reaccionar al cursor cuando el hero está en pantalla (marco,
         cotas) usan html.scroll-hero.cursor-motion en lugar de solo
         html.cursor-motion. Así no se "mueven" al pasar el cursor
         sobre projects o experience. */
      root.classList.toggle("scroll-hero", v < 0.2);
    };

    const tick = () => {
      // lerp hacia el target — factor bajo = más suave y pesado
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      setProgress(current);
      if (current !== target) {
        raf = requestAnimationFrame(tick);
      } else {
        // snap: resetear raf para que la próxima llamada a move()
        // pueda lanzar un nuevo tick. Sin esto, raf conserva el ID
        // del último frame y move() ve !raf === false y no arranca.
        raf = 0;
      }
    };

    const move = (delta: number) => {
      // cap en 0.7: el scroll-virtual solo controla hero↔projects.
      // A partir de ahí (el último 30% del recorrido), solo se llega
      // vía click en el nav. Evita que el usuario "salte" experience
      // por accidente con un wheel muy largo.
      target = Math.max(0, Math.min(0.7, target + delta));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    /* Mientras la intro de terminal está en pantalla no se scrollea.
       BootSequence marca html.booting mientras el overlay vive (incluido
       su fundido de salida). Sin esto, la tecla que el usuario pulsa
       para SALTAR el boot ("pulse cualquier tecla para entrar") cae
       también en onKey y arranca el sitio ya desplazado ~0.12. */
    const isBooting = () => root.classList.contains("booting");

    /* Salto instantáneo a un punto del recorrido. Es el ÚNICO camino
       para mover el progreso de golpe: cancela el lerp en curso y deja
       current y target sincronizados con lo que se pintó. Cualquier
       feature que quiera saltar (nav, teclado) despacha "scroll:goto"
       en vez de escribir --scroll-progress por su cuenta; si lo
       escribiera directo, este closure conservaría el valor viejo y el
       siguiente wheel daría un brinco. */
    let jumpTimer = 0;
    const jumpTo = (value: number) => {
      cancelAnimationFrame(raf);
      raf = 0;
      current = Math.max(0, Math.min(1, value));
      target = current;
      setProgress(current);
      // marca la transición de nav: las CSS rules de los wrappers
      // usan transition para hacer fade in/out entre secciones.
      root.classList.add("nav-jump");
      window.clearTimeout(jumpTimer);
      jumpTimer = window.setTimeout(() => root.classList.remove("nav-jump"), 700);
    };

    /* to: destino absoluto 0..1 · by: desplazamiento relativo al target
       interno (no al valor pintado, que va con lag por el lerp). */
    const onGoto = (e: Event) => {
      const d = (e as CustomEvent<{ to?: number; by?: number }>).detail ?? {};
      if (typeof d.to === "number") jumpTo(d.to);
      else if (typeof d.by === "number") jumpTo(target + d.by);
    };

    /* Si el target del wheel/touch está dentro de un contenedor con
       scroll vertical disponible, dejamos pasar el evento para que
       scrollee ese contenedor en vez de cambiar de sección. */
    const hasInternalScroll = (target: EventTarget | null): boolean => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        const style = getComputedStyle(el);
        const overflows =
          style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflowY === "overlay";
        if (overflows && el.scrollHeight > el.clientHeight + 1) {
          // hay contenido que no cabe. Si scrollear hacia abajo tiene
          // espacio, dejamos pasar; igual hacia arriba.
          const atTop = el.scrollTop <= 0;
          const atBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          return !(atTop && atBottom); // no hay a dónde scrollear
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (isBooting()) return;
      if (hasInternalScroll(e.target)) return; // deja pasar al contenedor
      e.preventDefault();
      // deltaY positivo = scroll hacia abajo. Factor 0.0010: una
      // rueda mecánica (~100px) mueve ~0.10 — 10 ruedas para ir de 0
      // a 1. Eso da gaps grandes entre secciones. Un golpe de
      // trackpad (~5px) mueve ~0.005, suficiente para sentir
      // progreso sin saltos bruscos.
      move(e.deltaY * 0.0010);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isBooting()) return;
      if (hasInternalScroll(e.target)) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      touchStartY = y;
      e.preventDefault();
      move(delta * 0.0018);
    };

    const onKey = (e: KeyboardEvent) => {
      if (isBooting()) return; // la tecla es para saltar el boot, no para scrollear
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
      jumpTo(idx / Math.max(1, sections.length - 1));
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("click", onAnchorClick, { capture: true });
    window.addEventListener("scroll:goto", onGoto);

    setProgress(0);

    const opts = { capture: true } as EventListenerOptions;
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, opts);
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("keydown", onKey, opts);
      document.removeEventListener("click", onAnchorClick, opts);
      window.removeEventListener("scroll:goto", onGoto);
      window.clearTimeout(jumpTimer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
