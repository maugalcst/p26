import Link from "next/link";
import { site, experiences, projects, skillGroups, education } from "@/data/content";

export default function Home() {
  return (
    <main>
      <h1 className="display">{site.name} — Portafolio 2026</h1>
      <p className="meta">
        {site.role} · {site.location}
      </p>

      <section>
        <h2>Experiencia</h2>
        <ul>
          {experiences.map((e) => (
            <li key={e.id}>
              <Link href={`/experiencia/${e.id}`}>
                {e.role} en {e.company}
              </Link>{" "}
              — {e.location}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Proyectos</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/proyectos/${p.id}`}>{p.title}</Link> — {p.tag}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Skills</h2>
        <ul>
          {skillGroups.map((g) => (
            <li key={g.id}>
              <Link href={`/skills#${g.id}`}>{g.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Educación</h2>
        <ul>
          {education.map((e) => (
            <li key={e.id}>
              <Link href={`/educacion/${e.id}`}>
                {e.degree}, {e.school}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    <section>
        <h2>Textos de muestra</h2>
        <p className="meta">Párrafos de relleno para revisar el cuerpo — borrar antes de publicar</p>
        <p>
          La tipografía es el arte de ordenar el lenguaje. No se trata solo de
          que las letras sean legibles, sino de que el ritmo con el que caen en
          la página sostenga la atención de quien lee. Una buena medida de columna,
          una interlínea generosa y una escala discreta hacen más por un texto que
          cualquier adorno decorativo.
        </p>
        <p>
          Cuando abres un libro, una revista o una página web, tu ojo no lee
          letra por letra: lee formas, detecta patrones y deja que los espacios
          en blanco le digan dónde termina una idea y empieza otra. El espacio es
          el silencio del texto, y el silencio, bien medido, es lo que hace que
          las palabras suenen. Por eso un encabezado se acerca a su párrafo y se
          aleja del anterior: la proximidad también es semántica.
        </p>
        <p>
          Esta franja está pensada para probar el cuerpo en Satoshi a distintas
          longitudes: párrafos que apenas completan una línea, frases de ancho
          medio y bloques largos que obligan a la última línea a quedarse sola.
          Presta atención a las viudas y a los cortes de línea — si algo se siente
          suelto, es el momento de tocar la medida, no el color.
        </p>
        <p>
          Y si te desvías, no está mal: la regla es empezar con lo clásico y
          romperlo con intención. Un{" "}
          <Link href="/sobre-mi">enlace en el cuerpo</Link> debe decirse a sí
          mismo — subrayado limpio, monoespaciado, sin depender del color para
          existir. Este texto es un placeholder para que veas cómo se comporta
          todo junto antes de escribir de verdad.
        </p>
      </section>
    </main>
  );
}