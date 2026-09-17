"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./BootSequence.css";
import { useT } from "@/features/i18n/useLang";

const CMD_CHAR_MS = 9;
const OUT_DELAY_MS = 140;
const HOLD_MS = 350;
const FADE_MS = 420;

type LineKind = "cmd" | "ok" | "out";
interface Line {
  kind: LineKind;
  text: string;
}

// Las líneas de la intro
const LINES: Line[] = [
  { kind: "ok", text: "Started Load Kernel Modules." },
  { kind: "ok", text: "Mounted /dev/nvme0n1p2 on /." },
  { kind: "ok", text: "Reached target Multi-User System." },
  { kind: "ok", text: "Started Network Manager." },
  { kind: "cmd", text: "curl -sI localhost:3000" },
  { kind: "out", text: "HTTP/1.1 200 OK" },
];

const PROMPT = "mau@port2026:~$ ";

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export default function BootSequence() {
  const t = useT();
  const [visible, setVisible] = useState<Line[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setVisible(LINES);
    setLeaving(true);
    window.setTimeout(() => setDone(true), FADE_MS);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (done) {
      root.classList.remove("booting");
      window.dispatchEvent(new CustomEvent("boot:complete"));
    } else {
      root.classList.add("booting");
    }
    return () => root.classList.remove("booting");
  }, [done]);

  useEffect(() => {
    let cancelled = false;

    const skip = () => {
      if (cancelled) return;
      finish();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(LINES);
      const t = window.setTimeout(() => setLeaving(true), 200);
      window.setTimeout(() => setDone(true), 200 + FADE_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }

    (async () => {
      for (let i = 0; i < LINES.length; i++) {
        const line = LINES[i];
        if (line.kind === "cmd") {
          for (let c = 1; c <= line.text.length; c++) {
            if (cancelled) return;
            await wait(CMD_CHAR_MS);
            setVisible(LINES.slice(0, i).concat({ ...line, text: line.text.slice(0, c) }));
          }
        } else {
          await wait(OUT_DELAY_MS);
          if (cancelled) return;
          setVisible(LINES.slice(0, i + 1));
        }
      }
      await wait(HOLD_MS);
      if (!cancelled) finish();
    })();

    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [finish]);

  if (done) return null;

  const typing = visible[visible.length - 1]?.kind === "cmd";

  return (
    <div
      className={`boot-overlay${leaving ? " boot-overlay--leaving" : ""}`}
      aria-label={t({ es: "Arrancando portafolio", en: "Booting portfolio" })}
      role="presentation"
    >
      <div className="boot-window">
        <div className="boot-titlebar">
          <span className="boot-titlebar__title">mau@port2026</span>
        </div>

        <div className="boot-body">
          {visible.map((line, i) => {
            const last = i === visible.length - 1;
            const showCaret = typing && last;
            return (
              <div className="boot-line" key={i}>
                {line.kind === "cmd" && <span className="boot-prompt">{PROMPT}</span>}
                {line.kind === "ok" && <span className="boot-ok">[ OK ]&nbsp;&nbsp;</span>}
                <span className={line.kind === "out" ? "boot-out" : undefined}>{line.text}</span>
                {showCaret && <span className="boot-caret" aria-hidden="true" />}
              </div>
            );
          })}

          <div className="boot-line">
            <span className="boot-prompt">{PROMPT}</span>
            <span className="boot-caret" aria-hidden="true" />
          </div>
        </div>

        <div className="boot-footer">
          <span className="boot-hint">
            {t({
              es: "pulse cualquier tecla para entrar",
              en: "press any key to enter",
            })}
          </span>
          <button type="button" className="boot-skip" onClick={finish} tabIndex={0}>
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}
