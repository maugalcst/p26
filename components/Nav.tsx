import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/experiencia", label: "Experiencia" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/skills", label: "Skills" },
  { href: "/educacion", label: "Educación" },
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/contacto", label: "Contacto" },
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
      </ul>
    </nav>
  );
}