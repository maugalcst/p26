/**
 * Modelo canónico del grafo de nodos del portfolio.
 * Capa puramente de datos — no importa React, no depende de la UI.
 */

export type NodeCategory =
  | 'experiencia'
  | 'proyecto'
  | 'skill'
  | 'educacion';

export type GraphNodeStatus = 'active' | 'archived';

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  status: GraphNodeStatus;
  /** metadatos libres para pathfinding/tuneo (stack, fechas, pesos, …) */
  metadata?: Record<string, string | number>;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** peso opcional, para pathfinding ponderado si aplica */
  weight?: number;
}

/** lista de adyacencia tipada */
export interface PortfolioGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, Set<string>>;
}

/* ---- tipos de contenido (vista detalle) ---- */

export type NodeStatusLabel =
  | 'active'
  | 'built'
  | 'wip'
  | 'archived'
  | 'studying';

export type LinkKind =
  | 'github'
  | 'site'
  | 'linkedin'
  | 'mail'
  | 'external'
  | 'pending';

export interface NodeLink {
  label: string;
  href: string;
  kind: LinkKind;
}

/** El nodo del grafo + el contenido rico que se muestra en la vista detalle. */
export interface NodeContent extends GraphNode {
  title: string;
  /** one-liner usado en el grafo */
  short: string;
  /** párrafo de la vista detalle (cuerpo del markdown) */
  summary: string;
  statusLabel?: NodeStatusLabel;
  period?: string;
  role?: string;
  org?: string;
  location?: string;
  stack?: string[];
  highlights?: string[];
  links?: NodeLink[];
}

/* ---- proyección de render (layout jerárquico usa categorías en inglés) ---- */

/** categoría tal como la consume el render/layout (heredado del sistema previo). */
export type RenderCategory = 'experience' | 'project' | 'skill' | 'education';

export interface RenderGraphNode {
  id: string;
  category: RenderCategory;
}

export interface RenderGraphLink {
  source: string;
  target: string;
}