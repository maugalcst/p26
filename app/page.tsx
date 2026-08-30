import HeroReveal from "@/features/hero/HeroReveal";
import ProjectsSection from "@/features/projects/ProjectsSection";
import ExperienceSection from "@/features/experience/ExperienceSection";

export default function Home() {
  return (
    <main>
      <HeroReveal />
      <ProjectsSection />
      <ExperienceSection />
    </main>
  );
}
