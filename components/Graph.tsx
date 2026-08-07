'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Graph.module.css';
import type { RenderGraphLink, RenderGraphNode, NodeContent } from '@/lib/graph/types';
import { categoryLabel } from '@/lib/graph/render';
import { orthogonalRoute, type Box } from '@/lib/route';
import {
  chipDims,
  computeColumnLayout,
  LEVELS,
  nodeMeta,
  orderedLevels,
} from '@/lib/layout';
import type { GraphWorld } from '@/lib/physics';
import {
  GraphWorld as GraphWorldCtor,
  prefersReducedMotion,
  subscribe,
  wake,
  worldTransform,
} from '@/lib/physics';

type Status = 'active' | 'built' | 'wip' | 'archived' | 'studying' | undefined;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const mqNarrow = window.matchMedia('(max-width: 640px)');
    const upd = () => setMobile(mqCoarse.matches || mqNarrow.matches);
    upd();
    mqCoarse.addEventListener('change', upd);
    mqNarrow.addEventListener('change', upd);
    return () => {
      mqCoarse.removeEventListener('change', upd);
      mqNarrow.removeEventListener('change', upd);
    };
  }, []);
  return mobile;
}

const MAX_LABEL = 20;

function truncate(s: string) {
  return s.length > MAX_LABEL ? s.slice(0, MAX_LABEL - 1).trimEnd() + '…' : s;
}

function statusOf(s: Status) {
  return s ?? 'built';
}

