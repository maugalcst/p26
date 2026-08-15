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

/* Guía post-boot: oleaje de redacción que sube y baja por letra */
const GUIDE_STAGGER_MS = 80;
const GUIDE_HOLD_MS = 400;

interface DecoderTextProps {
  text: string;
  className?: string;
  guide?: boolean;
}

export default function DecoderText({ text, className, guide }: DecoderTextProps) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timerRefs = useRef<(number | null)[]>([]);
  const guideRef = useRef<(number | null)[]>([]);

  useEffect(
    () => () => {
      timerRefs.current.forEach((t) => {
        if (t) window.clearInterval(t);
      });
      guideRef.current.forEach((t) => {
        if (t) window.clearTimeout(t);
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
        el.style.width = `${max}px`;
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

  const redact = useCallback((i: number) => {
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
    }, TICK);
  }, []);

  const restore = useCallback((i: number) => {
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
    }, TICK);
  }, []);

  useEffect(() => {
    if (!guide || reduceMotion()) return;

    const onBoot = () => {
      const spans = letterRefs.current.filter(Boolean);
      const fullRedactMs = LEVELS.length * TICK;
      spans.forEach((_, i) => {
        const start = i * GUIDE_STAGGER_MS;
        const settle = start + fullRedactMs + GUIDE_HOLD_MS;
        guideRef.current[i] = window.setTimeout(() => redact(i), start);
        guideRef.current[spans.length + i] = window.setTimeout(
          () => restore(i),
          settle
        );
      });
    };

    window.addEventListener("boot:complete", onBoot, { once: true });
    return () => window.removeEventListener("boot:complete", onBoot);
  }, [guide, redact, restore]);

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