import ThemeToggle from "@/features/theme/ThemeToggle";
import LangToggle from "@/features/i18n/LangToggle";
import type { Localized } from "@/features/i18n/useLang";

const sections: { href: string; label: Localized<string> }[] = [
  { href: "#proyectos", label: { es: "PROYECTOS", en: "PROJECTS" } },
  { href: "#experiencia", label: { es: "TRAYECTORIA", en: "EXPERIENCE" } },
  { href: "#stack", label: { es: "STACK", en: "STACK" } },
  { href: "#sobre-mi", label: { es: "SOBRE MÍ", en: "ABOUT" } },
];

// Los dos idiomas se pintan siempre, uno encima del otro: el tab mide lo
// que mida la palabra más larga y nada se mueve al cambiar de idioma.
// Cuál se ve lo decide el CSS con <html lang>.
export default function Nav() {
  return (
    <nav>
      <LangToggle />
      <ul className="nav-items">
        {sections.map((s) => (
          <li key={s.href}>
            <a href={s.href}>
              <span className="nav-item">
                <span className="nav-item__es" lang="es">
                  {s.label.es}
                </span>
                <span className="nav-item__en" lang="en">
                  {s.label.en}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <ThemeToggle />
    </nav>
  );
}
