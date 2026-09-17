"use client";

import { useEffect } from "react";

export default function ScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    let target = 0;
    let current = 0;
    let raf = 0;

    const setProgress = (v: number) => {
      root.style.setProperty("--scroll-progress", v.toFixed(4));
      root.setAttribute("data-progress", v.toFixed(3));

      // Umbrales acoplados con las ventanas de opacidad de app/layout.css:
      // si muevo uno, mover el otro
      root.classList.toggle("scroll-mid", v >= 0.25 && v < 0.425);

      root.classList.toggle("scroll-end", v >= 0.45 && v < 0.6);

      root.classList.toggle("scroll-stack", v >= 0.65 && v < 0.8);

      root.classList.toggle("scroll-about", v >= 0.85);

      root.classList.toggle("scroll-hero", v < 0.1);
    };

    const tick = () => {

      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      setProgress(current);
      if (current !== target) {
        raf = requestAnimationFrame(tick);
      } else {

        raf = 0;
      }
    };

    const move = (delta: number) => {

      target = Math.max(0, Math.min(0.35, target + delta));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const isBooting = () => root.classList.contains("booting");

    let jumpTimer = 0;
    const applyJump = (value: number) => {
      current = value;
      target = value;
      setProgress(current);

      root.classList.add("nav-jump");
      window.clearTimeout(jumpTimer);
      jumpTimer = window.setTimeout(() => root.classList.remove("nav-jump"), 700);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sectionEls = () =>
      Array.from(document.querySelectorAll("main > section, main > header"));
    const sectionAt = (v: number) =>
      Math.round(v * Math.max(1, sectionEls().length - 1));
    const isHolding = () => root.classList.contains("section-hold");
    let sequence = 0;

    const sectionsFaded = () =>
      Promise.all(
        sectionEls()
          .flatMap((el) => el.getAnimations())
          .filter(
            (a) => a instanceof CSSTransition && a.transitionProperty === "opacity",
          )
          .map((a) => a.finished.catch(() => undefined)),
      );

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

      target = next;
      root.classList.add("section-hold");
      await sectionsFaded();
      if (token !== sequence) return;

      applyJump(next);
      await frameSettled();
      if (token !== sequence) return;

      root.classList.remove("section-hold");
      replayEntrance(sectionEls()[to]);
    };

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

    const hasInternalScroll = (target: EventTarget | null): boolean => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        const style = getComputedStyle(el);
        const overflows =
          style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflowY === "overlay";
        if (overflows && el.scrollHeight > el.clientHeight + 1) {

          const atTop = el.scrollTop <= 0;
          const atBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          return !(atTop && atBottom);
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (isBooting()) return;

      if (isHolding()) {
        e.preventDefault();
        return;
      }
      if (hasInternalScroll(e.target)) return;
      e.preventDefault();

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
      move(delta * 0.0009);
    };

    const onKey = (e: KeyboardEvent) => {
      if (isBooting()) return;
      if (isHolding()) return;
      const step = 0.06;
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

    const onAnchorClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      const targetEl = id ? document.getElementById(id) : null;
      if (!targetEl) return;
      e.preventDefault();

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
