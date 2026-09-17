"use client";

import { useEffect } from "react";

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

          detail: { section: e.key === "ArrowLeft" ? -1 : 1 },
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
