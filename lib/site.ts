import type { Localized } from "@/features/i18n/useLang";

// Mis datos
export const site: {
  name: string;
  handle: string;
  location: Localized<string>;
  role: Localized<string>;
} = {
  name: "Mau",
  handle: "@mau",
  location: { es: "Monterrey, México", en: "Monterrey, Mexico" },
  role: {
    es: "QA Automation Developer · Fullstack en formación",
    en: "QA Automation Developer · Fullstack in the making",
  },
};
