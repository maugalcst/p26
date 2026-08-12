import Link from "next/link";
import { education } from "@/data/content";

export default function EducationIndex() {
  return (
    <main>
      <h1>Educación</h1>
      <ul>
        {education.map((e) => (
          <li key={e.id}>
            <Link href={`/educacion/${e.id}`}>
              {e.degree}, {e.school}
            </Link>{" "}
            · {e.status}
          </li>
        ))}
      </ul>
    </main>
  );
}