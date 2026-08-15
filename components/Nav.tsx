import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import MenuDropdown from "./MenuDropdown";

export default function Nav() {
  return (
    <nav>
      <ul className="nav-items">
        <li>
          <Link href="/">INICIO</Link>
        </li>
        <ThemeToggle />
        <MenuDropdown />
      </ul>
    </nav>
  );
}