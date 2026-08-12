import Link from "next/link";
import { education, getExperience } from "@/data/content";

export function generateStaticParams() {
  return education.map((e) => ({ id: e.id }));
}

export default async function EducationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = education.find((x) => x.id === id);
  if (!e) return <p>No encontrada.</p>;
  const exp = getExperience("epicor");

  return (
    <main>
      <Link href="/educacion">← Educación</Link>
      <h1>{e.degree}</h1>
      <p>{e.school} · {e.period}</p>
      <p>{e.details}</p>
      {exp && (
        <p>
          Primer empleo en {exp.company} ({exp.start}) durante la carrera.
        </p>
      )}
    </main>
  );
}