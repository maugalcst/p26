/**
 * Motor de queries sobre el grafo (lista de adyacencia tipada).
 * Funcionalidad pura: sin estado externo, sin React — vector de pruebas de QA.
 */
import type { GraphNode, PortfolioGraph } from './types';

/** nodo por id, o undefined. */
export function getNode(graph: PortfolioGraph, id: string): GraphNode | undefined {
  return graph.nodes.get(id);
}

/** vecinos directos (sin duplicados). */
export function getNeighbors(graph: PortfolioGraph, id: string): GraphNode[] {
  const set = graph.adjacency.get(id);
  if (!set) return [];
  const out: GraphNode[] = [];
  for (const nid of set) {
    const n = graph.nodes.get(nid);
    if (n) out.push(n);
  }
  return out;
}

/** ids de vecinos directos. */
export function neighborIds(graph: PortfolioGraph, id: string): string[] {
  const set = graph.adjacency.get(id);
  return set ? Array.from(set) : [];
}

/**
 * Camino más corto no ponderado (BFS) entre dos nodos.
 * Devuelve la lista de ids [from … to], o null si no hay camino.
 * Fallback de ruta: si from === to devuelve [from].
 */
export function findPath(
  graph: PortfolioGraph,
  fromId: string,
  toId: string
): string[] | null {
  if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return null;
  if (fromId === toId) return [fromId];

  const prev = new Map<string, string>();
  const queue: string[] = [fromId];
  const seen = new Set<string>([fromId]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    for (const next of neighborIds(graph, cur)) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev.set(next, cur);
      queue.push(next);
    }
  }

  if (!seen.has(toId)) return null;

  const path: string[] = [];
  let cur: string | undefined = toId;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev.get(cur);
  }
  return path;
}

/**
 * Camino más corto ponderado (Dijkstra) — usado si los edges llevan peso.
 * prioridad: array mínimo. Devuelve { ids, cost } o null.
 */
export function findWeightedPath(
  graph: PortfolioGraph,
  fromId: string,
  toId: string,
  weights: Map<string, number>
): { ids: string[]; cost: number } | null {
  if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return null;
  if (fromId === toId) return { ids: [fromId], cost: 0 };

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const settled = new Set<string>();
  for (const id of graph.nodes.keys()) dist.set(id, Number.POSITIVE_INFINITY);
  dist.set(fromId, 0);

  // ordenación por distancia (deque naive suficiente para grafos chicos)
  const queue = new Set(graph.nodes.keys());

  while (queue.size > 0) {
    let cur: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const id of queue) {
      const d = dist.get(id)!;
      if (d < best) {
        best = d;
        cur = id;
      }
    }
    if (cur === null) break;
    queue.delete(cur);
    settled.add(cur);
    if (cur === toId) break;
    for (const nb of neighborIds(graph, cur)) {
      if (settled.has(nb)) continue;
      const w = weights.get(edgeKey(cur, nb)) ?? 1;
      const alt = dist.get(cur)! + w;
      if (alt < dist.get(nb)!) {
        dist.set(nb, alt);
        prev.set(nb, cur);
      }
    }
  }

  if (!settled.has(toId)) return null;

  const ids: string[] = [];
  let cur: string | undefined = toId;
  while (cur !== undefined) {
    ids.unshift(cur);
    cur = prev.get(cur);
  }
  return { ids, cost: dist.get(toId)! };
}

/** componente conexa que contiene a id (incluye al propio nodo). */
export function getConnectedComponent(graph: PortfolioGraph, id: string): GraphNode[] {
  if (!graph.nodes.has(id)) return [];
  const seen = new Set<string>([id]);
  const queue = [id];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const nb of neighborIds(graph, cur)) {
      if (seen.has(nb)) continue;
      seen.add(nb);
      queue.push(nb);
    }
  }
  const out: GraphNode[] = [];
  for (const nid of seen) {
    const n = graph.nodes.get(nid);
    if (n) out.push(n);
  }
  return out;
}

/** nodos con grado 0 (huérfanos / sin ninguna conexión). */
export function findOrphans(graph: PortfolioGraph): GraphNode[] {
  const out: GraphNode[] = [];
  for (const [id, node] of graph.nodes) {
    const deg = graph.adjacency.get(id);
    if (!deg || deg.size === 0) out.push(node);
  }
  return out;
}

/** detecta si existe algún ciclo en el grafo (DFS, no dirigido). */
export function hasCycle(graph: PortfolioGraph): boolean {
  const visited = new Set<string>();
  const dfs = (id: string, parent: string): boolean => {
    visited.add(id);
    for (const nb of neighborIds(graph, id)) {
      if (visited.has(nb)) {
        if (nb !== parent) return true;
      } else if (dfs(nb, id)) {
        return true;
      }
    }
    return false;
  };
  for (const id of graph.nodes.keys()) {
    if (!visited.has(id) && dfs(id, '')) return true;
  }
  return false;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}->${b}` : `${b}->${a}`;
}