import Link from 'next/link';
import styles from './Menu.module.css';
import { categoryLabel, getGraph, toRenderCategory } from '@/lib/graph';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/', label: 'grafo' },
  { href: '/about', label: 'sobre mí' },
  { href: '/contact', label: 'contacto' },
];

const ORDER: (keyof typeof categoryLabel)[] = [
  'experience',
  'project',
  'skill',
  'education',
];

export default function Menu() {
  const { items } = getGraph();
  const allItems = items;
  return (
    <nav className={styles.menu} aria-label="Menú de texto">
      <div className={styles.head}>
        <span className="tui-label">~/menu</span>
      </div>
      <ul className={styles.sections}>
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href}>
              <span className={styles.arrow}>→</span> {s.label}
            </Link>
          </li>
        ))}
      </ul>
      {ORDER.map((cat) => (
        <div key={cat} className={styles.group}>
          <div className={styles.cat}>{categoryLabel[cat]}</div>
          <ul className={styles.items}>
            {allItems
              .filter((i) => toRenderCategory(i.category) === cat)
              .map((i) => (
                <li key={i.id}>
                  <Link href={`/n/${i.id}`}>
                    <span className={styles.arrow}>→</span> {i.short}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
