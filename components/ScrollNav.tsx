"use client";

import { useEffect } from "react";

/* Umbral de scroll (px) a partir del cual la línea superior desciende
   y aparece el nav. Al volver al top (o cerca de él), todo regresa. */
const REVEAL_AT = 150;

export default function ScrollNav() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      root.classList.toggle("nav-revealed", window.scrollY > REVEAL_AT);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}