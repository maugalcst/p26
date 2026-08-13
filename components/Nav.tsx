import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "INICIO" },
  { href: "/experiencia", label: "EXPERIENCIA" },
  { href: "/proyectos", label: "PROYECTOS" },
  { href: "/skills", label: "SKILLS" },
  { href: "/educacion", label: "EDUCACIÓN" },
  { href: "/sobre-mi", label: "SOBRE MÍ" },
  { href: "/contacto", label: "CONTACTO" },
];

export default function Nav() {
  return (
    <nav>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: "1rem", listStyle: "none", padding: 0 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
        <ThemeToggle />
      </ul>
    </nav>
  );
}