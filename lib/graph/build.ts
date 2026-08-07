/**
 * Build del grafo a partir de contenido en markdown + edges.yml.
 * Se ejecuta en build-time (módulo de servidor de Next.js) o en Node (tests).
 *
 * Convención de archivos:
 *   content/graph/{categoria}/{id}.md   — frontmatter (yaml) + cuerpo markdown (descripción detalle)
 *   content/graph/edges.yml             — lista de { from, to, weight? }
 *
 * Un nodo nuevo = un archivo .md + una línea en edges.yml. Nada de React.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type {
  GraphEdge,
  GraphNode,
  NodeCategory,
  NodeContent,
  NodeLink,
  NodeStatusLabel,
  PortfolioGraph,
} from './types';

export interface BuiltGraph {
  graph: PortfolioGraph;
  items: NodeContent[];
  edges: GraphEdge[];
}

/* ---------------- utilidades ---------------- */

const ROOT = process.cwd();

function contentDir(cwd = ROOT): string {
  return path.join(cwd, 'content', 'graph');
}

/** separa frontmatter yaml (entre ---) del cuerpo markdown. */
export function parseFrontmatter(
  raw: string
): { meta: Record<string, unknown>; body: string } {
  if (!raw.startsWith('---')) {
    throw new Error('contenido sin frontmatter: esperaba bloque "---" inicial');
  }
  const rest = raw.slice(3);
  const end = rest.indexOf('\n---');
  if (end === -1) throw new Error('frontmatter sin cierre: falta "---"');
  const metaRaw = rest.slice(0, end);
  const body = rest.slice(end + 4).replace(/^\n/, '').trim();
  let meta: unknown;
  try {
    meta = yaml.load(metaRaw);
  } catch (e) {
    throw new Error(`frontmatter yaml inválido: ${(e as Error).message}`);
  }
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error('frontmatter debe ser un objeto yaml');
  }
  return { meta: meta as Record<string, unknown>, body };
}

/* ---------------- parseo de contenido ---------------- */

export const CATEGORY_FOLDERS: NodeCategory[] = [
  'experiencia',
  'proyecto',
  'skill',
  'educacion',
];

/** proyección del grafo al render (layout jerárquico usa categorías en inglés). */
function statusLabelOf(raw: unknown): NodeStatusLabel | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw as NodeStatusLabel;
  return ['active', 'built', 'wip', 'archived', 'studying'].includes(s) ? s : undefined;
}

function str(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined;
}

function strList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function parseNodeLinks(raw: unknown): NodeLink[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: NodeLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const label = str(o.label);
    const href = str(o.href);
    if (!label || !href) continue;
    const kind = str(o.kind) as NodeLink['kind'];
    out.push({
      label,
      href,
      kind: ['github', 'site', 'linkedin', 'mail', 'external', 'pending'].includes(kind)
        ? kind
        : 'external',
    });
  }
  return out.length > 0 ? out : undefined;
}

/** parsea un archivo .md de nodo en NodeContent (validando campos mínimos). */
export function parseNodeFile(filePath: string): NodeContent {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  const id = str(meta.id);
  const label = str(meta.label) ?? str(meta.title);
  const category = str(meta.category) as NodeCategory | undefined;
  if (!id || !label) {
    throw new Error(`${filePath}: frontmatter requiere "id" y "label"`);
  }
  if (!category || !(CATEGORY_FOLDERS as string[]).includes(category)) {
    throw new Error(
      `${filePath}: "category" inválida (${category ?? 'ausente'}). Esperada: ${CATEGORY_FOLDERS.join(', ')}`
    );
  }

  const statusLabel = statusLabelOf(meta.statusLabel ?? meta.status);
  const graphStatus: GraphNode['status'] =
    statusLabel === 'archived' ? 'archived' : 'active';

  const metadata: Record<string, string | number> = {};
  const known: string[] = [
    'id', 'label', 'title', 'category', 'status', 'statusLabel',
    'short', 'summary', 'period', 'role', 'org', 'location',
    'stack', 'highlights', 'links',
  ];
  for (const [k, v] of Object.entries(meta)) {
    if (known.includes(k)) continue;
    if (typeof v === 'string' || typeof v === 'number') metadata[k] = v;
  }

  const content: NodeContent = {
    id,
    label,
    category,
    status: graphStatus,
    metadata,
    title: str(meta.title) ?? label,
    short: str(meta.short) ?? label,
    summary: body || str(meta.summary) || '',
    statusLabel,
    period: str(meta.period),
    role: str(meta.role),
    org: str(meta.org),
    location: str(meta.location),
    stack: strList(meta.stack),
    highlights: strList(meta.highlights),
    links: parseNodeLinks(meta.links),
  };
  return content;
}

