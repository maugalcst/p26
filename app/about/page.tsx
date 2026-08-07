import type { Metadata } from 'next';
import Link from 'next/link';
import Menu from '@/components/Menu';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `~/about · ${site.handle}`,
  description: 'Sobre mí — QA Automation Developer, estudiante y entusiasta de homelab.',
};

export default function About() {
  return (
    <main className={styles.main}>
      <header className={styles.topbar}>
        <span className={styles.prompt}>
          {site.handle}@port<span className={styles.colon}>:</span>~/about
          <span className={styles.dollar}>$</span>
        </span>
        <Link href="/" className={styles.back}>
          [&lt;] volver al grafo
        </Link>
      </header>

      <section className={styles.body} aria-label="Sobre mí">
        <h1 className={styles.title}>~/sobre_mí</h1>

        <p className={styles.para}>
          Soy <strong>{site.fullName}</strong>, QA Automation Developer en Epicor Software
          (Monterrey, tiempo completo desde junio 2026) y estudiante de último semestre de{' '}
          Ingeniería en Tecnologías de Software en FIME-UANL (grado diciembre 2026).
        </p>

        <p className={styles.para}>
          En el trabajo automatizo la verificación de calidad: WebdriverIO, Jira, Zephyr Scale,
          Azure DevOps y C#/.NET. Me interesa particularmente el cruce entre QA, modelos de
          lenguaje y productividad de desarrollo — de ahí mi proyecto DraftAgent, que genera
          borradores de specs a partir de tickets de Jira usando el sistema de instrucciones
          nativo de GitHub Copilot.
        </p>

        <h2 className={styles.sub}>── fuera de la oficina</h2>
        <p className={styles.para}>
          Vivo en la terminal: Arch Linux + Hyprland con un rice modular versionado en GitHub,
          workspaces nombrados con conceptos griegos (hermes, atlas, nyx, aion, nous) y
          optimización real de batería (34W → 15W con auto-cpufreq/powertop). Escribo TUIs
          bien diseñadas — este sitio es un ejemplo — y mantengo <span className={styles.mono}>tnews</span>,
          un CLI que resume noticias con llama3.2 local.
        </p>

        <h2 className={styles.sub}>── intereses</h2>
        <p className={styles.para}>
          homelab · arquitectura de sistemas · diseño minimalista elegante · tenis universitario
        </p>
      </section>

      <footer className={styles.foot}>
        <Menu />
      </footer>
    </main>
  );
}
