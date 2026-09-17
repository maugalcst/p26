"use client";

import { useCallback, useEffect, useRef } from "react";

const LEVELS = [
  "Redaction",
  "Redaction10",
  "Redaction20",
  "Redaction35",
  "Redaction50",
  "Redaction70",
  "Redaction100",
];
const TICK = 110;

const GUIDE_TICK_MS = 75;
const GUIDE_STAGGER_MS = 60;
const GUIDE_HOLD_MS = 70;

const AMBIENT_INTERVAL_MS = 2700;
const AMBIENT_TICK_MS = 115;
const AMBIENT_HOLD_MS = 270;

interface DecoderTextProps {
  text: string;
  className?: string;
  guide?: boolean;
  guideDelay?: number;
  ambient?: boolean;
  ambientDriver?: boolean;
}

const ambientLetters: HTMLSpanElement[] = [];

export default function DecoderText({
  text,
  className,
  guide,
  guideDelay = 0,
  ambient,
  ambientDriver,
}: DecoderTextProps) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timerRefs = useRef<(number | null)[]>([]);
  const guideRef = useRef<(number | null)[]>([]);
  const ambientTimers = useRef<number[]>([]);
  const busyLetters = useRef<Set<HTMLSpanElement>>(new Set());

  useEffect(
    () => () => {
      timerRefs.current.forEach((t) => {
        if (t) window.clearInterval(t);
      });
      guideRef.current.forEach((t) => {
        if (t) window.clearTimeout(t);
      });
      ambientTimers.current.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      });
    },
    []
  );

  useEffect(() => {
    const spans = letterRefs.current.filter(Boolean);
    if (!spans.length) return;

    const measure = () => {
      spans.forEach((el) => {
        if (!el) return;
        let max = 0;
        const original = el.style.fontFamily;
        ["Bagnard", ...LEVELS].forEach((fam) => {
          el.style.fontFamily = fam;
          max = Math.max(max, el.getBoundingClientRect().width);
        });
        el.style.fontFamily = original || "";
        const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
        el.style.width = `${(max / fontSize).toFixed(4)}em`;
      });
    };

    if (document.fonts) {
      Promise.all(
        ["Bagnard", ...LEVELS].map((f) => document.fonts.load(`100px "${f}"`))
      ).then(measure);
    } else {
      measure();
    }
  }, []);

  useEffect(() => {
    if (!ambient) return;
    const spans = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    spans.forEach((el) => ambientLetters.push(el));
    return () => {
      spans.forEach((el) => {
        const idx = ambientLetters.indexOf(el);
        if (idx >= 0) ambientLetters.splice(idx, 1);
      });
    };
  }, [ambient]);

  const reduceMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clearTimer = (i: number) => {
    if (timerRefs.current[i]) {
      window.clearInterval(timerRefs.current[i]!);
      timerRefs.current[i] = null;
    }
  };

  const setLevel = (i: number, level: number) => {
    const el = letterRefs.current[i];
    if (el) el.style.fontFamily = LEVELS[level];
  };

  const redact = useCallback((i: number, tick = TICK) => {
    if (reduceMotion()) return;
    clearTimer(i);
    let level = -1;
    timerRefs.current[i] = window.setInterval(() => {
      level += 1;
      if (level >= LEVELS.length) {
        clearTimer(i);
        return;
      }
      setLevel(i, level);
    }, tick);
  }, []);

  const restore = useCallback((i: number, tick = TICK) => {
    if (reduceMotion()) return;
    clearTimer(i);
    let level = LEVELS.length - 1;
    timerRefs.current[i] = window.setInterval(() => {
      if (level < 0) {
        const el = letterRefs.current[i];
        if (el) el.style.fontFamily = "";
        clearTimer(i);
        return;
      }
      setLevel(i, level);
      level -= 1;
    }, tick);
  }, []);

  useEffect(() => {
    if (!guide || reduceMotion()) return;

    const onBoot = () => {
      const spans = letterRefs.current.filter(Boolean);
      const fullRedactMs = LEVELS.length * GUIDE_TICK_MS;
      spans.forEach((_, i) => {
        const start = guideDelay + i * GUIDE_STAGGER_MS;
        const settle = start + fullRedactMs + GUIDE_HOLD_MS;
        guideRef.current[i] = window.setTimeout(
          () => redact(i, GUIDE_TICK_MS),
          start
        );
        guideRef.current[spans.length + i] = window.setTimeout(
          () => restore(i, GUIDE_TICK_MS),
          settle
        );
      });
    };

    window.addEventListener("boot:complete", onBoot, { once: true });
    return () => window.removeEventListener("boot:complete", onBoot);
  }, [guide, guideDelay, redact, restore]);

  useEffect(() => {
    if (!ambientDriver || reduceMotion()) return;

    const clearAmbient = () => {
      ambientTimers.current.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      });
      ambientTimers.current = [];
      busyLetters.current.clear();
    };

    const runCycle = (el: HTMLSpanElement) => {
      busyLetters.current.add(el);
      el.classList.add("decoder-char--ambient");

      let level = -1;
      const upId = window.setInterval(() => {
        level += 1;
        if (level >= LEVELS.length) {
          window.clearInterval(upId);
          const restoreId = window.setTimeout(() => {
            let level2 = LEVELS.length - 1;
            const downId = window.setInterval(() => {
              if (level2 < 0) {
                window.clearInterval(downId);
                el.style.fontFamily = "";
                el.classList.remove("decoder-char--ambient");
                busyLetters.current.delete(el);
                return;
              }
              el.style.fontFamily = LEVELS[level2];
              level2 -= 1;
            }, AMBIENT_TICK_MS);
            ambientTimers.current.push(downId);
          }, AMBIENT_HOLD_MS);
          ambientTimers.current.push(restoreId);
          return;
        }
        el.style.fontFamily = LEVELS[level];
      }, AMBIENT_TICK_MS);
      ambientTimers.current.push(upId);
    };

    const onScroll = () => {
      clearAmbient();
      window.clearInterval(loopId);
      window.removeEventListener("scroll", onScroll);
    };

    let loopId = 0;
    const startLoop = () => {
      loopId = window.setInterval(() => {
        const pool = ambientLetters.filter(
          (el) => el.isConnected && !busyLetters.current.has(el)
        );
        if (!pool.length) return;
        const count = Math.min(2, pool.length);
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          runCycle(pool[idx]);
          pool.splice(idx, 1);
        }
      }, AMBIENT_INTERVAL_MS);
    };

    window.addEventListener("boot:complete", startLoop, { once: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("boot:complete", startLoop);
      window.clearInterval(loopId);
      clearAmbient();
    };
  }, [ambientDriver]);

  return (
    <span className={className} role="text" aria-label={text}>
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i} aria-hidden="true" />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="decoder-char"
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            onMouseEnter={() => redact(i)}
            onMouseLeave={() => restore(i)}
          >
            {char}
          </span>
        )
      )}
    </span>
  );
}
