'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { NodeContent } from '@/lib/graph/types';
import { categoryLabel, toRenderCategory } from '@/lib/graph/render';
import styles from './NodePanel.module.css';

const STATUS_LABEL: Record<string, string> = {
  active: 'activo',
  built: 'construido',
  wip: 'en curso',
  studying: 'estudiando',
  archived: 'archivado',
};

const STATUS_DOT: Record<string, string> = {
  active: 'ok',
  built: 'cool',
  wip: 'warn',
  studying: 'warm',
  archived: 'muted',
};

export default function NodePanel({
  item,
  relatedIds,
  items,
}: {
  item: NodeContent;
  relatedIds: string[];
  items: NodeContent[];
}) {
  const router = useRouter();
  const closeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const byId = new Map(items.map((i) => [i.id, i]));
  const relatedItems = relatedIds.map((id) => byId.get(id)).filter((x): x is NodeContent => Boolean(x));

  const status = item.statusLabel;
  const statusLabel = status ? STATUS_LABEL[status] : null;
  const statusDot = status ? STATUS_DOT[status] : null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) router.push('/');
      }}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className={styles.panel}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 260 }}
      >
        <div className={styles.closeRow}>
          <span className="tui-label">{categoryLabel[toRenderCategory(item.category)]}</span>
          <Link ref={closeRef} href="/" className={styles.close}>
            [x] cerrar
          </Link>
        </div>

        <h1 id="panel-title" className={styles.title}>
          {item.title}
        </h1>

        <div className={styles.meta}>
          {statusLabel && statusDot && (
            <span className={styles.metaItem}>
              <span className={`${styles.statusDot} ${styles['dot-' + statusDot]}`} aria-hidden="true" />
              {statusLabel}
            </span>
          )}
          {item.period && <span className={styles.metaItem}>{item.period}</span>}
          {item.role && <span className={styles.metaItem}>{item.role}</span>}
          {item.org && <span className={styles.metaItem}>{item.org}</span>}
          {item.location && <span className={styles.metaItem}>{item.location}</span>}
        </div>

        <hr className="tui-dotted" />

        <p className={styles.summary}>{item.summary}</p>

        {item.stack && item.stack.length > 0 && (
          <>
            <h2 className={styles.sub}>── stack</h2>
            <ul className={styles.stack}>
              {item.stack.map((s) => (
                <li key={s} className="tui-chip">
                  {s}
                </li>
              ))}
            </ul>
          </>
        )}

        {item.highlights && item.highlights.length > 0 && (
          <>
            <h2 className={styles.sub}>── highlights</h2>
            <ul className={styles.list}>
              {item.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}

        {item.links && item.links.length > 0 && (
          <>
            <h2 className={styles.sub}>── links</h2>
            <ul className={styles.links}>
              {item.links.map((l) => (
                <li key={l.label + l.href}>
                  {l.kind === 'pending' ? (
                    <span className={styles.pending}>{l.label}</span>
                  ) : (
                    <Link href={l.href} target={l.kind === 'external' ? '_blank' : undefined} rel="noreferrer">
                      → {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {relatedItems.length > 0 && (
          <>
            <h2 className={styles.sub}>── relacionados</h2>
            <ul className={styles.related}>
              {relatedItems.map((r) => (
                <li key={r.id}>
                  <Link href={`/n/${r.id}`}>
                    <span className={styles.arrow}>→</span> {r.short}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </motion.aside>
    </div>
  );
}
