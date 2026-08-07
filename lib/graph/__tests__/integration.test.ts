import { describe, it, expect } from 'vitest';
import { buildGraphFromContent, findItem, parseFrontmatter } from '../build';
import { findOrphans, findPath, getNode } from '../engine';

/**
 * Test de integración: carga el GRAFO REAL generado desde content/graph/
 * y valida invariantes que deben cumplirse en producción.
 * Un edge roto, un nodo huérfano o un frontmatter inválido fallan aquí,
 * en CI — no silenciosamente en runtime.
 */

describe('grafo real desde content/graph', () => {
  const { graph, items, edges } = buildGraphFromContent(process.cwd());

  it('carga nodos y edges desde los archivos de contenido', () => {
    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.adjacency.size).toBe(graph.nodes.size);
    expect(items.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('cada nodo tiene id único', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo edge referencia ids de nodo existentes', () => {
    const known = new Set(items.map((i) => i.id));
    for (const e of edges) {
      expect(known.has(e.from), `edge from "${e.from}" debe existir`).toBe(true);
      expect(known.has(e.to), `edge to "${e.to}" debe existir`).toBe(true);
    }
  });

  it('no hay nodos huérfanos (todo nodo tiene al menos un edge)', () => {
    const orphans = findOrphans(graph);
    expect(orphans, `huérfanos: ${orphans.map((o) => o.id).join(', ')}`).toEqual([]);
  });

  it('getNode devuelve el nodo del contenido', () => {
    const n = getNode(graph, 'epicor');
    expect(n?.id).toBe('epicor');
    expect(n?.label).toBeTruthy();
  });

  it('responde la query del brief: camino Docker → Epicor', () => {
    const path = findPath(graph, 'docker', 'epicor');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('docker');
    expect(path![path!.length - 1]).toBe('epicor');
    // el camino debe ser adyacente paso a paso
    for (let i = 0; i < path!.length - 1; i++) {
      expect(graph.adjacency.get(path![i])?.has(path![i + 1])).toBe(true);
    }
  });

  it('cada nodo declara una categoría válida', () => {
    const valid = ['experiencia', 'proyecto', 'skill', 'educacion'];
    for (const it of items) {
      expect(valid, `categoría inválida en ${it.id}`).toContain(it.category);
    }
  });

  it('findItem recupera el contenido de detalle', () => {
    const it = findItem(items, 'epicor');
    expect(it?.title).toBeTruthy();
    expect(it?.summary.length).toBeGreaterThan(0);
  });
});

describe('validación de build (referencias rotas)', () => {
  it('parseFrontmatter acepta un frontmatter yaml bien formado', () => {
    const { meta, body } = parseFrontmatter(
      '---\nid: x\nlabel: X\ncategory: skill\nstatus: active\n---\n\nDescripción.\n'
    );
    expect(meta.id).toBe('x');
    expect(meta.category).toBe('skill');
    expect(body).toBe('Descripción.');
  });

  it('parseFrontmatter lanza si falta el cierre ---', () => {
    expect(() => parseFrontmatter('---\nid: x\nsin cierre')).toThrow();
  });

  it('parseFrontmatter lanza si no hay frontmatter', () => {
    expect(() => parseFrontmatter('solo texto')).toThrow();
  });
});