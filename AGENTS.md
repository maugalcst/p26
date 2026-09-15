# AGENTS.md — p26

Portafolio personal de Mauricio Gallegos. Next.js 15 (App Router) +
React 19 + TypeScript. **Sin Tailwind, sin librerías de animación, sin
UI kits.** CSS plano. No instales dependencias sin preguntar.

```
npm run dev     # Next dev con Turbopack
npm run build   # build de producción
npm run lint    # eslint
```

---

## Antes de escribir código

1. Di qué archivos vas a tocar y **espera confirmación**.
2. Trabaja de forma aditiva. No refactorices, no reordenes imports,
   no "arregles de paso" cosas que no te pedí.
3. Al terminar, reporta: archivos tocados, y si rompiste alguna regla
   de este documento, cuál y por qué.

---

## Estructura

```
app/
  layout.tsx        # marco, nav, cursor, boot
  page.tsx          # las tres secciones
  globals.css       # tokens, reset, tipografía global, temas
  layout.css        # marco, nav, scroll virtual, pointer-events
  utilities.css     # utilidades de sangría derivadas del marco
features/
  boot/             # BootSequence — intro de terminal
  cursor/           # RotatingCursor — cursor personalizado
  hero/             # HeroReveal, DecoderText — nombre + videos en hover
  projects/         # ProjectsSection, RevealTitle
  experience/       # ExperienceSection, DitherField
  nav/              # Nav, ScrollNav
  scroll/           # ScrollProgress — motor del scroll virtual
  theme/            # ThemeToggle, useTheme
hooks/              # useRotatingCursor
lib/site.ts         # datos del sitio
```

Cada feature tiene su `.css` al lado. **Los estilos de una feature
viven en su archivo, nunca en globals.css.** Lo global es solo: tokens,
reset, tipografía base, temas (globals.css) y marco/nav/scroll
(layout.css).

---

## El scroll es virtual — esto es lo más importante

`html, body` tienen `overflow: hidden`. El navegador **no desplaza
nada**. `features/scroll/ScrollProgress.tsx` captura wheel/touch y
publica `--scroll-progress` (0..1) en `:root`, más clases de estado:

| clase         | rango de progreso |
|---------------|-------------------|
| `scroll-hero` | `p < 0.2`         |
| `scroll-mid`  | `0.5 ≤ p < 0.85`  |
| `scroll-end`  | `p ≥ 0.9`         |

Las tres secciones se apilan en la misma celda de `main` y se muestran
según esas clases. Cada una tiene un wrapper `.scroll-target`.

### Trampa: pointer-events

Cada `.scroll-section` tiene `pointer-events: none` por defecto para
que las secciones inactivas no intercepten clics. **Cada sección debe
reactivarlos con su clase de estado.** Si agregas una sección nueva y
sus botones "no funcionan", esto es lo primero que hay que revisar:

```css
main > .scroll-section.scroll-section--after-2 { pointer-events: none; }
html.scroll-end main > .scroll-section.scroll-section--after-2 {
  pointer-events: auto;
}
```

Síntoma característico: `document.elementsFromPoint()` sobre el botón
devuelve `main` y **el botón no aparece en la lista** — un ancestro con
`pointer-events: none` lo saca del hit-testing por completo.

### Trampa: altura

`main { min-height: 100svh }` para que las secciones con retícula
llenen la pantalla. `.hero` se acota con
`height: calc(100svh - var(--frame-top-offset))` para no verse
afectado. Si cambias uno, revisa el otro.

---

## Tokens (globals.css)

Nunca uses valores literales de color, espacio o tamaño. Todo sale de
tokens:

- **Color:** `--bg`, `--fg`, `--fg-secondary`, `--cursor-color`.
  Nunca `#000` ni `#fff` puros.
- **Escala tipográfica:** `--step-0` a `--step-3`. Cuatro escalones,
  razón 1.25. **No agregues un quinto.**
- **Ritmo vertical:** `--rhythm` y `--space-*`, derivados de la
  interlínea del cuerpo. Nada de valores sueltos como `17px`.
- **Marco:** `--frame-inset`, `--frame-line`, `--frame-offset`,
  `--frame-top-offset`, `--frame-grow`.
- **Easing:** `--ease-out-expo`.

`--frame-line` es un `color-mix()`. Al leerlo desde JS **no lo parsees
con regex**: `color-mix` computa a `color(srgb 0.24 0.22 …)` con
decimales y un `/\d+/g` produce basura. Resuélvelo pintándolo en un
canvas y leyéndolo de vuelta con `getImageData` (ver `DitherField.tsx`).

### Temas

`html[data-theme="dark"]` redefine `--bg`, `--fg`, `--cursor-color`.
Los derivados se recalculan solos vía `color-mix`. **Todo lo que leas
un color desde JS necesita un `MutationObserver` sobre el atributo
`data-theme` de `<html>`**, o se queda con el color del tema anterior.

---

## Reglas de composición — no negociables

