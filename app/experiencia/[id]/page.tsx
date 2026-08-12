import Link from "next/link";
import { experiences, getExperience, getSkill } from "@/data/content";

export function generateStaticParams() {
  return experiences.map((e) => ({ id: e.id }));
}

export default async function ExperienceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exp = getExperience(id);
  if (!exp) return <p>No encontrada.</p>;

  return (
    <main>
      <Link href="/experiencia">← Experiencia</Link>
      <h1>
        {exp.role} en {exp.company}
      </h1>
      <p>
        <span className="meta">{exp.type} · {exp.location} · {exp.start}–{exp.end}</span>
      </p>
      <p>{exp.summary}</p>
      <h2>Responsabilidades</h2>
      <ul>
        {exp.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <h2>Stack</h2>
      <ul>
        {exp.skills.map((sid) => {
          const s = getSkill(sid);
          return (
            <li key={sid}>
              <Link href={`/skills/${sid}`}>{s ? s.name : sid}</Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}