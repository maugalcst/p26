'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Boot.module.css';

const LINES = [
  { tag: 'OK', text: 'inicializando kernel mau-6.6' },
  { tag: 'OK', text: 'montando /dev/career → /' },
  { tag: 'OK', text: 'cargando módulos: webdriverio · dotnet · llama' },
  { tag: 'OK', text: 'arrancando graph-daemon v0.1' },
  { tag: 'OK', text: 'conectando /epicor' },
  { tag: 'OK', text: 'listo en 0.42s' },
];

const BRAILLE = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function shouldSkip() {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  try {
    return sessionStorage.getItem('mau-boot-ok') === '1';
  } catch {
    return false;
  }
}

export default function Boot({ children }: { children: React.ReactNode }) {
  const [skip] = useState(shouldSkip);
  const [phase, setPhase] = useState<'booting' | 'reveal' | 'done'>('booting');
  const [visible, setVisible] = useState(0);
  const [braille, setBraille] = useState(0);

  useEffect(() => {
    if (skip) {
      setPhase('done');
      return;
    }
    const id = window.setInterval(() => {
      setBraille((b) => (b + 1) % BRAILLE.length);
      setVisible((v) => {
        if (v < LINES.length) return v + 1;
        window.clearInterval(id);
        setPhase('reveal');
        return v;
      });
    }, 110);
    return () => window.clearInterval(id);
  }, [skip]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = window.setTimeout(() => {
      setPhase('done');
      try {
        sessionStorage.setItem('mau-boot-ok', '1');
      } catch {
        /* noop */
      }
    }, 260);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <>
      <AnimatePresence>
        {phase !== 'done' && (
          <motion.div
            className={styles.overlay}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <div className={styles.log}>
              {LINES.slice(0, visible).map((l, i) => (
                <div key={i} className={styles.line}>
                  <span className={styles.tag}>[{l.tag}]</span> {l.text}
                </div>
              ))}
              <div className={styles.line}>
                <span className={styles.spin} aria-hidden="true">
                  {BRAILLE[braille]}
                </span>{' '}
                <span className={styles.dim}>graph-daemon</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div id="main" className={phase === 'done' ? styles.ready : styles.waiting}>
        {children}
      </div>
    </>
  );
}
