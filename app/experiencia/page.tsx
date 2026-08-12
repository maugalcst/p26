import Link from "next/link";
import { experiences } from "@/data/content";

export default function ExperiencesIndex() {
  return (
    <main>
      <h1>Experiencia</h1>
      <ul>
        {experiences.map((e) => (
          <li key={e.id}>
            <Link href={`/experiencia/${e.id}`}>
              {e.role} en {e.company}
            </Link>{" "}
            — <span className="meta">{e.location} · {e.start}–{e.end}</span>
            <p>{e.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}