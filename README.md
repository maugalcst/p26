# p26 — Portafolio 2026

Portafolio personal de Mauricio Gallegos, QA Automation Developer. Una sola
pantalla, scroll virtual y un marco de hairlines que se reacomoda en cada
sección.

Next.js 15 + React 19 + TypeScript. CSS plano con tokens, sin frameworks de UI
ni librerías de animación.

```bash
npm install
npm run dev
```

## Cómo funciona

El navegador no desplaza nada: `ScrollProgress` captura wheel, touch y teclado y
publica un progreso de 0 a 1 que decide qué sección se ve. Son cinco (hero,
proyectos, trayectoria, stack, sobre mí) apiladas en la misma celda.

El marco de cuatro hairlines cambia de forma en cada una: en Trayectoria se
cierra, en Stack los costados se juntan en una columna central y en Sobre mí se
retira del viewport. Al cambiar de sección, primero se va la anterior, luego se
mueven las líneas y al final aparece la nueva.

Tres temas (IVORY, DARK, VELVET) definidos con tres colores cada uno, y dos
idiomas, ambos desde el nav y sin recargar.

## Dónde está el contenido

Cada sección guarda sus datos en su propio componente, dentro de `features/`.
Los colores de los temas viven en `app/globals.css` y mis datos en `lib/site.ts`.
Los textos se escriben como `{ es: "...", en: "..." }`.

## Pendientes

Móvil, el texto de Sobre mí y el correo de contacto. Las métricas de Trayectoria
son cifras de ejemplo.
