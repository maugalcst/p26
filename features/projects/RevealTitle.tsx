"use client";

import { useEffect, useRef } from "react";

const LEVELS = [
  "Redaction",
  "Redaction10",
  "Redaction20",
  "Redaction35",
  "Redaction50",
  "Redaction70",
  "Redaction100",
];

/* Opacidad variable por nivel: cuanto más redactado, más tenue. El último
   font (el asentado) siempre llega a opacidad total. */
const OPACITY = [0.95, 0.85, 0.72, 0.6, 0.45, 0.3, 0.18];

/* Duración del barrido por letra y desfase entre letras consecutivas. */
const DURATION = 1200;
const STAGGER = 80;

/* Estado de reposo: el menos redactado de la familia Redaction, en bold. */
const SETTLED_FAMILY = "Redaction";
const SETTLED_WEIGHT = "700";

interface RevealTitleProps {
  text: string;
  revealKey: string;
  className?: string;
}

/* Título que se revela: cada vez que cambia revealKey (o el texto), las
   letras arrancan totalmente redactadas (Redaction100, el mismo look
   pixeleado del hero) y descienden por los niveles hasta el menos redactado
   de Redaction, en bold. La transición ocurre letra por letra: cada letra
   espera su turno (STAGGER) y luego barre los niveles por su cuenta, de modo
   que la ola recorre el título hasta que todas quedan normales. Nunca llega
   a Bagnard. */
export default function RevealTitle({
  text,
  revealKey,
  className,
}: RevealTitleProps) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const reduceMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const measure = () => {
      const spans = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (!spans.length) return;

      spans.forEach((el) => {
        let max = 0;
        const original = el.style.fontFamily;
        const originalWeight = el.style.fontWeight;
        LEVELS.forEach((fam) => {
          el.style.fontFamily = fam;
          ["400", "700"].forEach((weight) => {
            el.style.fontWeight = weight;
            max = Math.max(max, el.getBoundingClientRect().width);
          });
        });
        el.style.fontFamily = SETTLED_FAMILY;
        el.style.fontWeight = SETTLED_WEIGHT;
        max = Math.max(max, el.getBoundingClientRect().width);
        el.style.fontFamily = original || "";
        el.style.fontWeight = originalWeight || "";
        const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
        el.style.width = `${(max / fontSize).toFixed(4)}em`;
      });
    };

    if (document.fonts) {
      Promise.all(
        LEVELS.map((f) => document.fonts.load(`700 100px "${f}"`))
      ).then(measure);
    } else {
      measure();
    }
  }, []);

  useEffect(() => {
    const spans = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!spans.length) return;

    const settle = (el: HTMLSpanElement) => {
      el.style.fontFamily = SETTLED_FAMILY;
      el.style.fontWeight = SETTLED_WEIGHT;
      el.style.opacity = "1";
    };

    if (reduceMotion()) {
      spans.forEach(settle);
      return;
    }

    const tick = DURATION / (LEVELS.length + 1);
    const timers: number[] = [];

    spans.forEach((el, i) => {
      el.style.fontFamily = LEVELS[LEVELS.length - 1];
      el.style.fontWeight = "700";
      el.style.opacity = String(OPACITY[LEVELS.length - 1]);

      timers.push(
        window.setTimeout(() => {
          let level = LEVELS.length - 1;
          const interval = window.setInterval(() => {
            level -= 1;
            if (level < 0) {
              window.clearInterval(interval);
              settle(el);
              return;
            }
            el.style.fontFamily = LEVELS[level];
            el.style.fontWeight = "700";
            el.style.opacity = String(OPACITY[level]);
          }, tick);
          timers.push(interval);
        }, i * STAGGER)
      );
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [revealKey, text]);

  return (
    <h3 className={className} key={revealKey}>
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i} aria-hidden="true">{"\u00A0"}</span>
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="decoder-char"
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
          >
            {char}
          </span>
        )
      )}
    </h3>
  );
}