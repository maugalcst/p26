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
      <section className="sample-fraunces">
        <h2>Fraunces — Textos de muestra</h2>
        <p className="meta">
          Serif expresiva con optical sizing — Undercase Type · OFL
        </p>
        <p className="lede">
          Hay serif que solo acompañan y hay serif que tienen opinión.
          Fraunces pertenece a la segunda clase: escribe con una pluma, no
          con un bolígrafo.
        </p>
        <p>
          Heredera de la tipografía expresiva de principios del siglo XX,
          Fraunces guarda un secreto: su eje óptico. En los tamaños de
          titular despliega su carácter — la «w» canchera, los terminales
          redondeados — y en el cuerpo se recoge, baja el contraste y sube
          la x para dejar de ser espectáculo y volverse lectura. Cambia de
          voz según el contexto sin cambiar de nombre.
        </p>
        <p>
          Es el contraste justo para una página que quiere sentirse artesanal
          sin ser decorativa. Sus serif cuelgan como los de una revista
          independiente: las notas al margen, los pull quotes, la primera
          línea de un capítulo. Combínala con una grotesca como Satoshi y la
          jerarquía se dibuja sola.
        </p>
        <p>
          Aquí, al tamaño del cuerpo, apenas se intuye su temperamento: es
          el susurro de una fuente que sabe gritar.{" "}
          <Link href="/sobre-mi">Un enlace en el cuerpo</Link> se mantiene
          tan legible como la voz que lo rodea.
        </p>
      </section>
      <section className="sample-literata">
        <h2>Literata — Textos de muestra</h2>
        <p className="meta">
          Serif de lectura continua en pantalla — TypeTogether · OFL
        </p>
        <p className="lede">
          Newsreader lee el periódico; Literata lee la novela. Fue creada
          para Google Play Books y pensada para una sola cosa: que una
          historia de diez mil palabras se lea sin que el ojo se canse.
        </p>
        <p>
          Nació como la tipografía de los libros digitales de Google y hoy,
          en su tercera versión, es una familia variable con cortes de
          titular, cuerpo y leyenda. Su x es alta, su contraste moderado y
          su ritmo recuerda a la imprenta de toda la vida sin renunciar a
          la nitidez de una pantalla moderna.
        </p>
        <p>
          Literata resuelve un problema que los serif clásicos arrastran en
          digital: la cursiva. En lugar de una letra inclinada que se
          desdibuja en la cuadrícula de píxeles, usa una cursiva erguida,
          legible a cualquier tamaño. Es el tipo de decisión que solo se
          toma cuando la lectura continua es el objetivo y no un efecto
          secundario.
        </p>
        <p>
          Por eso su lugar natural es el texto largo: el artículo, el
          ensayo, la documentación. Y un{" "}
          <Link href="/sobre-mi">enlace en el cuerpo</Link> se mantiene tan
          firme como el resto de la línea.
        </p>
      </section>
      <section className="sample-source-serif">
        <h2>Source Serif 4 — Textos de muestra</h2>
        <p className="meta">
          Transicional con optical sizing — Adobe Originals · OFL
        </p>
        <p className="lede">
          La respuesta a la pregunta de siempre: ¿qué pasa si quiero un
          serif que además se lleve bien con mi sans? Aquí la solución es
          una superfamilia que comparte esqueleto.
        </p>
        <p>
          Source Serif 4 es la serif transicional de Adobe, dibujada por
          Frank Grießhammer como compañera de Source Sans. Comparten
          estructura, proporciones y peso: son un par hecho a medida, el
          ejemplo perfecto de cómo combinar sans y serif sin que se
          peleen por el protagonismo.
        </p>
        <p>
          En su cuarta versión suma cinco tamaños ópticos — caption, small
          text, text, subhead y display —, así que las letras se redibujan
          según el tamaño: más anchas y espaciadas en el cuerpo, más
          apretadas y elegantes en el titular. Es una de las pocas familias
          gratuitas con ese nivel de ingeniería tipográfica.
        </p>
        <p>
          Es neutra sin ser sosa, autoritaria sin ser fría: la voz del
          cuerpo corporativo que no necesita gritar. Y el{" "}
          <Link href="/sobre-mi">enlace en el cuerpo</Link> queda tan claro
          como el resto del texto.
        </p>
      </section>
    </main>
  );
}