"use client";

import { useEffect } from "react";

/* Nav keyboard: navega entre secciones con las teclas de flecha.
   Solo actúa cuando el nav está visible (html.nav-revealed).

   NO escribe --scroll-progress. El dueño del progreso es
   features/scroll/ScrollProgress: aquí solo se despacha "scroll:goto"
   y él hace el salto. Cuando este archivo escribía la variable por su
   cuenta, el closure de ScrollProgress conservaba su target viejo y el
   siguiente wheel brincaba (medido: 0.36 → ← → 0.00 → un wheel → 0.46).
   Un solo dueño del estado, un solo lugar donde viven los umbrales.

   No depende de ids: el progreso 0..1 ya codifica la posición
   (hero=0, proyectos=0.5, experiencia=1). */

const STEP = 0.5; // salto entre secciones (hero → proyectos → experiencia)

export default function NavKeyboard() {
  useEffect(() => {
    const root = document.documentElement;
    let visible = false;

    const checkVisible = () => {
      visible = root.classList.contains("nav-revealed");
    };
    checkVisible();

    const obs = new MutationObserver(checkVisible);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });

    const onKey = (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // No interferir si el foco está en un input/textarea/contenteditable
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      )
        return;

      e.preventDefault();

      window.dispatchEvent(
        new CustomEvent("scroll:goto", {
          detail: { by: e.key === "ArrowLeft" ? -STEP : STEP },
        }),
      );
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
      obs.disconnect();
    };
  }, []);

  return null;
}