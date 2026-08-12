import Link from "next/link";
import { skillGroups, skills } from "@/data/content";

export default function SkillsIndex() {
  return (
    <main>
      <h1>Skills</h1>
      <nav>
        <ul>
          {skillGroups.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`}>{g.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      {skillGroups.map((g) => (
        <section key={g.id} id={g.id}>
          <h2>{g.label}</h2>
          <p>{g.blurb}</p>
          <ul>
            {skills
              .filter((s) => s.groupId === g.id)
              .map((s) => (
                <li key={s.id}>
                  <Link href={`/skills/${s.id}`}>{s.name}</Link> — {s.level}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}