export default function Graph({
  nodes,
  links,
  items,
  activeId,
}: {
  nodes: RenderGraphNode[];
  links: RenderGraphLink[];
  items: NodeContent[];
  activeId?: string | null;
}) {
  const router = useRouter();
  const mobile = useIsMobile();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const camRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const worldRef = useRef<GraphWorld | null>(null);
  const chipRefs = useRef(new Map<string, HTMLAnchorElement>());
  const dragRef = useRef<{ id: string | null; moved: boolean; sx: number; sy: number }>({
    id: null,
    moved: false,
    sx: 0,
    sy: 0,
  });

  const [view, setView] = useState({ w: 0, h: 0 });
  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mRects, setMRects] = useState<Record<string, Box>>({});
  const [mBox, setMBox] = useState({ w: 0, h: 0 });

  /* ---- vecinos directos (para hover/highlight) ---- */
  const neighborIds = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of nodes) m.set(n.id, new Set());
    for (const l of links) {
      m.get(l.source)?.add(l.target as string);
      m.get(l.target as string)?.add(l.source);
    }
    return m;
  }, [nodes, links]);

  /* ---- datos derivados ---- */
  const itemById = useMemo(() => new Map(items.map((n) => [n.id, n])), [items]);

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) {
      const it = itemById.get(n.id);
      m.set(n.id, truncate(it?.short ?? it?.title ?? n.id));
    }
    return m;
  }, [nodes, itemById]);

  const degreeById = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) m.set(n.id, 0);
    for (const l of links) {
      m.set(l.source, (m.get(l.source) ?? 0) + 1);
      m.set(l.target, (m.get(l.target) ?? 0) + 1);
    }
    return m;
  }, [nodes, links]);

  const metaById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) {
      const it = itemById.get(n.id);
      m.set(n.id, nodeMeta(n.category, it?.period, degreeById.get(n.id) ?? 0));
    }
    return m;
  }, [nodes, itemById, degreeById]);

  /* ---- medida del contenedor (desktop) ---- */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || mobile) return;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      setView({ w: Math.max(r.width, 320), h: Math.max(r.height, 320) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [mobile]);

  /* ---- layout jerárquico (desktop) ---- */
  const layout = useMemo(() => {
    if (mobile || !view.w) return null;
    const levels = orderedLevels(nodes, links);
    const dims: Record<string, { w: number; h: number }> = {};
    for (const n of nodes) {
      dims[n.id] = chipDims(labelById.get(n.id) ?? n.id, metaById.get(n.id) ?? '');
    }
    return computeColumnLayout(levels, dims, view.w);
  }, [nodes, links, mobile, view.w, labelById, metaById]);

  /* ---- aplicación imperativa del transform mundo+nodos ---- */
  const applyWorld = useCallback(
    (w: GraphWorld) => {
      if (!layout) return;
      if (camRef.current) {
        const v = w.view;
        camRef.current.setAttribute(
          'transform',
          worldTransform(layout.width, layout.height, v.cx, v.cy, v.zoom)
        );
      }
      for (const [id, el] of nodeRefs.current) {
        if (el) el.setAttribute('transform', `scale(${w.scaleOf(id)})`);
      }
    },
    [layout]
  );

  /* ---- física: cámara focus/periferia + escala por-nodo via RAF ---- */
  useLayoutEffect(() => {
    if (mobile || !layout) return;
    const world = new GraphWorldCtor(
      nodes.map((n) => {
        const p = layout.positions[n.id];
        return { id: n.id, x: p?.x ?? 0, y: p?.y ?? 0 };
      })
    );
    world.setBounds(layout.width, layout.height);
    worldRef.current = world;

    if (prefersReducedMotion()) {
      world.snap();
      return;
    }

    let subCleanup: (() => void) | null = null;
    const clearLoop = () => {
      if (subCleanup) subCleanup();
      subCleanup = null;
    };

    subCleanup = subscribe((dt) => {
      const w = worldRef.current;
      if (!w) return 0;
      const alive = w.tick(dt);
      applyWorld(w);
      return alive;
    });
    wake();
    return clearLoop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, layout]);

  /* ---- sincroniza roles cada vez que cambia el foco ---- */
  useLayoutEffect(() => {
    const w = worldRef.current;
    if (!w) return;
    w.updateRoles({
      activeId: activeId ?? null,
      hoveredId: hovered,
      isNeighbor: (id, of) => Boolean(neighborIds.get(of)?.has(id)),
    });
    if (prefersReducedMotion()) {
      w.snapToTargets();
      applyWorld(w);
    } else {
      wake();
    }
  }, [activeId, hovered, neighborIds, layout, applyWorld]);

  const posOf = (id: string) => overrides[id] ?? layout?.positions[id];

  const dimsOf = (id: string) =>
    chipDims(labelById.get(id) ?? id, metaById.get(id) ?? '');

  /* ---- medida de chips móviles (para trazas on-demand) ---- */
  useLayoutEffect(() => {
    if (!mobile) return;
    const wrap = wrapRef.current;
    const measure = () => {
      const next: Record<string, Box> = {};
      for (const [id, el] of chipRefs.current) {
        if (!el.isConnected) continue;
        next[id] = {
          x: el.offsetLeft + el.offsetWidth / 2,
          y: el.offsetTop + el.offsetHeight / 2,
          w: el.offsetWidth,
          h: el.offsetHeight,
        };
      }
      setMRects(next);
      if (wrap) setMBox({ w: wrap.scrollWidth, h: wrap.scrollHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap) ro.observe(wrap);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [mobile]);

  /* ---- interacción ---- */
  const toLocal = (ev: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const m = svg.getScreenCTM();
    if (m) {
      const p = pt.matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    }
    const r = svg.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  const open = (id: string) => router.push(`/n/${id}`);

  const onPointerDown = (ev: React.PointerEvent<SVGGElement>, id: string) => {
    if (ev.pointerType !== 'mouse') return;
    dragRef.current = { id, moved: false, sx: ev.clientX, sy: ev.clientY };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const onPointerMove = (ev: React.PointerEvent<SVGGElement>) => {
    const d = dragRef.current;
    if (!d.id || ev.pointerType !== 'mouse') return;
    if (Math.abs(ev.clientX - d.sx) + Math.abs(ev.clientY - d.sy) > 4) d.moved = true;
    const { x, y } = toLocal(ev);
    setOverrides((prev) => ({ ...prev, [d.id!]: { x, y } }));
  };

  const endDrag = () => {
    dragRef.current = { id: null, moved: false, sx: 0, sy: 0 };
  };

  const onKeyDown = (ev: React.KeyboardEvent<SVGGElement>, id: string) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      open(id);
    } else if (ev.key.startsWith('Arrow')) {
      ev.preventDefault();
      const ids = nodes.map((n) => n.id);
      const idx = ids.indexOf(id);
      const back = ev.key === 'ArrowLeft' || ev.key === 'ArrowUp';
      const next = back ? (idx - 1 + ids.length) % ids.length : (idx + 1) % ids.length;
      // foco discreto no existe en SVG estático; navegamos por lista
      setFocused(ids[next]);
      const target = chipRefs.current.get(ids[next]);
      (target ?? document.querySelector<HTMLElement>(`[data-id="${ids[next]}"]`))?.focus();
    }
  };

  const isActive = (key: string) => {
    if (!activeId) return false;
    return key.split('|').includes(activeId);
  };

  /* ---- render DOM ---- */

  if (mobile) {
    const focusedLinks = focused
      ? links.filter((l) => l.source === focused || l.target === focused)
      : [];
    return (
      <div className={styles.mWrap} ref={wrapRef}>
        {LEVELS.map((cat) => (
          <section key={cat} className={styles.mLevel}>
            <h2 className={styles.mLabel}>{categoryLabel[cat]}</h2>
            <div className={styles.mRow}>
              {nodes
                .filter((n) => n.category === cat)
                .map((n) => {
                  const it = itemById.get(n.id);
                  const st = statusOf(it?.statusLabel);
                  const active = n.id === activeId;
                  return (
                    <a
                      key={n.id}
                      ref={(el) => {
                        if (el) chipRefs.current.set(n.id, el);
                        else chipRefs.current.delete(n.id);
                      }}
                      href={`/n/${n.id}`}
                      className={`${styles.mChip} ${styles['st-' + st]}${
                        active ? ` ${styles.mChipActive}` : ''
                      }`}
                      onFocus={() => setFocused(n.id)}
                      onBlur={() => setFocused((f) => (f === n.id ? null : f))}
                      onPointerEnter={() => setFocused(n.id)}
                      onPointerLeave={() => setFocused((f) => (f === n.id ? null : f))}
                    >
                      <span className={styles.mDot} aria-hidden="true" />
                      <span className={styles.mText}>
                        <span className={styles.mTitle}>{labelById.get(n.id)}</span>
                        <span className={styles.mMeta}>{metaById.get(n.id)}</span>
                      </span>
                    </a>
                  );
                })}
            </div>
          </section>
        ))}

        {focused && mBox.w > 0 && (
          <svg
            className={styles.mTraces}
            width={mBox.w}
            height={mBox.h}
            aria-hidden="true"
          >
            {focusedLinks.map((l) => {
              const a = mRects[l.source];
              const b = mRects[l.target];
              if (!a || !b) return null;
              const res = orthogonalRoute(a, b, {}, 'v');
              const key = [l.source, l.target].sort().join('|');
              return (
                <g key={key} className={styles.linkActive}>
                  <path d={res.d} />
                  {res.vias.map(([vx, vy], i) => (
                    <circle key={i} cx={vx} cy={vy} r={1.7} className={styles.via} />
                  ))}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    );
  }

  if (!layout) return <div className={styles.wrap} ref={wrapRef} />;

  const trace = (l: RenderGraphLink) => {
    const s = posOf(l.source);
    const t = posOf(l.target);
    if (!s || !t) return null;
    const sa: Box = { ...dimsOf(l.source), x: s.x, y: s.y };
    const tb: Box = { ...dimsOf(l.target), x: t.x, y: t.y };
    return orthogonalRoute(sa, tb, { riser: layout.riserX(l.source, l.target) }, 'h');
  };

  const isDimmed = (id: string) =>
    hovered != null && id !== hovered && !neighborIds.get(hovered)?.has(id);

  const isHoverLink = (l: RenderGraphLink) =>
    hovered != null && (l.source === hovered || l.target === hovered);

  const linkClass = (l: RenderGraphLink) => {
    const base = styles.link;
    if (hovered) return isHoverLink(l) ? `${base} ${styles.linkHover}` : `${base} ${styles.linkDim}`;
    return isActive([l.source, l.target].sort().join('|'))
      ? `${base} ${styles.linkActive}`
      : base;
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Mapa de nodos: niveles educación → skills → proyectos → experiencia. Tab para moverte, Enter para abrir."
      >
        <g ref={camRef}>
        <g className={styles.links}>
          {links.map((l) => {
            const res = trace(l);
            if (!res) return null;
            return (
              <g key={[l.source, l.target].sort().join('|')} className={linkClass(l)}>
                <path d={res.d} />
                <circle cx={res.vias[0]?.[0]} cy={res.vias[0]?.[1]} r={1.7} className={styles.via} />
                <circle cx={res.vias[1]?.[0]} cy={res.vias[1]?.[1]} r={1.7} className={styles.via} />
              </g>
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const p = posOf(n.id);
            if (!p) return null;
            const it = itemById.get(n.id);
            const st = statusOf(it?.statusLabel);
            const d = dimsOf(n.id);
            const hw = d.w / 2;
            const hh = d.h / 2;
            const active = n.id === activeId;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                className={`${styles.node} ${styles['st-' + st]}${
                  active ? ` ${styles.nodeActive}` : ''
                }${isDimmed(n.id) ? ` ${styles.nodeDim}` : ''}`}
                data-id={n.id}
                role="button"
                tabIndex={0}
                aria-label={`Abrir ${labelById.get(n.id) ?? n.id}`}
                onClick={() => {
                  if (dragRef.current.moved) {
                    dragRef.current.moved = false;
                    return;
                  }
                  open(n.id);
                }}
                onKeyDown={(ev) => onKeyDown(ev, n.id)}
                onPointerDown={(ev) => onPointerDown(ev, n.id)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered((h) => (h === n.id ? null : h))}
              >
                <g
                  ref={(el) => {
                    if (el) nodeRefs.current.set(n.id, el);
                    else nodeRefs.current.delete(n.id);
                  }}
                >
                  <rect className={styles.chip} x={-hw} y={-hh} width={d.w} height={d.h} rx={2} />
                  <circle className={styles.status} cx={-hw + 10} cy={-hh + 13} r={2.6} />
                  <text className={styles.label} x={-hw + 20} y={-hh + 14}>
                    {labelById.get(n.id)}
                  </text>
                  <text className={styles.meta} x={-hw + 20} y={-hh + 27}>
                    {metaById.get(n.id)}
                  </text>
                  <title>{it?.short ?? it?.title ?? n.id}</title>
                </g>
              </g>
            );
          })}
        </g>
        </g>
      </svg>
      <p className={styles.hint} aria-hidden="true">
        [drag] nodo · [click] abrir · [tab] navegar
      </p>
    </div>
  );
}