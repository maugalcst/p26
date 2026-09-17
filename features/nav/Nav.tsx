import ThemeToggle from "@/features/theme/ThemeToggle";

const sections = [
  { href: "#proyectos", label: "PROYECTOS" },
  { href: "#experiencia", label: "TRAYECTORIA" },
  { href: "#stack", label: "STACK" },
  { href: "#sobre-mi", label: "SOBRE MÍ" },
];

export default function Nav() {
  return (
    <nav>
      <ul className="nav-items">
        {sections.map((s) => (
          <li key={s.href}>
            <a href={s.href}>{s.label}</a>
          </li>
        ))}
      </ul>
      <ThemeToggle />
    </nav>
  );
}
