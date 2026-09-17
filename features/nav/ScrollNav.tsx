"use client";

import { useEffect } from "react";

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

    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["style"] });

    return () => obs.disconnect();
  }, []);

  return null;
}