/** lee todos los archivos .md de content/graph/ agrupados por categoría. */
export function readNodeFiles(cwd = ROOT): NodeContent[] {
  const dir = contentDir(cwd);
  if (!fs.existsSync(dir)) {
    throw new Error(`no existe el directorio de contenido: ${dir}`);
  }
  const out: NodeContent[] = [];
  for (const cat of CATEGORY_FOLDERS) {
    const catDir = path.join(dir, cat);
    if (!fs.existsSync(catDir)) continue;
    for (const f of fs.readdirSync(catDir)) {
      if (!f.endsWith('.md')) continue;
      const filePath = path.join(catDir, f);
      const node = parseNodeFile(filePath);
      if (node.category !== cat) {
        throw new Error(
          `${filePath}: la carpeta ${cat} no coincide con la categoría declarada (${node.category})`
        );
      }
      out.push(node);
    }
  }
  return out;
}

/* ---------------- edges.yml ---------------- */

export function readEdges(cwd = ROOT): GraphEdge[] {
  const file = path.join(contentDir(cwd), 'edges.yml');
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  const parsed: unknown = yaml.load(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('edges.yml: debe ser una lista de { from, to, weight? }');
  }
  const edges: GraphEdge[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const from = str(o.from);
    const to = str(o.to);
    if (!from || !to) {
      throw new Error(`edges.yml: edge inválido ${JSON.stringify(o)} — requiere from y to`);
    }
    edges.push({
      from,
      to,
      weight: typeof o.weight === 'number' ? o.weight : undefined,
    });
  }
  return edges;
}

/* ---------------- construcción del grafo ---------------- */

/**
 * Valida que todo edge apunte a nodos existentes y sin duplicados.
 * Cualquier referencia rota lanza error — falla el build, no la producción.
 */
export function validateEdges(
  items: NodeContent[],
  edges: GraphEdge[]
): GraphEdge[] {
  const known = new Set(items.map((i) => i.id));
  const seen = new Set<string>();
  for (const e of edges) {
    if (!known.has(e.from) || !known.has(e.to)) {
      throw new Error(
        `edge roto: ${e.from} → ${e.to}. Nodos conocidos: ${Array.from(known).sort().join(', ')}`
      );
    }
    const key = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`;
    if (seen.has(key)) {
      throw new Error(`edge duplicado: ${e.from} ↔ ${e.to}`);
    }
    seen.add(key);
  }
  return edges;
}

/** construye la instancia de PortfolioGraph (lista de adyacencia) desde items + edges. */
export function buildGraph(items: NodeContent[], edges: GraphEdge[]): PortfolioGraph {
  const nodes = new Map<string, GraphNode>();
  for (const it of items) {
    const { title, short, summary, statusLabel, ...rest } = it;
    void title;
    void short;
    void summary;
    void statusLabel;
    nodes.set(it.id, rest);
  }

  const adjacency = new Map<string, Set<string>>();
  for (const id of nodes.keys()) adjacency.set(id, new Set());
  for (const e of edges) {
    adjacency.get(e.from)?.add(e.to);
    adjacency.get(e.to)?.add(e.from);
  }
  return { nodes, adjacency };
}

/** build completo: contenido → grafo validado. */
export function buildGraphFromContent(cwd = ROOT): BuiltGraph {
  const items = readNodeFiles(cwd);
  const edges = validateEdges(items, readEdges(cwd));
  const graph = buildGraph(items, edges);
  return { graph, items, edges };
}

/* ---------------- helpers del contenido (vista detalle) ---------------- */

export function findItem(items: NodeContent[], id: string): NodeContent | undefined {
  return items.find((i) => i.id === id);
}

/** ids de vecinos directos de un nodo (para el panel de detalle). */
export function relatedIds(graph: PortfolioGraph, id: string): string[] {
  const set = graph.adjacency.get(id);
  return set ? Array.from(set) : [];
}
