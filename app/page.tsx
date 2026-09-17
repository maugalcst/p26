import HeroReveal from "@/features/hero/HeroReveal";
import ProjectsSection from "@/features/projects/ProjectsSection";
import ExperienceSection from "@/features/experience/ExperienceSection";
import StackSection from "@/features/stack/StackSection";
import AboutSection from "@/features/about/AboutSection";

export default function Home() {
  return (
    <main>
      <HeroReveal />
      <ProjectsSection />
      <ExperienceSection />
      <StackSection />
      <AboutSection />
    </main>
  );
}
