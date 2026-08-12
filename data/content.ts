export type StatusKind = "estable" | "en-progreso" | "learning";

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  type: string;
  start: string;
  end?: string;
  summary: string;
  highlights: string[];
  skills: string[];
}

export interface Project {
  id: string;
  title: string;
  tag: string;
  status: StatusKind;
  context: string;
  description: string;
  stack: string[];
  links?: { label: string; url: string }[];
}

export interface Skill {
  id: string;
  name: string;
  groupId: string;
  level: string;
  note: string;
  relatedProjects: string[];
}

export interface SkillGroup {
  id: string;
  label: string;
  blurb: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  details: string;
  period: string;
  status: string;
}

export const site = {
  name: "Mau",
  handle: "@mau",
  location: "Monterrey, México",
  role: "QA Automation Developer · Fullstack en formación",
};

export const experiences: Experience[] = [
  {
    id: "epicor",
    company: "Epicor Software",
    role: "QA Automation Developer",
    location: "Monterrey, México",
    type: "Tiempo completo",
    start: "junio 2026",
    end: "actual",
    summary:
      "Parte del equipo de QA Automation. Previamente interno en la misma empresa, ahora como empleado de tiempo completo.",
    highlights: [
      "Automatización de pruebas E2E con WebdriverIO.",
      "Trazabilidad de casos con Jira y Zephyr Scale.",
      "Pipelines y despliegue con Azure DevOps.",
      "Uso intensivo de GitHub Copilot y C#/.NET en el día a día.",
    ],
    skills: ["webdriverio", "jira", "zephyr", "azure-devops", "github-copilot", "dotnet-csharp"],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: "backend",
    label: "Backend",
    blurb:
      "C#, .NET, MongoDB, Docker, JWT y Clean Architecture (en progreso). Próximos proyectos: Personal Finance API y MediTriage API.",
  },
  {
    id: "frontend",
    label: "Frontend / Fullstack",
    blurb: "Next.js 15, React, TypeScript y Prisma.",
  },
  {
    id: "qa",
    label: "QA / Automation",
    blurb: "WebdriverIO, Jira, Zephyr Scale y Azure DevOps.",
  },
  {
    id: "tools",
    label: "Herramientas y entorno",
    blurb:
      "Arch Linux + Hyprland (rice propio versionado en GitHub) y GitHub Copilot / IA aplicada al desarrollo.",
  },
];

export const skills: Skill[] = [
  {
    id: "dotnet-csharp",
    name: "C# / .NET",
    groupId: "backend",
    level: "Fuerte",
    note: "Lenguaje principal en Epicor y en proyectos de portafolio.",
    relatedProjects: ["dnslabapi", "tennis-store"],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    groupId: "backend",
    level: "Intermedio",
    note: "Base de datos NoSQL usada en DnaLabApi.",
    relatedProjects: ["dnslabapi"],
  },
  {
    id: "docker",
    name: "Docker",
    groupId: "backend",
    level: "Intermedio",
    note: "Contenedorización de servicios.",
    relatedProjects: ["dnslabapi"],
  },
  {
    id: "jwt",
    name: "JWT",
    groupId: "backend",
    level: "Intermedio",
    note: "Autenticación stateless con tokens.",
    relatedProjects: ["dnslabapi"],
  },
  {
    id: "clean-architecture",
    name: "Clean Architecture",
    groupId: "backend",
    level: "En progreso",
    note: "Arquitectura para próximos proyectos.",
    relatedProjects: [],
  },
  {
    id: "personal-finance",
    name: "Personal Finance API",
    groupId: "backend",
    level: "Planificado",
    note: "Próximo proyecto de backend.",
    relatedProjects: [],
  },
  {
    id: "meditriage",
    name: "MediTriage API",
    groupId: "backend",
    level: "Planificado",
    note: "Próximo proyecto de backend.",
    relatedProjects: [],
  },
  {
    id: "nextjs",
    name: "Next.js 15",
    groupId: "frontend",
    level: "Intermedio",
    note: "Framework del sistema de asignación de salones y de este sitio.",
    relatedProjects: ["servicio-social"],
  },
  {
    id: "react",
    name: "React",
    groupId: "frontend",
    level: "Intermedio",
    note: "UI en aplicaciones fullstack.",
    relatedProjects: ["servicio-social"],
  },
  {
    id: "typescript",
    name: "TypeScript",
    groupId: "frontend",
    level: "Intermedio",
    note: "Tipado seguro en frontend y backend.",
    relatedProjects: ["servicio-social"],
  },
  {
    id: "prisma",
    name: "Prisma",
    groupId: "frontend",
    level: "Intermedio",
    note: "ORM usado con Next.js.",
    relatedProjects: ["servicio-social"],
  },
  {
    id: "webdriverio",
    name: "WebdriverIO",
    groupId: "qa",
    level: "Fuerte",
    note: "Herramienta principal de automatización E2E.",
    relatedProjects: ["draftagent"],
  },
  {
    id: "jira",
    name: "Jira",
    groupId: "qa",
    level: "Fuerte",
    note: "Gestión de tickets y trazabilidad.",
    relatedProjects: ["draftagent"],
  },
  {
    id: "zephyr",
    name: "Zephyr Scale",
    groupId: "qa",
    level: "Intermedio",
    note: "Gestión de casos de prueba.",
    relatedProjects: [],
  },
  {
    id: "azure-devops",
    name: "Azure DevOps",
    groupId: "qa",
    level: "Intermedio",
    note: "Pipelines y CI.",
    relatedProjects: [],
  },
  {
    id: "arch-hyprland",
    name: "Arch Linux + Hyprland",
    groupId: "tools",
    level: "Personal",
    note: "Rice propio versionado en GitHub, entorno diario.",
    relatedProjects: ["tnews"],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot / IA",
    groupId: "tools",
    level: "Diario",
    note: "IA aplicada al desarrollo, base de DraftAgent.",
    relatedProjects: ["draftagent"],
  },
];

