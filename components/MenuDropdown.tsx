"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const menuLinks = [
  { href: "/experiencia", label: "EXPERIENCIA" },
  { href: "/proyectos", label: "PROYECTOS" },
  { href: "/skills", label: "SKILLS" },
  { href: "/educacion", label: "EDUCACIÓN" },
  { href: "/sobre-mi", label: "SOBRE MÍ" },
  { href: "/contacto", label: "CONTACTO" },
];

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <li ref={ref} className="menu-dropdown">
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        MENU
      </button>
      {open && (
        <ul role="menu" className="menu-dropdown__list">
          {menuLinks.map((l) => (
            <li role="none" key={l.href}>
              <Link role="menuitem" href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}