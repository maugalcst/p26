import Link from "next/link";
import { projects } from "@/data/content";

export default function ProjectsIndex() {
  return (
    <main>
      <h1>Proyectos</h1>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <Link href={`/proyectos/${p.id}`}>{p.title}</Link> — {p.tag}
            <p>{p.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}