export const projects: Project[] = [
  {
    id: "draftagent",
    title: "DraftAgent",
    tag: "Sistema interno · Epicor",
    status: "estable",
    context: "Epicor",
    description:
      "Sistema interno en Epicor que genera drafts de specs de WebdriverIO a partir de tickets de Jira, usando el sistema nativo de instrucciones de GitHub Copilot (.github/copilot-instructions.md, .instructions.md, .prompt.md).",
    stack: ["WebdriverIO", "Jira", "GitHub Copilot"],
    links: [],
  },
  {
    id: "dnslabapi",
    title: "DnaLabApi",
    tag: "Portafolio",
    status: "estable",
    context: "Proyecto de portafolio",
    description:
      "API backend en .NET con CRUD completo, JWT, Docker y MongoDB.",
    stack: [".NET", "C#", "MongoDB", "Docker", "JWT"],
    links: [],
  },
  {
    id: "tennis-store",
    title: "Tennis Store API",
    tag: "Aprendizaje",
    status: "learning",
    context: "Proyecto de aprendizaje",
    description: "API backend en .NET como proyecto de aprendizaje backend.",
    stack: [".NET", "C#"],
    links: [],
  },
  {
    id: "tnews",
    title: "tnews",
    tag: "CLI / Local",
    status: "estable",
    context: "Proyecto personal",
    description:
      "CLI en terminal que resume noticias usando Ollama/llama3.2 corriendo localmente.",
    stack: ["Ollama", "llama3.2", "CLI"],
    links: [],
  },
  {
    id: "servicio-social",
    title: "Sistema de asignación de salones",
    tag: "Servicio Social · FIME",
    status: "estable",
    context: "Servicio Social, FIME-UANL",
    description:
      "Sistema en Next.js 15 + Prisma para la asignación de salones.",
    stack: ["Next.js 15", "React", "TypeScript", "Prisma"],
    links: [],
  },
];

export const education: Education[] = [
  {
    id: "fime-uanl",
    school: "FIME-UANL",
    degree: "Ingeniería en Tecnologías de Software",
    period: "Último semestre",
    status: "Gradua diciembre 2026",
    details:
      "Actualmente cursando el último semestre. Gradúa en diciembre de 2026.",
  },
];

export function getExperience(id: string): Experience | undefined {
  return experiences.find((e) => e.id === id);
}
export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
export function getSkill(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}
export function getSkillGroup(id: string): SkillGroup | undefined {
  return skillGroups.find((g) => g.id === id);
}