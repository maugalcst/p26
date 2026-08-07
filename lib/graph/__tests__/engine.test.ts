import { describe, it, expect } from 'vitest';
import {
  findOrphans,
  findPath,
  findWeightedPath,
  getConnectedComponent,
  getNeighbors,
  getNode,
  hasCycle,
  neighborIds,
} from '../engine';
import { makeGraph } from './helpers';

/**
 * Suite de QA sobre el motor de grafo.
 * Tratada con el rigor de una suite de automatización real: casos de borde,
 * grafos desconectados, ciclos, referencias rotas.
 */

describe('getNeighbors', () => {
  it('devuelve los vecinos correctos para un nodo con múltiples conexiones', () => {
    const g = makeGraph(
      [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
        { id: 'd' },
      ],
      [
        ['a', 'b'],
        ['a', 'c'],
        ['a', 'd'],
      ]
    );
    const n = getNeighbors(g, 'a').map((x) => x.id).sort();
    expect(n).toEqual(['b', 'c', 'd']);
  });

  it('trata los edges como no dirigidos (b ↔ a se detecta desde b)', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }], [['a', 'b']]);
    expect(getNeighbors(g, 'b').map((x) => x.id)).toContain('a');
    expect(getNeighbors(g, 'a').map((x) => x.id)).toContain('b');
  });

  it('devuelve array vacío para un nodo sin conexiones', () => {
    const g = makeGraph([{ id: 'solo' }, { id: 'otro' }], []);
    expect(getNeighbors(g, 'solo')).toEqual([]);
    expect(getNeighbors(g, 'solo')).toHaveLength(0);
  });

  it('devuelve array vacío para un id inexistente (no lanza)', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }], [['a', 'b']]);
    expect(getNeighbors(g, 'fantasma')).toEqual([]);
  });
});

describe('getNode', () => {
  it('recupera el nodo por id con sus datos', () => {
    const g = makeGraph([{ id: 'docker', category: 'skill', label: 'Docker' }], []);
    const n = getNode(g, 'docker');
    expect(n?.id).toBe('docker');
    expect(n?.label).toBe('Docker');
    expect(n?.category).toBe('skill');
  });

  it('devuelve undefined para un id inexistente', () => {
    const g = makeGraph([{ id: 'a' }], []);
    expect(getNode(g, 'no-existe')).toBeUndefined();
  });
});

describe('findPath (BFS — camino más corto no ponderado)', () => {
  it('encuentra el camino más corto cuando hay múltiples rutas', () => {
    // a--b--d  (2 pasos)  vs  a--c--e--d (3 pasos)
    const g = makeGraph(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
      [
        ['a', 'b'],
        ['b', 'd'],
        ['a', 'c'],
        ['c', 'e'],
        ['e', 'd'],
      ]
    );
    const path = findPath(g, 'a', 'd');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('a');
    expect(path![path!.length - 1]).toBe('d');
    expect(path!.length).toBe(3); // a → b → d  (camino más corto)
  });

  it('incluye ambos extremos', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }], [['a', 'b']]);
    expect(findPath(g, 'a', 'b')).toEqual(['a', 'b']);
  });

  it('devuelve null cuando no existe camino', () => {
    const g = makeGraph(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'x' }, { id: 'y' }],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['x', 'y'],
      ]
    );
    expect(findPath(g, 'a', 'x')).toBeNull();
  });

  it('devuelve [id] cuando from === to', () => {
    const g = makeGraph([{ id: 'a' }], []);
    expect(findPath(g, 'a', 'a')).toEqual(['a']);
  });

  it('devuelve null si alguno de los ids no existe', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }], [['a', 'b']]);
    expect(findPath(g, 'a', 'fantasma')).toBeNull();
    expect(findPath(g, 'fantasma', 'b')).toBeNull();
  });

  it('el camino es adyacente: cada paso consecutivo es un edge real', () => {
    const g = makeGraph(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
        ['a', 'd'],
        ['d', 'e'],
        ['e', 'f'],
      ]
    );
    const path = findPath(g, 'a', 'f')!;
    const adj = g.adjacency;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      expect(adj.get(a)?.has(b)).toBe(true);
    }
  });
});

describe('findWeightedPath (Dijkstra)', () => {
  it('elige la ruta de menor costo ponderado, no la de menos saltos', () => {
    const g = makeGraph([{ id: 's' }, { id: 'a' }, { id: 'b' }, { id: 't' }], [
      ['s', 'a'],
      ['a', 't'],
      ['s', 'b'],
      ['b', 't'],
    ]);
    // s→a→t = directa pero peso 50; s→b→t = peso 4 (claves normalizadas a<b)
    const weights = new Map<string, number>([
      ['a->s', 50],
      ['a->t', 50],
      ['b->s', 2],
      ['b->t', 2],
    ]);
    const res = findWeightedPath(g, 's', 't', weights)!;
    expect(res.ids).toEqual(['s', 'b', 't']);
    expect(res.cost).toBe(4);
  });
});

describe('getConnectedComponent', () => {
  it('encuentra toda la componente conexa de un nodo', () => {
    const g = makeGraph(
      [
        { id: 'a' }, { id: 'b' }, { id: 'c' },
        { id: 'x' }, { id: 'y' },
      ],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['x', 'y'],
      ]
    );
    const comp = getConnectedComponent(g, 'a').map((n) => n.id).sort();
    expect(comp).toEqual(['a', 'b', 'c']);
  });

  it('un nodo aislado es su propia componente', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }], []);
    expect(getConnectedComponent(g, 'a').map((n) => n.id)).toEqual(['a']);
  });

  it('devuelve [] para un id inexistente', () => {
    const g = makeGraph([{ id: 'a' }], []);
    expect(getConnectedComponent(g, 'zzz')).toEqual([]);
  });
});

describe('findOrphans (detección de nodos huérfanos)', () => {
  it('detecta nodos sin ninguna conexión programáticamente', () => {
    const g = makeGraph(
      [
        { id: 'conectado' },
        { id: 'huérfano-1' },
        { id: 'huérfano-2' },
        { id: 'otro-conectado' },
      ],
      [
        ['conectado', 'otro-conectado'],
      ]
    );
    const orphans = findOrphans(g).map((n) => n.id).sort();
    expect(orphans).toEqual(['huérfano-1', 'huérfano-2']);
  });

  it('devuelve [] si todos los nodos tienen al menos una conexión', () => {
    const g = makeGraph(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      [
        ['a', 'b'],
        ['b', 'c'],
      ]
    );
    expect(findOrphans(g)).toEqual([]);
  });
});

describe('hasCycle (detección de ciclos)', () => {
  it('detecta un ciclo en un grafo conectado', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ]);
    expect(hasCycle(g)).toBe(true);
  });

  it('devuelve false en un grafo acíclico (árbol)', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }], [
      ['a', 'b'],
      ['a', 'c'],
      ['c', 'd'],
    ]);
    expect(hasCycle(g)).toBe(false);
  });

  it('no confunde un simple edge doble con un ciclo', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }], [['a', 'b']]);
    expect(hasCycle(g)).toBe(false);
  });
});

describe('neighborIds', () => {
  it('expone los ids de vecinos directos', () => {
    const g = makeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [
      ['a', 'b'],
      ['a', 'c'],
    ]);
    expect(neighborIds(g, 'a').sort()).toEqual(['b', 'c']);
  });
});