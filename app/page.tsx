import Link from "next/link";
import { site, experiences, projects, skillGroups, education } from "@/data/content";

export default function Home() {
  return (
    <main>
      <h1>{site.name} — Portafolio 2026</h1>
      <p>
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
    </main>
  );
}