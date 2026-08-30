"use client";

import { useEffect } from "react";

/* El scroll real está bloqueado: el progreso 0..1 lo escribe
   ScrollProgress como --scroll-progress en :root. Revelamos el nav
   (la línea superior desciende y aparece) cuando ese progreso cruza
   un umbral bajo (0.04 ≈ apenas se sale del hero). */
const REVEAL_AT = 0.04;

export default function ScrollNav() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const progress = parseFloat(
        getComputedStyle(root).getPropertyValue("--scroll-progress"),
      );
      root.classList.toggle("nav-revealed", progress > REVEAL_AT);
    };
    update();

    /* el progreso lo actualiza ScrollProgress vía CSS; observamos el
       atributo style de :root para reaccionar a cada cambio. */
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["style"] });

    return () => obs.disconnect();
  }, []);

  return null;
}
