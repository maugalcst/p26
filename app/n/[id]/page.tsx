import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Graph from '@/components/Graph';
import NodePanel from '@/components/NodePanel';
import { getGraph, nodeById, toRenderCategory } from '@/lib/graph';
import type { RenderGraphLink, RenderGraphNode } from '@/lib/graph/types';
import { site } from '@/data/site';
import styles from './page.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = nodeById(id);
  return {
    title: item ? `${item.title} · ${site.handle}` : 'nodo',
    description: item?.summary,
  };
}

export default async function NodePage({ params }: Props) {
  const { id } = await params;
  const item = nodeById(id);
  if (!item) notFound();

  const { graph, items, edges } = getGraph();
  const related = graph.adjacency.get(id) ? Array.from(graph.adjacency.get(id)!) : [];

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
      <div className={styles.backdrop} aria-hidden="true">
        <Graph nodes={renderNodes} links={renderLinks} items={items} activeId={id} />
      </div>
      <NodePanel item={item} relatedIds={related} items={items} />
    </main>
  );
}