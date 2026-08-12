import Link from "next/link";
import { projects, getProject } from "@/data/content";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return <p>Proyecto no encontrado.</p>;

  return (
    <main>
      <Link href="/proyectos">← Proyectos</Link>
      <h1>{p.title}</h1>
      <p>{p.tag} · {p.context}</p>
      <p>{p.description}</p>
      <h2>Stack</h2>
      <ul>
        {p.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {p.links && p.links.length > 0 && (
        <>
          <h2>Enlaces</h2>
          <ul>
            {p.links.map((l) => (
              <li key={l.label}>
                <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}