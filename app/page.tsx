import Graph from '@/components/Graph';
import Menu from '@/components/Menu';
import { getGraph, toRenderCategory } from '@/lib/graph';
import type { RenderGraphLink, RenderGraphNode } from '@/lib/graph/types';
import { site } from '@/data/site';
import styles from './page.module.css';

export default function Home() {
  const { items, edges } = getGraph();

  const renderNodes: RenderGraphNode[] = items.map((n) => ({
    id: n.id,
    category: toRenderCategory(n.category),
  }));
  const renderLinks: RenderGraphLink[] = edges.map((e) => ({
    source: e.from,
    target: e.to,
  }));

  return (
    <main className={styles.main}>
      <header className={styles.topbar}>
        <span className={styles.prompt}>
          {site.handle}@port<span className={styles.colon}>:</span>~
          <span className={styles.dollar}>$</span>
        </span>
        <span className="tui-label">graph-daemon · navegación principal</span>
      </header>

      <section className={styles.stage} aria-label="Grafo de nodos">
        <Graph nodes={renderNodes} links={renderLinks} items={items} />
      </section>

      <footer className={styles.foot}>
        <Menu />
      </footer>
    </main>
  );
}