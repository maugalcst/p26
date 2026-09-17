"use client";

import { useEffect, useRef, useState } from "react";
import DecoderText from "@/features/hero/DecoderText";
import { site } from "@/lib/site";
import { useT } from "@/features/i18n/useLang";
import "./HeroReveal.css";

const VIDEOS = ["abstract1", "abstract2", "landscape", "terminal"] as const;
type VideoKey = (typeof VIDEOS)[number];

export default function HeroReveal() {
  const t = useT();
  const [active, setActive] = useState<VideoKey | null>(null);
  const videoRefs = useRef<Partial<Record<VideoKey, HTMLVideoElement | null>>>(
    {},
  );
  const videosBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = videosBoxRef.current;
    if (!wrap) return;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      wrap.style.setProperty("--cota-top", `${Math.max(0, r.top)}px`);
      wrap.style.setProperty(
        "--cota-right",
        `${Math.max(0, window.innerWidth - r.right)}px`,
      );
      wrap.style.setProperty(
        "--cota-bottom",
        `${Math.max(0, window.innerHeight - r.bottom)}px`,
      );
      wrap.style.setProperty("--cota-left", `${Math.max(0, r.left)}px`);
    };

    measure();

    let ticking = false;
    const reMeasure = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        measure();
        ticking = false;
      });
    };

    window.addEventListener("resize", reMeasure);
    window.addEventListener("scroll", reMeasure, { passive: true });
    const ro = new ResizeObserver(reMeasure);
    ro.observe(wrap);

    return () => {
      window.removeEventListener("resize", reMeasure);
      window.removeEventListener("scroll", reMeasure);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    for (const key of VIDEOS) {
      const v = videoRefs.current[key];
      if (v) {
        if (key === active) {
          v.currentTime = 0;
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          v.pause();
        }
      }
    }
    document.documentElement.dataset.hover = active ?? "";
    document.documentElement.classList.toggle("video-active", active !== null);
  }, [active]);

  const handleOver = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest("[data-key]");
    if (el) setActive((el.getAttribute("data-key") as VideoKey) || null);
  };

  const handleOut = (e: React.MouseEvent) => {
    const rt = e.relatedTarget as HTMLElement | null;
    if (!rt || !rt.closest?.("[data-key]")) setActive(null);
  };

  return (
    <header
      className="hero scroll-section scroll-section--hero"
      data-active={active ?? undefined}
      onMouseOver={handleOver}
      onMouseOut={handleOut}
    >
      <div className="hero__inner scroll-target">
        <div className="hero__name-wrap">
          <p className="hero__meta hero__meta--top" data-key="landscape">
            {t(site.location)}{" "}
            <svg className="hero__mount" viewBox="0 0 1280 894" aria-hidden="true">
              <g transform="translate(0,894) scale(0.1,-0.1)" fill="currentColor" stroke="none">
                <path d="M8448 8935 c-3 -3 -63 -15 -134 -26 -310 -47 -382 -92 -678 -434 -236 -271 -227 -259 -286 -405 -86 -217 -145 -329 -239 -455 -97 -129 -158 -184 -511 -455 -238 -183 -357 -314 -506 -559 -38 -62 -89 -139 -113 -169 -35 -44 -44 -64 -43 -89 4 -48 -10 -91 -107 -348 -48 -126 -114 -313 -146 -415 -32 -102 -61 -189 -66 -194 -15 -17 -87 45 -248 210 -186 191 -303 344 -509 661 -178 275 -229 343 -291 389 -48 35 -182 92 -238 101 -49 8 -110 -33 -248 -171 -174 -173 -226 -246 -477 -671 -153 -259 -237 -384 -262 -390 -11 -3 -93 -14 -181 -26 -88 -11 -166 -26 -174 -32 -36 -30 -146 -184 -201 -282 -95 -171 -379 -741 -704 -1413 -435 -900 -1001 -2026 -1139 -2267 -335 -586 -502 -848 -730 -1150 -118 -155 -217 -309 -217 -337 0 -34 134 59 420 293 129 105 274 223 322 261 109 86 135 118 300 363 219 324 258 393 1071 1880 418 765 492 899 580 1040 77 124 167 245 182 245 37 0 48 -179 17 -296 -46 -172 -204 -491 -599 -1213 -195 -355 -228 -409 -375 -598 -33 -42 -102 -243 -84 -243 23 0 267 101 325 135 71 42 69 40 371 413 134 166 251 302 259 302 14 0 13 -39 -5 -371 -6 -92 -4 -107 10 -112 18 -7 17 -8 90 123 27 47 69 112 94 145 53 69 77 139 122 362 51 248 70 319 96 354 14 19 36 70 49 114 13 44 42 141 64 215 22 74 50 182 61 240 150 738 383 1229 671 1413 30 19 103 60 164 92 109 57 109 57 185 53 62 -3 89 -10 153 -40 111 -53 176 -106 412 -338 116 -114 225 -215 243 -225 39 -23 39 -31 8 -160 -40 -161 -126 -353 -326 -730 -56 -104 -183 -345 -282 -535 -99 -190 -209 -388 -243 -440 -83 -129 -251 -335 -360 -445 -228 -230 -692 -565 -1215 -879 -135 -81 -319 -201 -410 -265 -91 -65 -199 -137 -240 -160 -92 -52 -149 -105 -209 -196 -48 -74 -118 -221 -108 -231 3 -3 47 17 99 44 51 28 336 164 633 302 902 421 1024 490 1375 784 218 183 274 240 462 468 348 423 410 510 691 978 182 304 407 719 538 995 142 300 286 662 466 1175 322 917 394 1082 538 1226 57 59 81 75 125 88 67 20 139 21 146 2 3 -7 -13 -121 -36 -252 -83 -489 -125 -653 -197 -784 -20 -36 -120 -189 -223 -340 -356 -522 -403 -600 -473 -790 -104 -281 -... (line truncated to 2000 chars)" />
              </g>
            </svg>
          </p>
          <div className="hero__name-block">
            <h1 className="hero__name" data-key="abstract1">
              <DecoderText text="Mauricio" guide ambient ambientDriver />
            </h1>
            <p className="hero__name" data-key="abstract2">
              <DecoderText text="Gallegos" guide guideDelay={240} ambient />
            </p>
            <div className="name-block__videos" ref={videosBoxRef} aria-hidden="true">
              {VIDEOS.map((key) => (
                <video
                  key={key}
                  className={`name-block__video name-block__video--${key}`}
                  ref={(el) => {
                    videoRefs.current[key] = el;
                  }}
                  src={`/assets/videos/${key}.mp4`}
                  poster={`/assets/videos/${key}.jpg`}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  hidden={active !== key}
                />
              ))}
              <span className="cota cota--top" />
              <span className="cota cota--right" />
              <span className="cota cota--bottom" />
              <span className="cota cota--left" />
            </div>
          </div>
          <p className="hero__meta hero__meta--role" data-key="terminal">
            {t(site.role)}
          </p>
        </div>
      </div>

      <span className="hero__scroll" aria-hidden="true">
        <span className="hero__scroll__label">scroll</span>
        <span className="hero__scroll__track">
          <span className="hero__scroll__gear" />
        </span>
      </span>
    </header>
  );
}
