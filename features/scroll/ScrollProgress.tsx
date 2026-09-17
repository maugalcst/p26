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
      /* Cinco secciones repartidas en cuartos del recorrido:
         hero 0 · proyectos 0.25 · trayectoria 0.5 · stack 0.75 ·
         sobre mí 1.
         Cada clase marca la meseta de su sección (ver la tabla de
         ventanas en app/layout.css; si cambias un umbral aquí, cambia
         también la curva de opacidad allá).

         projects visible durante su meseta [0.25, 0.425). Antes del
         final de su fundido de salida la clase se apaga para que el
         contenido de projects ceda a trayectoria. */
      root.classList.toggle("scroll-mid", v >= 0.25 && v < 0.425);
      /* trayectoria: meseta [0.45, 0.6). Se apaga antes de que stack
         termine de entrar — así su marco cerrado, el bus y el dither
         sueltan el escenario a tiempo. */
      root.classList.toggle("scroll-end", v >= 0.45 && v < 0.6);
      /* stack: meseta [0.65, 0.8). */
      root.classList.toggle("scroll-stack", v >= 0.65 && v < 0.8);
      /* sobre mí: meseta [0.85, 1]. */
      root.classList.toggle("scroll-about", v >= 0.85);
      /* hero en su meseta [0, 0.1333]. Los elementos que solo deben
         reaccionar al cursor cuando el hero está en pantalla (marco,
         cotas) usan html.scroll-hero.cursor-motion en lugar de solo
         html.cursor-motion. Así no se "mueven" al pasar el cursor
         sobre projects o experience. */
      root.classList.toggle("scroll-hero", v < 0.1);
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
      // cap en 0.35 (fin de la meseta de projects): el scroll-virtual
      // solo controla hero↔projects. Trayectoria y stack solo se
      // alcanzan vía nav o flechas. Evita que el usuario "salte"
      // secciones por accidente con un wheel muy largo.
      target = Math.max(0, Math.min(0.35, target + delta));
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
    const applyJump = (value: number) => {
      current = value;
      target = value;
      setProgress(current);
      // marca la transición de nav: las CSS rules de los wrappers
      // usan transition para hacer fade in/out entre secciones.
      root.classList.add("nav-jump");
      window.clearTimeout(jumpTimer);
      jumpTimer = window.setTimeout(() => root.classList.remove("nav-jump"), 700);
    };

    /* ---- Coreografía de cambio de sección ----
       Entre PROYECTOS, TRAYECTORIA, STACK y SOBRE MÍ el marco cambia
       de forma. Para
       que el movimiento de las hairlines se lea solo, el salto va en tres
       tiempos:
         1. salir    html.section-hold: la sección actual se desvanece
                     (transición de opacidad de main > .scroll-section,
                     app/layout.css). Se espera a que TERMINE.
         2. marco    se aplica el progreso nuevo: cambian las clases
                     scroll-* y las hairlines se mueven con sus propias
                     transiciones. Se espera a que queden en su lugar.
         3. entrar   se quita section-hold: la sección nueva aparece y sus
                     animaciones de entrada arrancan desde cero.
       No hay tiempos fijos: cada tiempo espera a las transiciones reales,
       así los cambios de duración en CSS no descuadran la secuencia.

       Con el hero de por medio (hero ↔ cualquier sección) el salto sigue
       siendo el crossfade directo de antes, igual que con reduced-motion. */
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sectionEls = () =>
      Array.from(document.querySelectorAll("main > section, main > header"));
    const sectionAt = (v: number) =>
      Math.round(v * Math.max(1, sectionEls().length - 1));
    const isHolding = () => root.classList.contains("section-hold");
    let sequence = 0; // cada salto nuevo invalida la secuencia en curso

    /* 1 → espera a que las secciones terminen de desvanecerse. Si ya
       estaban ocultas (un segundo salto a media secuencia) no hay
       transición y resuelve al instante. */
    const sectionsFaded = () =>
      Promise.all(
        sectionEls()
          .flatMap((el) => el.getAnimations())
          .filter(
            (a) => a instanceof CSSTransition && a.transitionProperty === "opacity",
          )
          .map((a) => a.finished.catch(() => undefined)),
      );

    /* 2 → espera a que las hairlines se asienten. Se consulta el progreso
       ya con easing de cada transición de posición: con ease-out-expo el
       último 0.1% del recorrido (< 1px) se arrastra ~20% de la duración
       sin movimiento visible, así que 0.999 cuenta como "en su lugar".

       Las transiciones se vuelven a leer en CADA frame, no una sola vez:
       el destino de algunas líneas lo publican las secciones midiendo
       unos frames después del cambio de clase (ExperienceSection mide
       --title-bottom-y a 2 RAF), y eso reemplaza la transición en curso
       por una nueva. Por lo mismo no se declara quieto antes de
       SETTLE_MIN_FRAMES. */
    const POSITION_PROPS = ["top", "bottom", "left", "right", "transform"];
    const SETTLE_MIN_FRAMES = 4;
    const frameSettled = () =>
      new Promise<void>((resolve) => {
        let frames = 0;
        const check = () => {
          frames++;
          const done = Array.from(document.querySelectorAll(".frame > span"))
            .flatMap((el) => el.getAnimations())
            .every((a) => {
              if (
                !(a instanceof CSSTransition) ||
                !POSITION_PROPS.includes(a.transitionProperty) ||
                a.playState !== "running"
              ) {
                return true;
              }
              const p = a.effect?.getComputedTiming().progress;
              return p == null || p >= 0.999;
            });
          if (done && frames >= SETTLE_MIN_FRAMES) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });

    /* 3 → las animaciones de entrada (@keyframes bajo html.scroll-*)
       arrancaron en el tiempo 2, con la sección invisible. Se rebobinan
       para que corran ahora, a la vista; sus retrasos cuentan desde aquí. */
    const replayEntrance = (section: Element | undefined) => {
      section
        ?.getAnimations({ subtree: true })
        .forEach((a) => {
          if (a instanceof CSSAnimation) a.currentTime = 0;
        });
    };

    const jumpTo = async (value: number) => {
      cancelAnimationFrame(raf);
      raf = 0;
      const next = Math.max(0, Math.min(1, value));
      const token = ++sequence;
      const from = sectionAt(current);
      const to = sectionAt(next);
      const choreographed =
        !reducedMotion.matches &&
        from !== to &&
        (isHolding() || (from > 0 && to > 0));

      if (!choreographed) {
        root.classList.remove("section-hold");
        applyJump(next);
        return;
      }

      target = next; // un segundo salto encadenado se calcula desde aquí
      root.classList.add("section-hold");
      await sectionsFaded();
      if (token !== sequence) return;

      applyJump(next);
      await frameSettled();
      if (token !== sequence) return;

      root.classList.remove("section-hold");
      replayEntrance(sectionEls()[to]);
    };

    /* to: destino absoluto 0..1 · by: desplazamiento relativo al target
       interno (no al valor pintado, que va con lag por el lerp) ·
       section: ±N secciones a partir de la sección más cercana al
       target. "section" es lo que usan las flechas: un "by" de 1/3
       desde el final de la meseta de projects (0.4667) caería en 0.8,
       entre dos mesetas, sin ninguna sección visible. */
    const onGoto = (e: Event) => {
      const d =
        (e as CustomEvent<{ to?: number; by?: number; section?: number }>)
          .detail ?? {};
      if (typeof d.to === "number") void jumpTo(d.to);
      else if (typeof d.by === "number") void jumpTo(target + d.by);
      else if (typeof d.section === "number") {
        const steps = Math.max(
          1,
          document.querySelectorAll("main > section, main > header").length - 1,
        );
        void jumpTo((Math.round(target * steps) + d.section) / steps);
      }
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
      /* a media coreografía el progreso es de la secuencia: un wheel
         movería las clases y el marco por debajo de ella */
      if (isHolding()) {
        e.preventDefault();
        return;
      }
      if (hasInternalScroll(e.target)) return; // deja pasar al contenedor
      e.preventDefault();
      // deltaY positivo = scroll hacia abajo. Factor 0.0005: con 5
      // secciones el tramo hero→projects mide 1/4, y el factor se
      // escala igual para conservar la misma sensación: una rueda
      // mecánica (~100px) recorre siempre el mismo 20% del tramo. Un
      // golpe de trackpad (~5px) mueve ~0.0025.
      move(e.deltaY * 0.0005);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isBooting()) return;
      if (isHolding()) {
        e.preventDefault();
        return;
      }
      if (hasInternalScroll(e.target)) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      touchStartY = y;
      e.preventDefault();
      move(delta * 0.0009); // mismo escalado que el wheel
    };

    const onKey = (e: KeyboardEvent) => {
      if (isBooting()) return; // la tecla es para saltar el boot, no para scrollear
      if (isHolding()) return; // ver onWheel
      const step = 0.06; // ver el factor del wheel
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
      void jumpTo(idx / Math.max(1, sections.length - 1));
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
      sequence++;
      root.classList.remove("section-hold");
    };
  }, []);

  return null;
}
