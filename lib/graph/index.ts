/**
 * API pública de la capa de grafo.
 * Importa `getGraph()` en build-time (servidor de Next.js) o en tests.
 * El resultado es un PortfolioGraph puro + el contenido tipado.
 */
import {
  buildGraphFromContent,
  findItem,
  relatedIds,
  type BuiltGraph,
} from './build';
import {
  findOrphans,
  findPath,
  findWeightedPath,
  getConnectedComponent,
  getNeighbors,
  getNode,
  hasCycle,
  neighborIds,
} from './engine';

export * from './types';
export { buildGraphFromContent } from './build';
export * from './render';
export * from './engine';

export type { BuiltGraph };

let cached: BuiltGraph | null = null;

/** construye (una vez) el grafo desde content/graph. */
export function getGraph(cwd?: string): BuiltGraph {
  if (!cached) cached = buildGraphFromContent(cwd);
  return cached;
}

export { findItem, relatedIds };

/** helpers derivados listos para consumir el grafo cargado. */
export function nodeById(id: string) {
  return findItem(getGraph().items, id);
}

export function nodeNeighbors(id: string) {
  return getNeighbors(getGraph().graph, id);
}

export function nodeRelatedIds(id: string) {
  return relatedIds(getGraph().graph, id);
}

export function shortestPath(fromId: string, toId: string) {
  return findPath(getGraph().graph, fromId, toId);
}

export function orphanNodes() {
  return findOrphans(getGraph().graph);
}

export function graphHasCycle() {
  return hasCycle(getGraph().graph);
}

export {
  findOrphans,
  findPath,
  findWeightedPath,
  getConnectedComponent,
  getNeighbors,
  getNode,
  hasCycle,
  neighborIds,
};
