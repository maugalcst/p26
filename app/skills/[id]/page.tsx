import Link from "next/link";
import { skills, getSkill, getSkillGroup, getProject } from "@/data/content";

export function generateStaticParams() {
  return skills.map((s) => ({ id: s.id }));
}

export default async function SkillDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getSkill(id);
  if (!s) return <p>Skill no encontrada.</p>;
  const g = getSkillGroup(s.groupId);

  return (
    <main>
      <Link href="/skills">← Skills</Link>
      <h1>{s.name}</h1>
      {g && <p><span className="meta">Grupo: {g.label}</span></p>}
      <p><span className="meta">Nivel: {s.level}</span></p>
      <p>{s.note}</p>
      {s.relatedProjects.length > 0 && (
        <>
          <h2>Proyectos relacionados</h2>
          <ul>
            {s.relatedProjects.map((pid) => {
              const p = getProject(pid);
              return (
                <li key={pid}>
                  {p ? <Link href={`/proyectos/${p.id}`}>{p.title}</Link> : pid}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}