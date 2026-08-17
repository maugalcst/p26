# Mau — Portafolio 2026

Portafolio personal de Mau (QA Automation Developer · Fullstack en formación).
Sitio estático generado con Next.js App Router: navegación por páginas, boot
sequence de terminal, cursor custom y un hero con efecto de redacción.

## Stack

- Next.js 15 (App Router, Turbopack) + React 19 + TypeScript
- Todas las páginas son estáticas (SSG/SSR) — no hay datos dinámicos
- Contenido tipado en `data/content.ts`
- CSS puro con tokens y custom properties (sin frameworks de UI)

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo con Turbopack
npm run build    # build de producción (SSG)
npm run lint     # eslint
npm start        # servir el build
```

## Estructura

```
app/
  layout.tsx            # fuentes, script anti-FOUC del tema, boot, nav, cursor, marco
  page.tsx              # hero con efecto de redacción y videos
  experiencia/          # índice + detalle por [id]
  proyectos/
  skills/
  educacion/
  sobre-mi/
  contacto/
components/             # BootSequence, Nav, MenuDropdown, ThemeToggle,
                        # RotatingCursor, ScrollNav, HeroReveal, DecoderText
data/
  content.ts            # única fuente del contenido (experiencias, proyectos,
                        # skills, educación, site) + getters
hooks/                  # useTheme, useRotatingCursor (spring físico)
public/
  videos/               # 4 clips ambientales del hero (muted, poster por defecto)
  fonts/                # familia Redaction (efecto de redacción)
```

## Detalles de diseño

- **Boot sequence**: overlay de terminal falsa (systemd + `curl -sI localhost:3000`)
  que emite el evento `boot:complete` para arrancar la guía del hero.
- **Cursor custom**: cruz rotatoria con spring físico manual, giro en click,
  coordenadas mono en una capa fija y "aburrimiento" tras 2s quieto. Respeta
  `prefers-reduced-motion` y dispositivos táctiles.
- **Marco hairline**: 4 líneas que pasan de sólidas a trazos con el movimiento
  del cursor y se despegan cuando un video del hero está activo.
- **Efecto de redacción** (`DecoderText`): alterna la familia Redaction por
  letra, midiendo el ancho real de cada fuente para evitar saltos de layout.
- **Tema claro/oscuro** con script inline anti-FOUC y persistencia en
  `localStorage`.

## Notas

- La rama `archive/grafo-fase-fisica` conserva la primera iteración del proyecto:
  un portafolio-grafo con engine de física y tests (vitest), descartado en favor
  de la estructura actual basada en contenido.
- Los videos del hero están re-codificados (H.264, máx 1080p) y cada uno tiene
  un poster `.jpg`; se cargan con `preload="metadata"` y solo se activan al
  hacer hover sobre las metas del nombre.