- Texto corrido: `max-width` 32–38em. Nunca al 100%.
- Interlínea sin unidad, inversa al tamaño: cuerpo 1.6–1.8,
  subtítulos 1.3–1.4, display 1.0–1.15. **Columnas angostas llevan
  interlínea más cerrada**, no más suelta.
- `text-align: left` siempre. Prohibido `justify`.
- Máximo 4 escalones de tamaño en todo el sitio.
- Texto secundario: mismo color con menor opacidad (55–65%), nunca
  otro gris ni otro peso.
- `font-synthesis: none`.
- Encabezados: margen superior ≈3× el inferior. El espacio agrupa.
- `text-wrap: balance` en encabezados, `pretty` en párrafos.
- `font-variant-numeric: tabular-nums` en cualquier número que se
  alinee en columna (periodos, años, cifras).
- Prohibido: sombras de texto (salvo sobre video/fondo animado, donde
  son la única forma de contraste local), `border-radius`, gradientes
  decorativos, iconos de tecnologías, barras de progreso de skills.

### El acento

`--cursor-color` (azul en claro, naranja en oscuro) **solo existe en
hover, selección y líneas de conexión.** Cero acento en estado de
reposo, en ninguna sección. Es lo que hace que el sitio se sienta
controlado.

---

## Trampas conocidas de CSS

**`p { max-width: 34em }` en globals.css** aplica a TODOS los
párrafos, incluidos los que se usan como contenedores de layout. Ya
rompió el módulo de terminal, las métricas y el texto de estado vacío
de TRAYECTORIA. Si un `<p>` sale más angosto de lo esperado, es esto.
Solución: `max-width: none` en ese bloque.

**Padding asimétrico + hijos absolutos.** `inset: 0` se resuelve
contra el padding-box. Si un panel tiene padding distinto por lado,
sus hijos absolutos quedan descentrados. La solución correcta es
igualar el padding del panel, no compensar con `right` negativo en
cada hijo.

**`overflow` recorta descendientes absolutos.** Un contenedor con
`overflow: auto/hidden` corta cualquier hijo que sobresalga con
`inset` negativo. Si un marco decorativo "no aparece", revisa el
overflow del ancestro.

**Hairlines reales.** Usa `@media (min-resolution: 2dppx)` para el
`0.5px`, no `-webkit-min-device-pixel-ratio` (no aplica en Firefox).

**Proporciones acopladas.** En `.experience__grid`, el porcentaje de
`grid-template-columns` y el multiplicador del `left` de
`.experience__vline` **deben coincidir**. Si cambias uno sin el otro,
la línea se desalinea de la columna.

---

## Animación

- Solo `transform` y `opacity`. Nada que dispare layout.
- Duración típica 200–400ms con `cubic-bezier(0.16, 1, 0.3, 1)`.
- **`@media (prefers-reduced-motion: reduce)` es obligatorio** en todo
  lo que se mueva: todo instantáneo, contenido visible.
- Nunca sobreescribas un `transform` que el JS esté controlando. El
  cursor (`.cursor-cross`) usa `transform` para posicionarse; para
  atenuarlo se usa `opacity` y `--cursor-size`, nunca `transform`.
- El cursor **nunca baja a `opacity: 0`**. Mínimo ~0.15, o el usuario
  pierde la referencia de dónde está su mouse.

---

## Canvas / generativo

`DitherField.tsx` es el patrón de referencia:

- Resolución interna baja (180×130) escalada con
  `image-rendering: pixelated`.
- **12 fps, no 60.** Se ve mejor y consume una fracción.
- `IntersectionObserver` para pausar fuera de viewport.
- Prop `paused` para detener cuando no se ve.
- Respeta `prefers-reduced-motion`.
- El color se lee del CSS del propio canvas, no se hardcodea.

Cualquier canvas nuevo sigue estas mismas reglas.

---

## Contenido

- Descripciones de proyecto: 4–5 líneas máximo. Concretas: qué es, qué
  problema resuelve, qué se usó. Sin adjetivos de relleno.
- Stack en mono separado por ` · `. Sin logos.
- Verifica antes de publicar cualquier cifra o captura de trabajo
  interno de Epicor.

---

## Accesibilidad

- Contraste mínimo 4.5:1, verificado en **ambos temas**.
- Navegación por teclado funcional, foco visible.
- `aria-hidden` y `pointer-events: none` en todo lo decorativo.
- Un solo `h1` (el hero), `h2` por sección.
- Estados interactivos accesibles por `onFocus`/`onBlur`, no solo por
  mouse.

---

## Al depurar layout

No adivines. Mide:

```js
el.getBoundingClientRect()        // dónde cree el navegador que está
document.elementsFromPoint(x, y)  // qué intercepta el puntero
getComputedStyle(el).propiedad    // qué valor ganó
```

Si un elemento no aparece en `elementsFromPoint`, un ancestro tiene
`pointer-events: none`. Si su `rect` no coincide con lo que se ve, hay
un `transform` o un `overflow` de por medio.