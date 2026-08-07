import type { Metadata } from 'next';
import Link from 'next/link';
import Menu from '@/components/Menu';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `~/contact · ${site.handle}`,
  description: 'Contacto directo.',
};

export default function Contact() {
  return (
    <main className={styles.main}>
      <header className={styles.topbar}>
        <span className={styles.prompt}>
          {site.handle}@port<span className={styles.colon}>:</span>~/contact
          <span className={styles.dollar}>$</span>
        </span>
        <Link href="/" className={styles.back}>
          [&lt;] volver al grafo
        </Link>
      </header>

      <section className={styles.body} aria-label="Contacto">
        <h1 className={styles.title}>~/contacto</h1>
        <p className={styles.para}>
          Si quieres hablar de QA automation, LLMs aplicados a flujos de trabajo, o rices de
          terminal bien hechos — escríbeme.
        </p>

        <div className={styles.block}>
          <div className={styles.row}>
            <span className={styles.key}>email</span>
            <span className={styles.value}>{site.email}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.key}>github</span>
            <span className={styles.value}>{site.github}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.key}>linkedin</span>
            <span className={styles.value}>{site.linkedin}</span>
          </div>
        </div>

        <p className={styles.note}>
          <span className={styles.mono}>[PENDIENTE: actualizar con datos reales de contacto]</span>
        </p>
      </section>

      <footer className={styles.foot}>
        <Menu />
      </footer>
    </main>
  );
}
