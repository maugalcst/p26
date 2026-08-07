import type { NodeContent, PortfolioGraph } from '../types';
import { buildGraph } from '../build';

/**
 * Construye un PortfolioGraph para tests a partir de una spec compacta.
 * @param nodes — lista de { id, label?, category?, status? }
 * @param edges — pares [from, to]
 */
export function makeGraph(
  nodes: {
    id: string;
    label?: string;
    category?: string;
    status?: 'active' | 'archived';
  }[],
  edges: Array<[string, string]>
): PortfolioGraph {
  const items: NodeContent[] = nodes.map((n) => ({
    id: n.id,
    label: n.label ?? n.id,
    category: (n.category ?? 'skill') as NodeContent['category'],
    status: n.status ?? 'active',
    title: n.label ?? n.id,
    short: n.label ?? n.id,
    summary: '',
  }));
  return buildGraph(items, edges.map(([from, to]) => ({ from, to, weight: 1 })));
}