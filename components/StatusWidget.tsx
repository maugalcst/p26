'use client';

import { useEffect, useState } from 'react';
import styles from './StatusWidget.module.css';
import { site } from '@/data/site';

interface CommitInfo {
  sha: string;
  msg: string;
  date: string;
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: site.tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: site.tz,
    day: '2-digit',
    month: 'short',
  }).format(d);
}

export default function StatusWidget() {
  const [now, setNow] = useState<Date | null>(null);
  const [commit, setCommit] = useState<CommitInfo | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!site.githubRepo) return;
    let cancelled = false;
    fetch(`https://api.github.com/repos/${site.githubRepo}/commits?per_page=1`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const c = data[0];
        setCommit({
          sha: c.sha.slice(0, 7),
          msg: (c.commit?.message ?? '').split('\n')[0].slice(0, 44),
          date: c.commit?.author?.date ?? '',
        });
      })
      .catch(() => {
        /* offline — se omite la línea */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className={styles.widget} aria-label="Estado del sistema">
      <div className={styles.line}>
        <span className={styles.prompt}>mau@port</span>
        <span className={styles.cursor} aria-hidden="true" />
      </div>
      <div className={styles.time}>
        {now ? formatTime(now) : '--:--:--'}{' '}
        <span className={styles.tz}>MEX</span>
      </div>
      <div className={styles.line}>
        <span className={styles.date}>{now ? formatDate(now) : ''}</span>
        <span className={styles.status}>
          <span className={styles.dot} aria-hidden="true" /> {site.status}
        </span>
      </div>
      {site.githubRepo && commit && (
        <div className={styles.line} title={commit.date}>
          <span className={styles.commitLabel}>commit</span> {commit.sha} &quot;
          {commit.msg}&quot;
        </div>
      )}
    </aside>
  );
}
